import { arc, max } from 'd3'
import { attrTween } from '../utils/tweens'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Color from '../components/color'
import Description from '../components/description'
import Font from '../components/font'
import Label from '../components/label'
import Highlight from '../components/highlight'
import Mouse from '../components/mouse'
import Placeholder from '../components/placeholder'
import PointTooltip from '../components/tooltip/point-tooltip'
import Scale from '../components/scale'
import Widget from '../components/widget'

/**
 * The coxcomb chart widget. The chart extends the following components:
 * <ul>
 *   <li><a href="../components/color.html">Color</a></li>
 *   <li><a href="../components/description.html">Description</a></li>
 *   <li><a href="../components/font.html">Font</a></li>
 *   <li><a href="../components/label.html">Label</a></li>
 *   <li><a href="../components/highlight.html">Highlight</a>: plot groups can be highlighted by passing their names
 *   as specified in the data array.</li>
 *   <li><a href="../components/mouse.html">Mouse</a>: The group name and the wedge {y} value is passed to each mouse
 *   callback.</li>
 *   <li><a href="../components/placeholder.html">Placeholder</a></li>
 *   <li><a href="../components/point-tooltip.html">PointTooltip</a>: The tooltip has the wedge {x} value as title and
 *   each plot group's {y} value as values.</li>
 *   <li><a href="../components/widget.html">Widget</a></li>
 * </ul>
 *
 * @function CoxcombChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Defaults.
  const DEFAULTS = {
    radius: 100,
    angle: 0
  }

  let { self, api } = compose(
    Widget('coxcomb-chart', name, parent, 'svg'),
    Color,
    Description,
    Font,
    Highlight(() => _.plots, ['.wedge']),
    Label,
    Mouse,
    Placeholder,
    PointTooltip
  )

  // Private members
  const _ = {
    // Scale for the wedges.
    scale: Scale('sqrt'),

    arc: arc(),
    radius: DEFAULTS.radius,
    angle: DEFAULTS.angle,
    data: [],
    current: undefined,
    plots: self._widget.content.append('g')
      .attr('class', 'dalian-plot-container'),

    labelArc (d) {
      return `M${d.outerRadius * Math.sin(d.startAngle)},${-d.outerRadius * Math.cos(d.startAngle)}A${d.outerRadius},${d.outerRadius},0,0,1,${d.outerRadius * Math.sin(d.endAngle)},${-d.outerRadius * Math.cos(d.endAngle)}`
    },

    updateWedges (selection, t) {
      return selection
        .attr('class', d => `wedge ${encode(d.name)}`)
        .order()
        // Mouse events that are attached through the API.
        .on('mouseover.chart', d => self._mouse.over({
          name: d.name,
          y: d.y
        }))
        .on('mouseleave.chart', d => self._mouse.leave({
          name: d.name,
          y: d.y
        }))
        .on('click.chart', d => self._mouse.click({
          name: d.name,
          y: d.y
        }))
        .transition(t)
        .attr('fill', self._color.mapper)
        .attrTween('d', attrTween(d => _.arc(d)))
    },

    // Update method.
    update (duration) {
      // Update size scale.
      const maxValue = max(_.data.map(d => d.data).flat().map(d => d.y))
      _.scale.range(0, _.radius)
        .domain([0, maxValue])

      // Scale values.
      _.data.map(d => {
        d.data.map(dd => Object.assign(dd, {
          outerRadius: _.scale.scale(dd.y || 0)
        }))

        d.outerRadius = Math.max(0.6 * _.radius, _.scale.scale(max(d.data, dd => dd.y || 0))) +
          0.5 * parseFloat(self._font.size)
      })

      // Plot transition.
      const t = _.plots.transition().duration(duration)

      // Add label paths.
      self._widget.getDefs().selectAll('.wedge-label-path')
        .data(_.data, d => d.index)
        .join(
          enter => enter.append('path')
            .attr('class', 'wedge-label-path')
            .attr('id', d => `${self._widget.id}-wedge-${d.index}`)
            .attr('stroke', 'red')
            .attr('d', _.labelArc),
          update => update,
          exit => exit
            // Dummy transition to make sure label is faded out when this is removed.
            .transition().duration(duration)
            .remove()
        )
        .transition().duration(duration)
        .attrTween('d', attrTween(d => _.labelArc(d)))

      // Add wedges.
      const wedges = _.plots.selectAll('.wedge-group')
        .data(_.data, d => d.index)
        .join(
          enter => enter.append('g')
            .attr('class', 'wedge-group')
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2}) rotate(${_.angle})`)
            .style('opacity', 0)
            .call(g => {
              // Paths.
              const paths = g.selectAll('path')
                .data(d => d.data)
                .enter().append('path')
                .attr('stroke', 'white')
              _.updateWedges(paths, t)

              // Labels.
              g.append('text')
                .attr('text-anchor', 'middle')
                .append('textPath')
                .attr('href', d => `#${self._widget.id}-wedge-${d.index}`)
                .attr('method', 'stretch')
                .attr('startOffset', '50%')
            }),
          update => update
            .call(g => {
              // Update wedges.
              const paths = g.selectAll('path')
                .data(d => d.data)
                .join(
                  enter => enter.append('path')
                    .attr('stroke', 'white')
                    .style('opacity', 0),
                  update => update,
                  exit => exit.transition(t)
                    .style('opacity', 0)
                    .remove()
                )
              _.updateWedges(paths, t)
                .style('opacity', 1)
            }),
          exit => exit.transition(t)
            .style('opacity', 0)
            .remove()
        )
        // Mouse events for keeping track of the current wedge.
        .on('mouseover.coxcomb', d => {
          _.current = d
        })
        .on('mouseleave.coxcomb', () => {
          _.current = undefined
        })
        .transition(t)
        .style('opacity', 1)
        .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2}) rotate(${_.angle})`)

      // Update labels.
      wedges.select('text')
        .style('display', self._label.show ? null : 'none')
        .select('textPath')
        .text(self._label.format)

      // Update plot container.
      _.plots.style('pointer-events',
        ((self._tooltip && self._tooltip.isOn()) || self._mouse.hasAny()) ? 'all' : 'none')
    }
  }

  // Override.
  self._tooltip.content = () => typeof _.current === 'undefined' ? undefined : {
    title: _.current.label,
    content: {
      data: _.current.data.map(d => ({
        name: d.name,
        background: self._color.mapper(d),
        y: d.y
      }))
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update)

  api = Object.assign(api || {}, {
    data (data) {
      // Collect X values.
      const xValues = Array.from(data.reduce((set, d) => new Set([...set, ...d.values.map(v => v.x)]), new Set()))
        .sort((a, b) => a - b)

      // Transpose data.
      const numWedges = xValues.length
      _.data = xValues.map((label, index) => {
        const startAngle = index * 2 * Math.PI / numWedges
        const endAngle = (index + 1) * 2 * Math.PI / numWedges

        return {
          index,
          // TODO Move this under a property.
          label,
          padAngle: 0,
          startAngle,
          endAngle,
          innerRadius: 0,
          data: data.map(d => {
            const w = d.values.find(v => v.x === label)
            return {
              label,
              name: d.name,
              padAngle: 0,
              startAngle,
              endAngle,
              innerRadius: 0,
              y: (w && w.y) || null
            }
          }).sort((a, b) => b.y - a.y)
        }
      })

      // TODO If two values are two close, add little disturbance.

      return api
    },

    /**
     * Sets the maximum radius of the chart.
     *
     * @method radius
     * @methodOf CoxcombChart
     * @param {number} [radius = 100] Radius to set in pixels.
     * @returns {CoxcombChart} Reference to the CoxcombChart API.
     * @example
     *
     * // Set radius to 50px.
     * const coxcomb = dalian.CoxcombChart('my-chart')
     *   .radius(5)
     *   .render()
     *
     * // Reset radius to default.
     * coxcomb.radius()
     *   .render()
     */
    radius (radius = DEFAULTS.radius) {
      _.radius = radius
      return api
    },

    /**
     * Sets the start angle of the chart (first wedge).
     *
     * @method angle
     * @methodOf CoxcombChart
     * @param {number} [angle = 0] Start angle in degrees measured from the top of the vertical center of the chart.
     * @returns {CoxcombChart} Reference to the CoxcombChart API.
     * @example
     *
     * // Set start angle to 90°.
     * const coxcomb = dalian.CoxcombChart('my-chart')
     *   .angle(90)
     *   .render()
     *
     * // Reset angle to default.
     * coxcomb.angle()
     *   .render()
     */
    angle (angle = DEFAULTS.angle) {
      _.angle = angle
      return api
    }

    /**
     * Sets the data that is shown in the coxcomb chart. In the chart, each group of wedges with the same color is a
     * plot group in itself, so all methods that operate on plot groups are applied on them.
     *
     * @method data
     * @methodOf CoxcombChart
     * @param {Object[]} plots Array of objects representing the groups of wedges to show. Each group has two
     * properties:
     * <dl>
     *   <dt>name</dt>   <dd>{string} Group name.</dd>
     *   <dt>values</dt> <dd>{number} Group values.</dd>
     * </dl>
     * The {values} property is an array of objects of the following structure:
     * <dl>
     *   <dt>x</dt> <dd>{number} Wedge label</dd>
     *   <dt>y</dt> <dd>{number} Wedge value..</dd>
     * </dl>
     * The value of {y} for missing {x} coordinates are replaced by {null} and are not shown on the chart.
     * @returns {CoxcombChart} Reference to the CoxcombChart API.
     * @example
     *
     * const coxcomb = dalian.CoxcombChart('my-chart')
     *   .data([{
     *     name: 'wedges 1',
     *     values: [
     *       {x: 'Mon', y: 2.3},
     *       {x: 'Tue', y: 2.1},
     *       {x: 'Wed', y: 2.5},
     *       ...
     *     ]
     *   }, {
     *     name: 'wedges 2',
     *     values: [
     *       {x: 'Mon', y: 7.1},
     *       {x: 'Wed', y: 2.4},
     *       ...
     *     ]
     *   } ... ])
     *   .render()
     */
  })

  return api
}
