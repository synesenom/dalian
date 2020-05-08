import { extent, max, voronoi } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Opacity from '../components/opacity'
import Scale from '../components/scale'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'

/**
 * The bubble chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/point-tooltip.html">ElementTooltip</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Bubbles can be highlighted by passing their names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/x-range.html">XRange</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function ScatterPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  let scales = {
    x: Scale('linear'),
    y: Scale('linear'),
    size: Scale('sqrt')
  }
  let { self, api } = compose(
    Chart('bubble-chart', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    Opacity(0.6),
    XRange,
    YRange
  )

  // Private members
  let _ = {
    // Variables
    scales,
    current: undefined,
    diagram: undefined,

    // UI elements.
    radius: 30,
    labels: false,
    // TODO Label format takes the full data point d.
    labelFormat: name => name,

    // Calculations.
    computeDiagram: data => voronoi()
        .x(d => _.scales.x.scale(d.value.x))
        .y(d => _.scales.y.scale(d.value.y))
        .extent([[0, 0], [parseInt(self._widget.size.innerWidth), parseInt(self._widget.size.innerHeight)]])(data),

    // Update.
    update (duration) {
      // Determine boundaries.
      // TODO Make this a utility.
      const flatData = self._chart.data.map(d => d.value).flat()

      // Update size scale.
      const sizeMax = max(flatData.map(d => d.size))
      _.scales.size.range(0, _.radius)
        .domain([0, sizeMax])

      // Init scales.
      // TODO Make this a utility as used by several places: ScatterPlot.
      let xRange = extent(flatData.map(d => d.x))
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(xRange)
      let yRange = extent(flatData.map(d => d.y))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(yRange)

      // Adjust scales with sizes.
      xRange = flatData.map(d => {
        let dx = _.scales.x.measure(1.5 * _.scales.size.scale(d.size))
        return [d.x - dx, d.x + dx]
      }).flat()
      _.scales.x.domain(self._xRange.range(xRange))
      yRange = flatData.map(d => {
        let dy = _.scales.y.measure(1.5 * _.scales.size.scale(d.size))
        return [d.y - dy, d.y + dy]
      }).flat()
      _.scales.y.domain(self._yRange.range(yRange))

      // Add bubbles.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            .on('mouseover.bubble', d => {
              _.current = d
            })
            .on('mouseleave.bubble', () => {
              _.current = undefined
            })
            .style('color', self._color.mapper)

          // Add bubble.
          // TODO Add label.
          g.append('circle')
            .attr('class', 'bubble')
            .attr('cx', d => _.scales.x.scale(d.value.x))
            .attr('cy', d => _.scales.y.scale(d.value.y))
            .attr('r', d => _.scales.size.scale(d.value.size))
            .attr('stroke', 'currentColor')
            .attr('fill', 'currentColor')
            .raise()

          return g
        },
        update: g => {
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          g.select('.bubble')
            .attr('cx', d => _.scales.x.scale(d.value.x))
            .attr('cy', d => _.scales.y.scale(d.value.y))
            .attr('r', d => _.scales.size.scale(d.value.size))
            .attr('fill-opacity', self._opacity.value())

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)

      // Update Voronoi tessellation.
      _.diagram = _.computeDiagram(self._chart.data)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      return
    }

    // Find closest site.
    let site = _.diagram.find(mouse[0], mouse[1], 20)
    site = (site && site.data) || _.current
    if (!site) {
      return
    }

    return {
      title: site.name,
      stripe: self._color.mapper(site),
      content: {
        data: [
          {name: self._bottomAxis.label(), value: site.value.x},
          {name: self._leftAxis.label(), value: site.value.y},
          // TODO Add size label.
          {name: 'size', value: site.value.size}
        ]
      }
    }
  }

  self._chart.transformData = data => data.sort((a, b) => b.value.size - a.value.size)

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the maximum radius in pixels for the bubbles.
     *
     * @method radius
     * @methodOf BubbleChart
     * @param {number} [radius = 30] Maximum radius in pixels.
     * @returns {Object} Reference to the BubbleChart API.
     */
    radius: (radius = 30) => {
      _.radius = radius
      return api
    },

    /**
     * Shows labels next to the bubbles. The labels can represent arbitrary content.
     *
     * @method labels
     * @methodOf BubbleChart
     * @param {boolean} [on = false] Whether to show labels.
     * @returns {Object} Reference to the BubbleChart API.
     */
    labels (on = false) {
      _.labels = on
      return api
    },

    // TODO Remove labelFormat and use label as the direct formatter and if it is empty, don't show labels.
    /**
     * Sets the format of the labels.
     *
     * @method labelFormat
     * @methodOf BubbleChart
     * @param {Function} [format = x => x.name] The format of the value labels. May take the bubble's data point
     * as parameter.
     * @returns {Object} Reference to the BubbleChart API.
     */
    labelFormat (format = x => x.name) {
      _.labelFormat = format
      return api
    }
  })

  return api

  /**
   * Set/updates the chart data. Each bubble is a plot group in itself, so all methods that operate on plot groups are
   * applied on the bubble level.
   *
   * @method data
   * @methodOf BubbleChart
   * @param {Object[]} plots Array of objects representing the bubbles to show. Each bubble has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{Object} <i>value</i>: Category value.</li>
   * </ul>
   * The <i>value</i> property is an object with the following structure:
   * <dl>
   *   <dt><i>x</i> {number}</dt> <dd>Horizontal coordinate of the bubble.</dd>
   *   <dt><i>y</i> {number}</dt> <dd>Vertical coordinate of the bubble.</dd>
   *   <dt><i>size</i> {number}</dt> <dd>Bubble size. Note that the bubble is scaled so that its area will be
   *   proportional to this value.</dd>
   * </dl>
   * @returns {BubbleChart} Reference to the BubbleChart API.
   */
}
