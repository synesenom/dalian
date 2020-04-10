import { bisector, select, line, area } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import LineStyle from '../components/line-style'
import LineWidth from '../components/line-width'
import Pin from '../components/pin'
import PlotMarker from '../components/plot-marker'
import PointTooltip from '../components/tooltip/point-tooltip'
import Scale from '../components/scale'
import Smoothing from '../components/smoothing'
import Trend from '../components/trend'
import XGrid from '../components/grid/x-grid'
import XRange from '../components/range/x-range'
import YGrid from '../components/grid/y-grid'
import YRange from '../components/range/y-range'

// TODO Add reference to components: Highlight, LineStyle, LineWidth, Smoothing.
/**
 * The line chart widget. Being a chart, it extends the [Chart]{@link ../components/chart} component, with all of its
 * available API. Furthermore, it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [LeftAxis]{@link ../components/left-axis.html},
 * [Pin]{@link ../components/pin.html},
 * [PointTooltip]{@link ../components/point-tooltip.html},
 * [Trend]{@link ../components/trend.html},
 * [XGrid]{@link ../components/x-grid.html},
 * [XRange]{@link ../components/x-range.html},
 * [YGrid]{@link ../components/y-grid.html},
 * [YRange]{@link ../components/y-range.html}.
 *
 * @function LineChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    XGrid,
    YGrid,
    XRange,
    YRange,
    LineStyle,
    LineWidth,
    Smoothing,
    PlotMarker,
    PointTooltip,
    Highlight(['.line', '.error-band', '.plot-marker', '.trend-marker']),
    Trend(scales),
    Pin(scales)
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {
      // Determine boundaries
      const flatData = self._chart.data.map(d => d.values).flat()
        .filter(d => d.y !== null)

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(self._xRange.range(flatData.map(d => d.x)))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._yRange.range(flatData.map(d => d.y - d.lo).concat(flatData.map(d => d.y + d.hi))))

      // Create line and error path functions
      const lineFn = line()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())
      const errorFn = area()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y0(d => _.scales.y.scale(d.y - d.lo))
        .y1(d => _.scales.y.scale(d.y + d.hi))
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
            .style('stroke-width', d => self._lineWidth.mapping(d.name))
            .style('opacity', 0)
            .style('fill', 'none')
            .style('stroke-linejoin', 'round')
            .style('stroke-linecap', 'round')
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

    // Get plots, only those that are not ignored
    let x = _.scales.x.scale.invert(mouse[0])
    let plots = self._chart.data.filter(d => self._tooltip.ignore.indexOf(d.name) === -1)
      .map((d, i) => {
      // Data point
      let j = index[i]

      let data = d.values

      let left = data[j - 1] ? data[j - 1] : data[j]

      let right = data[j] ? data[j] : data[j - 1]

      let point = x - left.x > right.x - x ? right : left
      x = point.x

      // Marker
      if (point.y !== null && self._yRange.contains(point.y)) {
        self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name, d.name)
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
   *   <dt>y {number}</dt> <dd>Y coordinate of the data point. For missing data, this value can be null.</dd>
   *   <dt>lo {number}</dt> <dd>Lower error of the data point. {optional}</dd>
   *   <dt>hi {number}</dt> <dd>Upper error of the data point. {optional}</dd>
   * </dl>
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
   * Enables/disables polygon smoothing.
   *
   * @method smoothing
   * @methodOf LineChart
   * @param {boolean} [on = false] Whether to enable polygon smoothing. If not specified, smoothing is disabled.
   * @returns {LineChart} The LineChart itself.
   */
}
