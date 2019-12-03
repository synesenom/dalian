import { bisector } from 'd3-array'
import { interpolatePath } from 'd3-interpolate-path'
import { select } from 'd3-selection'
import { line, area } from 'd3-shape'
import { compose, encode, extend } from '../../../core/src/index'
import Chart from '../../../components/chart/src/index'
import Scale from '../../../components/scale/src/index'
import { LeftAxis, BottomAxis } from '../../../components/axis/src/index'
import Smoothing from '../../../components/smoothing/src/index'
import LineStyle from '../../../components/line-style/src/index'
import PlotMarker from '../../../components/plot-marker/src/index'
import { PointTooltip } from '../../../components/tooltip/src/index'
import Highlight from '../../../components/highlight/src/index'
import TrendMarker from '../../../components/trend-marker/src/index'

/**
 * The line chart widget.
 *
 * @function LineChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  // TODO Fix this separate declaration of scales (needed by the TrendMarker)
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    LineStyle,
    PlotMarker,
    Smoothing,
    PointTooltip,
    Highlight,
    (s, a) => TrendMarker(s, a, scales),
    (s, a) => LeftAxis(s, a,'y', scales.y),
    (s, a) => BottomAxis(s, a, 'x', scales.x)
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {
      // Collect all data points
      const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])
      const yData = flatData.map(d => d.y)
      const yMin = Math.min(...yData)
      const yMax = Math.max(...yData)

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(flatData.map(d => d.x))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(flatData.map(d => d.y))

      // Create line and error path functions
      const lineFn = line()
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())
      const errorFn = area()
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
            .style('fill-opacity', 0.2)

          // Add lines
          g.append('path')
            .attr('class', d => `line ${encode(d.name)}`)
            .attr('d', d => lineFn(d.values))
            .style('stroke-width', '2px')
            .style('fill', 'none')
          return g
        },
        union: {
          // TODO Fix ugly path update, make it continuous
          after: g => {
            // Update error bands
            g.select('.error-band')
              //.attr('d', d => errorFn(d.values))
              .attrTween('d', function(d) {
                let previous = select(this).attr('d')
                let current = errorFn(d.values)
                return interpolatePath(previous, current)
              })

            // Update lines
            g.select('.line')
              .attrTween('d', function(d) {
                let previous = select(this).attr('d')
                let current = lineFn(d.values)
                return interpolatePath(previous, current)
              })
              .style('stroke-dasharray', d => self._lineStyles.strokeDashArray(d.name))
            return g
          }
        }
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots
  self._highlight.selectors = ['.line', '.error-band', '.plot-marker', '.trend-marker']
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
      self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name)

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
   * Sets the callback for the click event. The click event is triggered when clicking on any line or error band.
   *
   * @method click
   * @methodOf LineChart
   * @param {Function} callback Function to call on click.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the color policy for the plots. Supported policies:
   * <ul>
   *     <li>Default color policy (no arguments): the default color scheme is used which is a combination of the
   *     qualitative color schemes Set 1 and Set 3 from Color Brewer.</li>
   *     <li>Single color (passing {string}): The specified color is used for all plots.</li>
   *     <li>Custom color mapping (passing an {Object}): each plot has the color specified as the value for the
   *     property with the same name as the plot's key.</li>
   * </ul>
   *
   * @method colors
   * @methodOf LineChart
   * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
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
   * @param {Function} callback Function to call on mouseleave.
   * @returns {LineChart} The LineChart itself.
   */

  /**
   * Sets the callback for the mouseover event. The mouseover event is triggered when hovering over any line or error
   * band.
   *
   * @method mouseover
   * @methodOf LineChart
   * @param {Function} callback Function to call on mouseover.
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
   * @param {boolean} on Whether to enable polygon smoothing. If not specified, smoothing is disabled.
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
   * Sets the Y tick format of the chart.
   *
   * @method yTickFormat
   * @methodOf LineChart
   * @param {Function} format Function to set as formatter.
   * @returns {LineChart} The LineChart itself.
   */
}
