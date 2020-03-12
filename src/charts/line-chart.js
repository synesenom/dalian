import { bisector, select, line, area } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import Scale from '../components/scale'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import YRange from '../components/range/y-range'
import Smoothing from '../components/smoothing'
import LineWidth from '../components/line-width'
import LineStyle from '../components/line-style'
import PlotMarker from '../components/plot-marker'
import PointTooltip from '../components/tooltip/point-tooltip'
import Highlight from '../components/highlight'
import TrendMarker from '../components/trend-marker'
import Pin from '../components/pin'


/**
 * The line chart widget.
 *
 * @function LineChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
// TODO Add API .pin
export default (name, parent = 'body') => {
  // Build widget from components
  // TODO Fix this separate declaration of scales (needed by the TrendMarker)
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    LeftAxis('y', scales.y),
    BottomAxis('x', scales.x),
    YRange,
    LineStyle,
    LineWidth,
    PlotMarker,
    Smoothing,
    PointTooltip,
    Highlight(['.line', '.error-band', '.plot-marker', '.trend-marker']),
    TrendMarker(scales),
    Pin(scales)
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {
      // Collect all data points
      const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])
      const yData = flatData.map(d => d.y).filter(d => d !== null)
      const yMin = self._yRange.min(yData)
      const yMax = self._yRange.max(yData)

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(flatData.map(d => d.x))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain([yMin, yMax])

      // Create line and error path functions
      const lineFn = line()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())
      const errorFn = area()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y0(d => _.scales.y.scale(Math.max(yMin, d.y - d.lo)))
        .y1(d => _.scales.y.scale(Math.min(yMax, d.y + d.hi)))
        .curve(self._smoothing.curve())

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          // Add error bands
          g.append('path')
            .attr('class', d => `error-band ${encode(d.name)}`)
            .attr('d', d => errorFn(d.values))
            .style('stroke', 'none')
            .style('fill-opacity', 0)

          // Add lines
          g.append('path')
            .attr('class', d => `line ${encode(d.name)}`)
            .attr('d', d => lineFn(d.values))
            .style('stroke-width', d => self._lineWidth.mapping(d.name) || '2px')
            .style('opacity', 0)
            .style('fill', 'none')
          return g
        },
        update: g => {
          // Update error bands
          g.select('.error-band')
            .attrTween('d', function(d) {
              let previous = select(this).attr('d')
              let current = errorFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .style('fill-opacity', 0.2)

          // Update lines
          g.select('.line')
            .attrTween('d', function(d) {
              let previous = select(this).attr('d')
              let current = lineFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .style('opacity', 1)
            .style('stroke-dasharray', d => self._lineStyles.strokeDashArray(d.name))
          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots
  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get bisection
    let bisect = bisector(d => _.scales.x.scale(d.x)).left
    let index = mouse ? self._chart.data.map(d => bisect(d.values, mouse[0])) : undefined

    // If no data point is found, just remove tooltip elements
    if (typeof index === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get plots
    let x = _.scales.x.scale.invert(mouse[0])
    let plots = self._chart.data.map((d, i) => {
      // Data point
      let j = index[i]

      let data = d.values

      let left = data[j - 1] ? data[j - 1] : data[j]

      let right = data[j] ? data[j] : data[j - 1]

      let point = x - left.x > right.x - x ? right : left
      x = point.x

      // Marker
      if (point.y !== null) {
        self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name)
      } else {
        self._plotMarker.remove(d.name)
      }

      return {
        name: d.name,
        background: self._lineStyles.background(self._lineStyles.style(d.name), self._colors.mapping(d.name)),
        value: point.y
      }
    })

    return {
      title: x,
      content: {
        type: 'plots',
        data: plots
      }
    }
  }
  self._chart.transformData = data => {
    return data.map(d => ({
      name: d.name,
      values: d.values.sort((a, b) => a.x - b.x)
        .map(dd => ({
          x: dd.x,
          y: dd.y,
          lo: dd.lo || 0,
          hi: dd.hi || 0
        }))
    }))
  }

  // Extend widget update
  // Update plot before widget update because trend markers need the data update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  return api

  // Documentation
  /**
   * Adds a trend marker to the chart. A trend marker is a labeled pair of dots indicating changes in the plot. If the
   * marker ID already exists, no further markers are added.
   *
   * @method addMarker
   * @methodOf LineChart
   * @param {string} id Unique identifier of the trend marker.
   * @param {string} key Key of the plot to add the trend marker to.
   * @param {number} start Starting (left side) value of the trend marker.
   * @param {number} end Ending (right side) value of the trend marker.
   * @param {string} label Label to display on the marker.
   * @param {number} [duration = 700] Duration of the animation of adding the marker.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Adds a pin to the chart. A pin is a vertical line with a circle on the top and an optional text label to
   * describe the pin. If the  marker ID already exists, no further markers are added.
   *
   * @method addPin
   * @methodOf Pin
   * @param {string} id Unique identifier of the pin.
   * @param {number} position Horizontal position.
   * @param {Object} options Pin design options. Supported values:
   * <ul>
   *   <li>{string} <i>color</i>: Pin color.</li>
   *   <li>{number} <i>size</i>: Size of the pin head in pixels.</li>
   *   <li>{number} <i>height</i>: Pin height relative to the Y range.</li>
   *   <li>{string} <i>text</i>: Label to add to the pin. The label is visible when hovering over the pin.</li>
   * </ul>
   * @param {number} [duration = 400] Duration of the animation of adding the pin.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the callback for the click event. The click event is triggered when clicking on any line or error band.
   *
   * @method click
   * @methodOf LineChart
   * @param {Function} callback Function to call on click. The line data (name and values) is passed to it as parameter.
   * @returns {LineChart} The LineChart itself.
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
   * @method color
   * @methodOf LineChart
   * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
   * @param {number} [size] Number of colors that need to be generated if policy is set to a single color. If not set,
   * the color specified for {policy} is used for all plots.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Set/updates the data that is shown in the line chart.
   *
   * @method data
   * @methodOf LineChart
   * @param {Object[]} plots Array of objects representing the lines to show. Each plot has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Name of the plot.</li>
   *   <li>{Object[]} <i>values</i>: Plot data.</li>
   * </ul>
   * The <i>values</i> property is an array of objects of the following structure:
   * <dl>
   *   <dt>x {number}</dt> <dd>X coordinate of the data point.</dd>
   *   <dt>y {number}</dt> <dd>Y coordinate of the data point.</dd>
   *   <dt>lo {number}</dt> <dd>Lower error of the data point. {optional}</dd>
   *   <dt>hi {number}</dt> <dd>Upper error of the data point. {optional}</dd>
   * </dl>
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Enables/disables description for the line chart. A description is a small tooltip that is bound to the context menu
   * (also disables default event handler). The description disappears once the mouse leaves the chart. If called
   * without argument, description is disabled.
   *
   * @method description
   * @methodOf LineChart
   * @param {string} [content] Content of the description. Can be HTML formatted. If not provided, description is
   * disabled.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the font size of the line chart in pixels.
   *
   * @method fontSize
   * @methodOf LineChart
   * @param {number} size Size of the font in pixels.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the font color of the line chart. The axis lines and ticks are also shown in this color.
   *
   * @method fontColor
   * @methodOf LineChart
   * @param {string} color Color to set as font color.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the height of the line chart (including it's margins).
   *
   * @method height
   * @methodOf LineChart
   * @param {number} [value = 200] Height value in pixels.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Highlights a single plot or multiple plots.
   *
   * @method highlight
   * @methodOf LineChart
   * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the plots to highlight. If key
   * is {null} or {undefined}, the highlight is removed (all plots become visible).
   * @param {number} [duration = 700] Duration of the highlight animation in ms.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the line style policy. Supported policies:
   * <ul>
   *     <li>Default line style policy (no arguments): the default line style is used which is solid for all plots.</li>
   *     <li>Single line style (passing {string}): The specified line style is used for all plots. Supported styles
   *     are: solid, dashed, dotted.</li>
   *     <li>Custom line style mapping (passing an {Object}): each plot has the line style specified as the value for
   *     the property with the same name as the plot's key.</li>
   * </ul>
   *
   * @method lineStyle
   * @methodOf LineChart
   * @param {(string | Object)} [policy] Line style policy to set. If not specified, the default policy is set.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the line width policy. Supported policies:
   * <ul>
   *     <li>Default line width policy (no arguments): The default line width is used which is 2px for all lines.</li>
   *     <li>Single number or (passing {number}): The specified line width is used for all lines.</li>
   *     <li>Custom line width mapping (passing an {Object}): Plots that are listed as property name have the line
   *     width specified as the value for.</li>
   * </ul>
   *
   * @method lineWidth
   * @methodOf LineChart
   * @param {(string | Object)} [policy] Line width policy to set. If not specified, the default policy is set.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the chart margins in pixels. Margins are included in width and height and thus effectively shrink the
   * plotting area.
   *
   * @method margins
   * @methodOf LineChart
   * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
   * sides.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the callback for the mouseleave event. The mouseleave event is triggered when leaving any line or error band.
   *
   * @method mouseleave
   * @methodOf LineChart
   * @param {Function} callback Function to call on mouseleave. The line data (name and values) is passed to it as
   * parameter.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the callback for the mouseover event. The mouseover event is triggered when hovering over any line or error
   * band.
   *
   * @method mouseover
   * @methodOf LineChart
   * @param {Function} callback Function to call on mouseover. The line data (name and values) is passed to it as
   * parameter.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Replaces the chart with a placeholder message positioned in the center of the original chart. If no placeholder
   * content is provided, the chart is recovered.
   *
   * @method placeholder
   * @methodOf LineChart
   * @param {string} [content] Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is removed.
   * @param {number} [duration = 700] Duration of the placeholder animation in ms.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Removes a trend marker from the chart.
   *
   * @method removeMarker
   * @methodOf LineChart
   * @param {string} id Identifier of the trend marker to remove. If trend marker with the specified identifier does
   * not exist, no change is applied.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Removes a pin from the chart.
   *
   * @method removePin
   * @methodOf Pin
   * @param {string} id Identifier of the pin to remove. If pin with the specified identifier does not exist, no
   * change is applied.
   * @param {number} duration Duration of the remove animation.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Renders the line chart. If called for the first time, the chart is built, otherwise this method updates the chart
   * with the attributes and styles that have been changed since the last rendering.
   *
   * @method render
   * @methodOf LineChart
   * @param {number} [duration = 700] Duration of the rendering animation in ms.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Enables/disables polygon smoothing.
   *
   * @method smoothing
   * @methodOf LineChart
   * @param {boolean} [on = false] Whether to enable polygon smoothing. If not specified, smoothing is disabled.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Enables/disables tooltip for the line chart.
   *
   * @method tooltip
   * @methodOf LineChart
   * @param {boolean} [on = false] Whether tooltip should be enabled or not.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the format of the X component's value in the tooltip.
   *
   * @method tooltipXFormat
   * @methodOf LineChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the X value
   * and must return a string. The return value can be HTML formatted.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the format of the Y component's value in the tooltip.
   *
   * @method tooltipYFormat
   * @methodOf LineChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the Y value
   * and must return a string. The return value can be HTML formatted.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the width of the line chart (including it's margins).
   *
   * @method width
   * @methodOf LineChart
   * @param {number} [value = 300] Width value in pixels.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the X coordinate of the line chart. If negative, the chart's right side is measured from the right side of the
   * parent, otherwise it is measured from the left side.
   *
   * @method x
   * @methodOf LineChart
   * @param {number} [value = 0] Value of the X coordinate in pixels.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the X label for the chart.
   *
   * @method xLabel
   * @methodOf LineChart
   * @param {string} label Text to set as the label.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the X tick format of the chart.
   *
   * @method xTickFormat
   * @methodOf LineChart
   * @param {Function} format Function to set as formatter.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the Y coordinate of the line chart. If negative, the chart's bottom side is measured from the bottom of the
   * parent, otherwise the top side is measured from the top.
   *
   * @method y
   * @methodOf LineChart
   * @param {number} [value = 0] Value of the Y coordinate in pixels.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the Y label for the chart.
   *
   * @method yLabel
   * @methodOf LineChart
   * @param {string} label Text to set as the label.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the lower boundary for the plot if it is lower than the calculated lower boundary.
   *
   * @method yMin
   * @methodOf LineChart
   * @param {number} value The lower boundary to set.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the upper boundary for the plot if it is greater than the calculated upper boundary.
   *
   * @method yMax
   * @methodOf LineChart
   * @param {number} value The upper boundary to set.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the Y tick format of the chart.
   *
   * @method yTickFormat
   * @methodOf LineChart
   * @param {Function} format Function to set as formatter.
   * @returns {LineChart} The LineChart itself.
   */
}
