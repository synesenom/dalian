import { arc, pie } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import brightnessAdjustedColor from '../utils/brightness-adjusted-color'
import { measureText } from '../utils/measure-text'
import { attrTween } from '../utils/tween'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Label from '../components/label'

/**
 * The pie chart widget. As a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of its
 * available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="./components/element-tooltip.html">ElementTooltip</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Slices can be highlighted by passing their category names as
 *     specified in the data array.
 *   </li>
 *   <li>
 *     <a href="../components/label.html">Label</a> Labels are shown inside the slice if they fit in, otherwise they are
 *     shown outside.
 *   </li>
 * </ul>
 *
 * By changing the inner radius of the chart, this widget doubles as a donut chart.
 *
 * @function PieChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  let { self, api } = compose(
    Chart('pie-chart', name, parent),
    ElementTooltip,
    Highlight(['.plot-group']),
    Label
  )

  // Private members
  let _ = {
    // Style variables.
    innerRadius: 0,
    outerRadius: 100,

    // Currently hovered wedge.
    current: undefined,

    // Arc function.
    arc: null,

    // Label related variables.
    labels: {
      format: () => '',
      left: d => 0.5 * (d.startAngle + d.endAngle) > Math.PI,
      arcs: {
        inner: null,
        outer: null
      }
    },
    numSlices: 0,

    // Methods
    measure: (d, i, style) => {
      // Measure the diameter of the label's rectangle
      const m = measureText(self._label.format(d), style)
      const textSize = Math.sqrt(m.width * m.width + m.height * m.height)

      // Estimate the slice's radius at the label's position. This is definitely not true for large angles but we
      // truncate the value at the mean radius anyway, so it should work.
      const sliceSize = Math.min(
        0.5 * (_.innerRadius + _.outerRadius) * (d.endAngle - d.startAngle),
        _.outerRadius - _.innerRadius
      )
      return {
        // Whether the label is outside or inside the slice.
        outside: 1.1 * textSize > sliceSize,

        // Horizontal position of the labels in case of collision.
        x: -0.25 * _.outerRadius * (_.numSlices - i),

        // The position of the label according to its index from the top.
        // This sorting in the positions works because we expect labels only on the left side (values are sorted
        // in the chart and small values gather at the end of the circle).
        y: -1.25 * _.outerRadius + 1.1 * m.height * (_.numSlices - 1 - i)
      }
    },

    labelLinePath: d => {
      // Start and initial middle positions of the path.
      let p1 = _.labels.arcs.inner.centroid(d)
      let r = _.labels.arcs.outer.centroid(d)

      // Adjust the vertical position of the label to make sure the label paths and labels don't overlap.
      let p21 = Math.max(r[1], d._measures.y)
      let p2 = [
        r[1] !== p1[1] ? r[0] - (r[0] - p1[0]) * (r[1] - p21) / (r[1] - p1[1]) : r[0],
        p21
      ]

      // Length of the label path horizontal part.
      let dx = 0.25 * _.outerRadius
      let p3 = [
        // Adjust the horizontal position of the path's end.
        _.labels.left(d) ? Math.min(p2[0] - dx, d._measures.x) : p2[0] + dx,
        p2[1]
      ]

      // If the last segment is in wrong direction, remove the first segment.
      if (p2[1] > p1[1]) {
        p1 = p2
      }
      return `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} L${p3[0]} ${p3[1]}`
    },

    labelTextAnchor: d => _.labels.left(d) ? 'end' : 'start',

    // Adjustment in the horizontal position to avoid overlapping labels.
    labelTextX: d => {
      let dx = 0.25 * _.outerRadius
      if (_.labels.left(d)) {
        return Math.min(_.labels.arcs.outer.centroid(d)[0] - dx, d._measures.x) - 5
      } else {
        return _.labels.arcs.outer.centroid(d)[0] + dx + 5
      }
    },

    // Adjustment in the vertical position to avoid overlapping labels.
    labelTextY: d => Math.max(_.labels.arcs.outer.centroid(d)[1], d._measures.y),

    update: duration => {
      // Compute some constants beforehand
      const style = self._widget.getStyle()

      // Create/update arc functions.
      _.arc = arc()
        .innerRadius(_.innerRadius)
        .outerRadius(_.outerRadius)
      _.labels.arcs.inner = arc()
        .innerRadius(_.outerRadius + 5)
        .outerRadius(_.outerRadius + 5)
      _.labels.arcs.outer = arc()
        .innerRadius(1.25 * _.outerRadius)
        .outerRadius(1.25 * _.outerRadius)

      // Number of visible slices.
      _.numSlices = self._chart.data.filter(d => d.value > 0).length

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)

          // Group of elements.
          let slice = g.append('g')
            .attr('class', 'slice')
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
            .on('mouseover.pie', d => {
              _.current = d
            })
            .on('mouseleave.pie', () => {
              _.current = undefined
            })
            .each((d, i) => Object.assign(d, { _measures: _.measure(d, i, style) }))

          // Add slice.
          slice.append('path')
            .attr('class', 'slice-wedge')
            .attr('d', _.arc)
            .attr('stroke-linejoin', 'round')
            .attr('stroke', 'white')
            .attr('fill', 'currentColor')

          // Add label value.
          let label = slice.append('g')
            .attr('class', 'slice-label')
            .style('display', self._label.show ? null : 'none')
          label.append('text')
            .attr('class', 'inner-label')
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('x', d => _.arc.centroid(d)[0])
            .attr('y', d => _.arc.centroid(d)[1])
            .style('cursor', 'default')
            .style('opacity', d => d._measures.outside ? 0 : 1)
            .text(d => d.value.toFixed(1))
          let outerLabel = label.append('g')
            .attr('class', 'outer-label')
            .style('opacity', d => d._measures.outside ? 1 : 0)
          outerLabel.append('path')
            .attr('class', 'outer-label-line')
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'none')
            .attr('d', _.labelLinePath)
          outerLabel.append('text')
            .attr('class', 'outer-label-text')
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', _.labelTextAnchor)
            .attr('x', _.labelTextX)
            .attr('y', _.labelTextY)
            .style('cursor', 'default')
            .text(d => d.value.toFixed(1))

          return g
        },
        update: g => {
          g.style('opacity', 1)

          // Update slices.
          let slice = g.select('.slice')
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
            .each((d, i) => Object.assign(d, { _measures: _.measure(d, i, style) }))

          slice.select('.slice-wedge')
            .attrTween('d', attrTween(d => _.arc(d)))

          let label = slice.select('.slice-label')
            .style('display', self._label.show ? null : 'none')
          label.select('.inner-label')
            .style('opacity', d => d._measures.outside ? 0 : 1)
            .attr('fill', d => brightnessAdjustedColor(self._color.mapGroup(d.name)))
            .attrTween('x', attrTween(d => _.arc.centroid(d)[0], 'x'))
            .attrTween('y', attrTween(d => _.arc.centroid(d)[1], 'y'))
            .text(self._label.format)

          let outerLabel = label.select('.outer-label')
            .style('opacity', d => d._measures.outside ? 1 : 0)
          outerLabel.select('.outer-label-line')
            .attr('stroke', self._font.color)
            .attrTween('d', attrTween(_.labelLinePath, 'r'))
          outerLabel.select('.outer-label-text')
            .attr('fill', self._font.color)
            .attrTween('text-anchor', attrTween(_.labelTextAnchor, 'align'))
            .attrTween('x', attrTween(_.labelTextX, 'x'))
            .attrTween('y', attrTween(_.labelTextY, 'y'))
            .text(self._label.format)

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  // Transform data to pie chart compatible data.
  self._chart.transformData = data => {
    const pieFn = pie().value(d => d.value).sort(null)
    return pieFn(data.sort((a, b) => b.value - a.value))
      .map(d => Object.assign(d, { name: d.data.name }))
  }

  self._highlight.container = self._chart.plots

  self._tooltip.content = () => {
    // If no wedge is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.name,
      stripe: self._color.mapGroup(_.current.name),
      content: {
        type: 'plots',
        data: [{
          name: 'value',
          value: _.current.value
        }]
      }
    }
  }

  // Extend widget update
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api, {
    /**
     * Sets the inner radius of the pie chart making it actually a donut chart.
     *
     * @method innerRadius
     * @methodOf PieChart
     * @param {number} [radius = 0] The inner radius in pixels.
     * @returns {PieChart} Reference to the PieChart API.
     */
    innerRadius: (radius = 0) => {
      _.innerRadius = radius
      return api
    },

    /**
     * Sets the outer radius of the pie chart.
     *
     * @method outerRadius
     * @methodOf PieChart
     * @param {number} [radius = 100] The outer radius in pixels. If not specified, it is set to 100.
     * @returns {PieChart} Reference to the PieChart API.
     */
    outerRadius: (radius = 100) => {
      _.outerRadius = radius
      return api
    }
  })

  return api

  // Documentation
  /**
   * Set/updates the data that is shown in the pie chart. In the pie chart, each slice is a plot group in itself, so all
   * methods that operate on plot groups are applied on the slice level.
   *
   * @method data
   * @methodOf PieChart
   * @param {Object[]} plots Array of objects representing the pie slices to show. Each slice has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{number} <i>value</i>: Category value.</li>
   * </ul>
   * @returns {PieChart} Reference to the PieChart API.
   */
}
