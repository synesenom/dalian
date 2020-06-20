import { arc, max } from 'd3'
import {attrTween} from '../utils/tweens'
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

// TODO Add PointTooltip
export default (name, parent = 'body') => {
  // Defaults.
  const DEFAULTS = {
    radius: 100
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

    // Style variables.
    arc: arc(),
    radius: DEFAULTS.radius,
    data: [],
    plots: self._widget.content.append('g')
      .attr('class', 'dalian-plot-container'),

    updateWedges (selection, t) {
      return selection
        .attr('class', d => `wedge ${encode(d.name)}`)
        .order()
        .on('mouseover.coxcomb', d => self._mouse.over({
          name: d.name,
          value: d.value
        }))
        .on('mouseleave.coxcomb', d => self._mouse.leave({
          name: d.name,
          value: d.value
        }))
        .on('click.coxcomb', d => self._mouse.click({
          name: d.name,
          value: d.value
        }))
        .transition(t)
        .attr('fill', self._color.mapper)
        .attrTween('d', attrTween(d => _.arc(d)))
    },

    // Update method.
    update (duration) {
      // Update size scale.
      const maxValue = max(_.data.map(d => d.data).flat().map(d => d.value))
      _.scale.range(0, _.radius)
        .domain([0, maxValue])

      // Scale values.
      _.data.map(d => d.data.map(dd => Object.assign(dd, {
        outerRadius: _.scale.scale(dd.value)
      })))

      // Add wedges.
      const t = _.plots.transition().duration(duration)
      _.plots.selectAll('.wedge-group')
        .data(_.data, d => d.index)
        .join(
          enter => enter.append('g')
            .attr('class', 'wedge-group')
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
            .style('opacity', 0)
            .call(g => {
                let paths = g.selectAll('path')
                  .data(d => d.data)
                  .enter().append('path')
                  .attr('stroke', 'white')

                return _.updateWedges(paths, t)
              }
            ),
          update => update
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
            .call(g => {
                let paths = g.selectAll('path')
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

                return _.updateWedges(paths, t)
                  .style('opacity', 1)
              }
            ),
          exit => exit.transition(t)
            .style('opacity', 0)
            .remove()
        )
        .transition(t)
        .style('opacity', 1)

      // Update plot container.
      _.plots.style('pointer-events', ((self._tooltip && self._tooltip.isOn()) || self._mouse.hasAny()) ? 'all' : 'none')
    }
  }

  // TODO Tooltip. Which one?


  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update)

  api = Object.assign(api || {}, {
    data (data) {
      // Collect X values.
      const xValues = Array.from(data.reduce((set, d) => new Set([...set, ...d.values.map(v => v.x)]), new Set()))
        .sort((a, b) => a - b)

      // Transpose data.
      const numWedges = xValues.length
      _.data = xValues.map((x, i) => ({
        index: i,
        data: data.map(d => {
          let w = d.values.find(v => v.x === x)
          return {
            name: d.name,
            padAngle: 0,
            startAngle: i * 2 * Math.PI / numWedges,
            endAngle: (i + 1) * 2 * Math.PI / numWedges,
            innerRadius: 0,
            value: (w && w.y) || 0
          }
        }).sort((a, b) => b.value - a.value)
      }))

      // TODO If two values are two close, add little disturbance.

      return api
    },

    /**
     * Sets the maximum radius of the chart.
     *
     * @method radius
     * @methodOf CoxcombChart
     * @param {number} [radius = 100] Radius to set in pixels.
     * @returns {PieChart} Reference to the PieChart API.
     *
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
    }
  })

  return api
}
