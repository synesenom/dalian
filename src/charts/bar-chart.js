import { max, select, interpolateNumber } from 'd3'
import { getTextWidth } from '../utils/measure-text'
import luminance from '../utils/luminance'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import Scale from '../components/scale'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'


/**
 * The bar chart widget.
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent) => {
  // Build widget from components
  // TODO Fix this separate declaration of scales (needed by the axis components)
  let scales = {
    x: Scale('band'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('bar-chart', name, parent, 'svg'),
    ElementTooltip,
    Highlight(['.bar', '.bar-value']),
    (s, a) => LeftAxis(s, a, 'y', scales.y),
    (s, a) => BottomAxis(s, a, 'x', scales.x)
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
            .style('stroke-with', '2px')
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
      valueFormat: Math.round
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
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api, {
    horizontal: on => {
      self._barChart.horizontal = on

      // Assign scales
      if (on) {
        _.scales.x = scales.y
        _.scales.y = scales.x
      } else {
        _.scales.x = scales.x
        _.scales.y = scales.y
      }

      // Update axes
      self._axisBottom.scale(_.scales.x)
      self._axisLeft.scale(_.scales.y)

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
   * Sets the callback for the click event. The click event is triggered when clicking on any bar.
   *
   * @method click
   * @methodOf BarChart
   * @param {Function} callback Function to call on click. The bar data (name and value) is passed to it as parameter.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the color policy for the plots. Supported policies:
   * <ul>
   *     <li>Default color policy (no arguments): the default color scheme is used which is a modification of the
   *     qualitative color scheme Set 1 from Color Brewer.</li>
   *     <li>Single color or shades of a color (passing {string}): Either the specified color is used for all plots or a
   *     palette is generated from its shades (see {size}).</li>
   *     <li>Custom color mapping (passing an {Object}): each plot has the color specified as the value for the
   *     property with the same name as the plot's key.</li>
   * </ul>
   *
   * @method colors
   * @methodOf BarChart
   * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
   * @param {number} [size] Number of colors that need to be generated if policy is set to a single color. If not set,
   * the color specified for {policy} is used for all plots.
   * @returns {BarChart} The BarChart itself.
   */

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
   * Enables/disables description for the bar chart. A description is a small tooltip that is bound to the context menu
   * (also disables default event handler). The description disappears once the mouse leaves the chart. If called
   * without argument, description is disabled.
   *
   * @method description
   * @methodOf BarChart
   * @param {string} [content] Content of the description. Can be HTML formatted. If not provided, description is
   * disabled.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the font size of the bar chart in pixels.
   *
   * @method fontSize
   * @methodOf BarChart
   * @param {number} size Size of the font in pixels.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the font color of the bar chart. The axis lines, ticks and bar values outside the bars are also shown in this
   * color.
   *
   * @method fontColor
   * @methodOf BarChart
   * @param {string} color Color to set as font color.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the height of the bar chart (including it's margins).
   *
   * @method height
   * @methodOf BarChart
   * @param {number} [value = 200] Height value in pixels.
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
   * Sets the chart margins in pixels. Margins are included in width and height and thus effectively shrink the
   * plotting area.
   *
   * @method margins
   * @methodOf BarChart
   * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
   * sides.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the callback for the mouseleave event. The mouseleave event is triggered when leaving any bar.
   *
   * @method mouseleave
   * @methodOf BarChart
   * @param {Function} callback Function to call on mouseleave. The bar data (name and values) is passed to it as
   * parameter.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the callback for the mouseover event. The mouseover event is triggered when hovering over any bar.
   *
   * @method mouseover
   * @methodOf BarChart
   * @param {Function} callback Function to call on mouseover. The bar data (name and values) is passed to it as
   * parameter.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Replaces the chart with a placeholder message positioned in the center of the original chart. If no placeholder
   * content is provided, the chart is recovered.
   *
   * @method placeholder
   * @methodOf BarChart
   * @param {string} [content] Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is removed.
   * @param {number} [duration = 700] Duration of the placeholder animation in ms.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Renders the bar chart. If called for the first time, the chart is built, otherwise this method updates the chart
   * with the attributes and styles that have been changed since the last rendering.
   *
   * @method render
   * @methodOf BarChart
   * @param {number} [duration = 700] Duration of the rendering animation in ms.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Enables/disables tooltip for the bar chart.
   *
   * @method tooltip
   * @methodOf BarChart
   * @param {boolean} [on = false] Whether tooltip should be enabled or not.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the format of the X component's value in the tooltip (category name).
   *
   * @method tooltipXFormat
   * @methodOf BarChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the X value
   * and must return a string. The return value can be HTML formatted.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the format of the Y component's value in the tooltip (category value).
   *
   * @method tooltipYFormat
   * @methodOf BarChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the Y value
   * and must return a string. The return value can be HTML formatted.
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

  /**
   * Sets the width of the bar chart (including it's margins).
   *
   * @method width
   * @methodOf BarChart
   * @param {number} [value = 300] Width value in pixels.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the X coordinate of the bar chart. If negative, the chart's right side is measured from the right side of the
   * parent, otherwise it is measured from the left side.
   *
   * @method x
   * @methodOf BarChart
   * @param {number} [value = 0] Value of the X coordinate in pixels.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the X label for the chart.
   *
   * @method xLabel
   * @methodOf BarChart
   * @param {string} label Text to set as the label.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the X tick format of the chart.
   *
   * @method xTickFormat
   * @methodOf BarChart
   * @param {Function} format Function to set as formatter.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the Y coordinate of the bar chart. If negative, the chart's bottom side is measured from the bottom of the
   * parent, otherwise the top side is measured from the top.
   *
   * @method y
   * @methodOf BarChart
   * @param {number} [value = 0] Value of the Y coordinate in pixels.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the Y label for the chart.
   *
   * @method yLabel
   * @methodOf BarChart
   * @param {string} label Text to set as the label.
   * @returns {BarChart} The BarChart itself.
   */

  /**
   * Sets the Y tick format of the chart.
   *
   * @method yTickFormat
   * @methodOf BarChart
   * @param {Function} format Function to set as formatter.
   * @returns {BarChart} The BarChart itself.
   */
}
