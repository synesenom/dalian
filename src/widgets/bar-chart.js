import { max, select, interpolateNumber } from 'd3'
import { getTextWidth } from '../utils/measure-text'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import luminance from '../utils/luminance'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'

// TODO Add reference to all components: Highlight
/**
 * The bar chart widget. Being a chart, it extends the [Chart]{@link ../components/chart} component, with all of its
 * available API. Furthermore, it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [LeftAxis]{@link ../components/left-axis.html},
 * [ElementTooltip]{@link ../components/element-tooltip.html}.
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
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
    Highlight(['.bar', '.bar-value'])
  )

  // Private members
  let _ = {
    // Variables
    current: undefined,
    scales: {
      x: scales.x,
      y: scales.y
    },

    measureX: (d, bandwidth, font) => {
      const tw = getTextWidth(self._barChart.valueFormat(d.value), font)
      const dx = Math.max((bandwidth - parseFloat(font.size)) / 2, 5)
      const x = _.scales.x.scale(d.value)
      const inside = x > 3 * dx + tw
      return {
        inside,
        x: inside ? x - dx : x + dx + tw,
        y: _.scales.y.scale(d.name) + bandwidth / 2,
        color: inside ? luminance(self._colors.mapping(d.name)) > 0.179 ? '#000' : '#fff' : font.color
      }
    },

    measureY: (d, bandwidth, font) => {
      const th = parseFloat(font.size)
      const dy = Math.max((bandwidth - getTextWidth(self._barChart.valueFormat(d.value), font)) / 2, 5)
      const y = _.scales.y.scale(d.value)
      const h = parseFloat(self._widget.size.innerHeight) - y
      const inside = h > 2 * dy + th
      return {
        inside,
        x: _.scales.x.scale(d.name) + bandwidth / 2,
        y: inside ? y + dy : y - dy - th,
        color: inside ? luminance(self._colors.mapping(d.name)) > 0.179 ? '#000' : '#fff' : font.color
      }
    },

    // Methods
    update: duration => {
      // Compute some constants beforehand
      const style = window.getComputedStyle(self._widget.container.node())
      const font = {
        size: style.fontSize,
        family: style.fontFamily,
        color: style.color
      }

      // Collect X values and Y max
      const xValues = self._chart.data.map(d => d.name)
      const yMax = 1.1 * max(self._chart.data.map(d => d.value)) || 1

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(self._barChart.horizontal ? [0, yMax] : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._barChart.horizontal ? xValues : [0, yMax])

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          const bandwidth = self._barChart.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Add bars
          const rect = g.append('rect')
            .attr('class', d => `bar ${encode(d.name)}`)
            .attr('fill', 'currentColor')
            .on('mouseover', d => _.current = d)
            .on('mouseleave', () => _.current = undefined)
          if (self._barChart.horizontal) {
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
          if (self._barChart.values) {
            const measure = self._barChart.horizontal ? _.measureX : _.measureY
            g.append('text')
              .attr('class', d => `bar-value ${encode(d.name)}`)
              .attr('dominant-baseline', self._barChart.horizontal ? 'central' : 'hanging')
              .attr('text-anchor', self._barChart.horizontal ? 'end' : 'middle')
              .style('font-size', self._font.size)
              .style('fill', self._font.color)
              .style('stroke', 'none')
              .style('pointer-events', 'none')
              .text(d => self._barChart.valueFormat(d.value))
              .each(d => Object.assign(d, { _m: measure(d, bandwidth, font) }))
              .style('fill', d => d._m.color)
              .attr('x', d => self._barChart.horizontal ? _.scales.x.scale(0) : d._m.x)
              .attr('y', d => self._barChart.horizontal ? d._m.y : _.scales.y.scale(0))
          }

          return g
        },
        update: g => {
          const bandwidth = self._barChart.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Bars
          const bars = g.select('.bar')
          if (self._barChart.horizontal) {
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
          if (self._barChart.values) {
            const measure = self._barChart.horizontal ? _.measureX : _.measureY
            g.select('.bar-value')
              .textTween(function (d) {
                let prev = parseFloat(select(this).text())
                let i = interpolateNumber(prev, d.value)
                return t => self._barChart.valueFormat(i(t))
              })
              .each(d => Object.assign(d, { _m: measure(d, bandwidth, font) }))
              .style('fill', d => d._m.color)
              .attr('x', d => d._m.x)
              .attr('y', d => d._m.y)
          }

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Protected members
  self = Object.assign(self, {
    _barChart: {
      horizontal: false,
      values: false,
      valueFormat: x => x.toFixed(2)
    }
  })

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = () => {
    // If no bar is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.name,
      stripe: self._colors.mapping(_.current.name),
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
    horizontal: on => {
      self._barChart.horizontal = on

      // Assign scales
      _.scales.x = on ? scales.y : scales.x
      _.scales.y = on ? scales.x : scales.y

      // Update axes
      self._bottomAxis.scale(_.scales.x)
      self._leftAxis.scale(_.scales.y)

      return api
    },

    values: on => {
      self._barChart.values = on
      return api
    },

    valueFormat: format => {
      self._barChart.valueFormat = format
      return api
    }
  })

  return api

  // Documentation
  /**
   * Set/updates the data that is shown in the bar chart.
   *
   * @method data
   * @methodOf BarChart
   * @param {Object[]} plots Array of objects representing the bars to show. Each bar has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{number} <i>value</i>: Category value.</li>
   * </ul>
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Highlights a single bar or multiple bars.
   *
   * @method highlight
   * @methodOf BarChart
   * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the bars to highlight. If key
   * is {null} or {undefined}, the highlight is removed (all bars become visible).
   * @param {number} [duration = 700] Duration of the highlight animation in ms.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Converts the bar chart to a horizontal bar chart. Note that this method does not swap the axis labels.
   *
   * @method horizontal
   * @methodOf BarChart
   * @param {boolean} on Whether the bar chart should be horizontal.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Shows the values at the top of the bars.
   *
   * @method value
   * @methodOf BarChart
   * @param {boolean} on Whether to add values on top of the bars.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the format of the values shown on the top of the bars.
   *
   * @method valueFormat
   * @methodOf BarChart
   * @param {Function} format The format to use for the values shown on the top of the bars.
   * @returns {BarChart} The BarChart itself.
   */
}
