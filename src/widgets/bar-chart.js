import { max } from 'd3'
import { measureText } from '../utils/measure-text'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import { textTween } from '../utils/tween'
import luminanceAdjustedColor from '../utils/luminance-adjusted-color'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import YGrid from '../components/grid/y-grid'

/**
 * The bar chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [ElementTooltip]{@link ../components/element-tooltip.html},
 * [Highlight]{@link ../components/highlight.html},
 * [LeftAxis]{@link ../components/left-axis.html}.
 * [YGrid]{@link ../components/y-grid.html} (this is used for the default and horizontal modes, adapting to the
 * orientation).
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
// TODO Support negative values.
export default (name, parent = 'body') => {
  // Build widget from components
  let scales = {
    x: Scale('band'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('bar-chart', name, parent, 'svg'),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    YGrid
  )

  // Private members
  let _ = {
    // Variables
    current: undefined,
    scales: {
      x: scales.x,
      y: scales.y
    },
    horizontal: false,
    values: false,
    valueFormat: x => x.toFixed(1),

    measureX: (d, bandwidth, style) => {
      const ts = measureText(_.valueFormat(d.value), style)
      const dx = Math.max((bandwidth - ts.height) / 2, 5)
      const x = _.scales.x.scale(d.value)
      const inside = x > 2 * dx + ts.width
      return {
        inside,
        x: inside ? x - dx : x + dx + ts.width,
        y: _.scales.y.scale(d.name) + bandwidth / 2,
        color: inside ? luminanceAdjustedColor(self._color.mapGroup(d.name)) : style.color
      }
    },

    measureY: (d, bandwidth, style) => {
      const ts = measureText(_.valueFormat(d.value), style)
      const dy = Math.max((bandwidth - ts.width) / 2, 5)
      const y = _.scales.y.scale(d.value)
      const h = parseFloat(self._widget.size.innerHeight) - y
      const inside = h > 2 * dy + ts.height
      return {
        inside,
        x: _.scales.x.scale(d.name) + bandwidth / 2,
        y: inside ? y + dy : y - dy - ts.height,
        color: inside ? luminanceAdjustedColor(self._color.mapGroup(d.name)) : style.color
      }
    },

    // Methods
    update: duration => {
      // Compute some constants beforehand
      const style = self._widget.getStyle()

      // Collect X values and Y max
      const xValues = self._chart.data.map(d => d.name)
      const yMax = 1.01 * max(self._chart.data.map(d => d.value)) || 1

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(_.horizontal ? [0, yMax] : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(_.horizontal ? xValues : [0, yMax])

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          const bandwidth = _.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Add bars
          const rect = g.append('rect')
            .attr('class', d => `bar ${encode(d.name)}`)
            .attr('fill', 'currentColor')
            .on('mouseover.barChart', d => {
              _.current = d
            })
            .on('mouseleave.barChart', () => {
              _.current = undefined
            })
          if (_.horizontal) {
            rect.attr('x', _.scales.x.scale(0))
              .attr('width', 0)
              .attr('y', d => _.scales.y.scale(d.name))
              .attr('height', bandwidth)
          } else {
            rect.attr('x', d => _.scales.x.scale(d.name))
              .attr('width', bandwidth)
              .attr('y', _.scales.y.scale(0))
              .attr('height', 0)
          }

          // Add values
          const measure = _.horizontal ? _.measureX : _.measureY
          g.append('text')
            .style('display', 'none')
            .attr('class', d => `bar-value ${encode(d.name)}`)
            .attr('stroke', 'none')
            .style('pointer-events', 'none')
            .text(d => _.valueFormat(d.value))
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('fill', d => d._measures.color)
            .attr('x', d => _.horizontal ? _.scales.x.scale(0) : d._measures.x)
            .attr('y', d => _.horizontal ? d._measures.y : _.scales.y.scale(0))

          return g
        },
        update: g => {
          const bandwidth = _.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Bars
          const bars = g.select('.bar')
          if (_.horizontal) {
            bars.attr('x', _.scales.x.scale(0))
              .attr('width', d => _.scales.x.scale(d.value))
              .attr('y', d => _.scales.y.scale(d.name))
              .attr('height', bandwidth)
          } else {
            bars.attr('x', d => _.scales.x.scale(d.name))
              .attr('width', bandwidth)
              .attr('y', d => _.scales.y.scale(d.value))
              .attr('height', d => parseInt(self._widget.size.innerHeight) - _.scales.y.scale(d.value))
          }

          // Values
          const measure = _.horizontal ? _.measureX : _.measureY
          g.select('.bar-value')
            .attr('text-anchor', _.horizontal ? 'end' : 'middle')
            .attr('dominant-baseline', _.horizontal ? 'central' : 'hanging')
            .attr('font-size', self._font.size)
            .attr('fill', self._font.color)
            .textTween(textTween(_.valueFormat))
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('fill', d => d._measures.color)
            .attr('x', d => d._measures.x)
            .attr('y', d => d._measures.y)
            .style('display', _.values ? null : 'none')

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = () => {
    // If no bar is hovered, hide tooltip
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
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api, {
    /**
     * Converts the bar chart to a horizontal bar chart. Note that this method does not swap the axis labels.
     *
     * @method horizontal
     * @methodOf BarChart
     * @param {boolean} on Whether the bar chart should be horizontal.
     * @returns {BarChart} The BarChart itself.
     */
    horizontal: on => {
      _.horizontal = on

      // Assign scales
      _.scales.x = on ? scales.y : scales.x
      _.scales.y = on ? scales.x : scales.y

      // Update axes
      self._bottomAxis.scale(_.scales.x)
      self._leftAxis.scale(_.scales.y)

      // Change grid type.
      self._yGrid.type(on ? 'x' : 'y')

      return api
    },

    /**
     * Shows the values at the top of the bars.
     *
     * @method values
     * @methodOf BarChart
     * @param {boolean} on Whether to add values on top of the bars.
     * @returns {BarChart} The BarChart itself.
     */
    values: on => {
      _.values = on
      return api
    },

    /**
     * Sets the format of the values shown on the top of the bars. Default format is a fixed 1 point decimal.
     *
     * @method valueFormat
     * @methodOf BarChart
     * @param {Function} format The format to use for the values shown on the top of the bars.
     * @returns {BarChart} The BarChart itself.
     */
    valueFormat: format => {
      _.valueFormat = format || (x => x.toFixed(1))
      return api
    }
  })

  return api

  // Documentation
  /**
   * Set/updates the data that is shown in the bar chart. For the bar chart, each bar is itself a plot group, so all
   * methods that operate on plot groups are applied on the bar level.
   *
   * @method data
   * @methodOf BarChart
   * @param {Object[]} plots Array of objects representing the bars to show. Each bar has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{number} <i>value</i>: Category value.</li>
   * </ul>
   * @returns {BarChart} Reference to the BarChart API.
   */
}
