import { area, bisector, select } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import Scale from '../components/scale'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import Smoothing from '../components/smoothing'
import PointTooltip from '../components/tooltip/point-tooltip'
import Highlight from '../components/highlight'
import Opacity from '../components/opacity'
import PlotMarker from '../components/plot-marker'

/**
 * The area chart widget.
 *
 * @function AreaChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent) => {
  // Build widget from components
  // TODO Fix this separate declaration of scales (needed by the axis components)
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('area-chart', name, parent, 'svg'),
    PlotMarker,
    Opacity,
    Smoothing,
    PointTooltip,
    Highlight(['.area', '.plot-marker']),
    LeftAxis('y', scales.y),
    BottomAxis('x', scales.x)
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {
      // Collect all data points
      const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(flatData.map(d => d.x))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        // Make sure scale starts at 0
        .domain(flatData.map(d => d.y).concat(0))

      // Create line and error path functions
      const areaFn = area()
        .x(d => _.scales.x.scale(d.x))
        .y0(() => _.scales.y.scale(0))
        .y1(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          g.append('path')
            .attr('class', d => `area ${encode(d.name)}`)
            .attr('d', d => areaFn(d.values))
            .style('stroke', 'none')
            .style('fill-opacity', 0)
          return g
        },
        update: g => {
          g.select('.area')
            .attrTween('d', function (d) {
              let previous = select(this).attr('d')
              let current = areaFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .style('fill-opacity', self._opacity.value())
          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = mouse => {
    // If outside the plot, hide tooltip
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
        background: self._colors.mapping(d.name),
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
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  return api

  // Documentation
  /**
   * Sets the callback for the click event. The click event is triggered when clicking on any area.
   *
   * @method click
   * @methodOf AreaChart
   * @param {Function} callback Function to call on click. The area data (name and values) is passed to it as parameter.
   * @returns {AreaChart} The AreaChart itself.
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
   * @methodOf AreaChart
   * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
   * @param {number} [size] Number of colors that need to be generated if policy is set to a single color. If not set,
   * the color specified for {policy} is used for all plots.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Set/updates the data that is shown in the area chart.
   *
   * @method data
   * @methodOf AreaChart
   * @param {Object[]} plots Array of objects representing the area plots to show. Each plot has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Name of the plot.</li>
   *   <li>{Object[]} <i>values</i>: Plot data.</li>
   * </ul>
   * The <i>values</i> property is an array of objects of the following structure:
   * <dl>
   *   <dt>x {number}</dt> <dd>X coordinate of the data point.</dd>
   *   <dt>y {number}</dt> <dd>Y coordinate of the data point.</dd>
   * </dl>
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Enables/disables description for the area chart. A description is a small tooltip that is bound to the context menu
   * (also disables default event handler). The description disappears once the mouse leaves the chart. If called
   * without argument, description is disabled.
   *
   * @method description
   * @methodOf AreaChart
   * @param {string} [content] Content of the description. Can be HTML formatted. If not provided, description is
   * disabled.
   * @returns {AreaChart} The AreaChart itself.
   */

  // TODO Add fillStyle policy hee

  /**
   * Sets the font size of the area chart in pixels.
   *
   * @method fontSize
   * @methodOf AreaChart
   * @param {number} size Size of the font in pixels.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the font color of the area chart. The axis lines and ticks are also shown in this color.
   *
   * @method fontColor
   * @methodOf AreaChart
   * @param {string} color Color to set as font color.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the height of the area chart (including it's margins).
   *
   * @method height
   * @methodOf AreaChart
   * @param {number} [value = 200] Height value in pixels.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Highlights a single plot or multiple plots.
   *
   * @method highlight
   * @methodOf AreaChart
   * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the plots to highlight. If key
   * is {null} or {undefined}, the highlight is removed (all plots become visible).
   * @param {number} [duration = 700] Duration of the highlight animation in ms.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the chart margins in pixels. Margins are included in width and height and thus effectively shrink the
   * plotting area.
   *
   * @method margins
   * @methodOf AreaChart
   * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
   * sides.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the callback for the mouseleave event. The mouseleave event is triggered when leaving any area.
   *
   * @method mouseleave
   * @methodOf AreaChart
   * @param {Function} callback Function to call on mouseleave. The area data (name and values) is passed to it as
   * parameter.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the callback for the mouseover event. The mouseover event is triggered when hovering over any area.
   *
   * @method mouseover
   * @methodOf AreaChart
   * @param {Function} callback Function to call on mouseover. The area data (name and values) is passed to it as
   * parameter.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the fill opacity of the area plots.
   *
   * @method opacity
   * @methodOf AreaChart
   * @param {number} value The opacity value to set.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Replaces the chart with a placeholder message positioned in the center of the original chart. If no placeholder
   * content is provided, the chart is recovered.
   *
   * @method placeholder
   * @methodOf AreaChart
   * @param {string} [content] Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is removed.
   * @param {number} [duration = 700] Duration of the placeholder animation in ms.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Renders the area chart. If called for the first time, the chart is built, otherwise this method updates the chart
   * with the attributes and styles that have been changed since the last rendering.
   *
   * @method render
   * @methodOf AreaChart
   * @param {number} [duration = 700] Duration of the rendering animation in ms.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Enables/disables polygon smoothing.
   *
   * @method smoothing
   * @methodOf AreaChart
   * @param {boolean} [on = false] Whether to enable polygon smoothing. If not specified, smoothing is disabled.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Enables/disables tooltip for the area chart.
   *
   * @method tooltip
   * @methodOf AreaChart
   * @param {boolean} [on = false] Whether tooltip should be enabled or not.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the format of the X component's value in the tooltip.
   *
   * @method tooltipXFormat
   * @methodOf AreaChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the X value
   * and must return a string. The return value can be HTML formatted.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the format of the Y component's value in the tooltip.
   *
   * @method tooltipYFormat
   * @methodOf AreaChart
   * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the Y value
   * and must return a string. The return value can be HTML formatted.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the width of the area chart (including it's margins).
   *
   * @method width
   * @methodOf AreaChart
   * @param {number} [value = 300] Width value in pixels.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the X coordinate of the area chart. If negative, the chart's right side is measured from the right side of the
   * parent, otherwise it is measured from the left side.
   *
   * @method x
   * @methodOf AreaChart
   * @param {number} [value = 0] Value of the X coordinate in pixels.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the X label for the chart.
   *
   * @method xLabel
   * @methodOf AreaChart
   * @param {string} label Text to set as the label.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the X tick format of the chart.
   *
   * @method xTickFormat
   * @methodOf AreaChart
   * @param {Function} format Function to set as formatter.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the Y coordinate of the area chart. If negative, the chart's bottom side is measured from the bottom of the
   * parent, otherwise the top side is measured from the top.
   *
   * @method y
   * @methodOf AreaChart
   * @param {number} [value = 0] Value of the Y coordinate in pixels.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the Y label for the chart.
   *
   * @method yLabel
   * @methodOf AreaChart
   * @param {string} label Text to set as the label.
   * @returns {AreaChart} The AreaChart itself.
   */

  /**
   * Sets the Y tick format of the chart.
   *
   * @method yTickFormat
   * @methodOf AreaChart
   * @param {Function} format Function to set as formatter.
   * @returns {AreaChart} The AreaChart itself.
   */
}
