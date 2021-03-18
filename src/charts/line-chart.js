import { bisector, extent, select, line, area } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import compose from '../core/compose'
import extend from '../core/extend'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import LineStyle from '../components/line-style'
import LineWidth from '../components/line-width'
import Objects from '../components/objects'
import Pins from '../components/pins'
import PlotMarker from '../components/plot-marker'
import PointTooltip from '../components/tooltip/point-tooltip'
import Scale from '../components/scale'
import Smoothing from '../components/smoothing'
import Trends from '../components/trends'
import XGrid from '../components/grid/x-grid'
import XRange from '../components/range/x-range'
import YGrid from '../components/grid/y-grid'
import YRange from '../components/range/y-range'

/**
 * The line chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Lines can be highlighted by passing their plots names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/line-style.html">LineStyle</a></li>
 *   <li><a href="../components/line-width.html">LineWidth</a></li>
 *   <li><a href="../components/objects.html">Objects</a></li>
 *   <li><a href="../components/pins.html">Pins</a></li>
 *   <li><a href="../components/plot-marker.html">PlotMarker</a></li>
 *   <li><a href="../components/point-tooltip.html">PointTooltip</a></li>
 *   <li><a href="../components/smoothing.html">Smoothing</a></li>
 *   <li><a href="../components/trends.html">Trend</a></li>
 *   <li><a href="../components/x-grid.html">XGrid</a></li>
 *   <li><a href="../components/x-range.html">XRange</a></li>
 *   <li><a href="../components/y-grid.html">YGrid</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * Note that the line chart automatically adds a small extension to the vertical axis, which can of be overwritten by
 * the YRange component API.
 *
 * @function LineChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Build scales.
  const scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }

  // Build widget from components.
  const { self, api } = compose(
    Chart('line-chart', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    Objects(scales),
    Highlight(() => self._chart.plots, ['.plot-group', '.plot-marker', '.trends-marker']),
    LineStyle,
    LineWidth(2),
    Pins(scales),
    PlotMarker,
    PointTooltip,
    Smoothing,
    Trends(scales),
    XGrid, XRange,
    YGrid, YRange
  )

  // Private members
  const _ = {
    // Data variables.
    scales,

    // Methods
    update: duration => {
      // Create flat data.
      const flatData = self._chart.data.reduce((arr, d) => arr.concat(d.values), [])
        .filter(d => d.y !== null)
      const hasErrorBand = flatData.filter(d => d.lo + d.hi > 0).length > 0

      // Add some buffer to the vertical range.
      const yData = flatData.map(d => d.y - d.lo).concat(flatData.map(d => d.y + d.hi))
      const yRange = extent(yData)
      const yBuffer = 0.01 * (yRange[1] - yRange[0])
      yRange[1] += yBuffer
      yRange[0] -= yBuffer

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(self._xRange.range(flatData.map(d => d.x)))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._yRange.range(yRange))

      // Create line and error path functions
      const lineFn = line()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.open())
      const errorFn = area()
        .defined(d => d.y !== null)
        .x(d => _.scales.x.scale(d.x))
        .y0(d => _.scales.y.scale(d.y - d.lo))
        .y1(d => _.scales.y.scale(d.y + d.hi))
        .curve(self._smoothing.open())

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            .style('color', self._color.mapper)

          // Add error bands
          g.append('path')
            .attr('class', 'error-band')
            .attr('d', d => errorFn(d.values))
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')
            .attr('fill-opacity', 0)

          // Add lines
          g.append('path')
            .attr('class', 'line')
            .attr('d', d => lineFn(d.values))
            .attr('stroke', 'currentColor')
            .attr('fill', 'none')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
          return g
        },

        update: g => {
          // Show group.
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          // Update error bands.
          g.select('.error-band')
            // Show error bands only if there is any.
            .attr('fill-opacity', hasErrorBand ? 0.2 : 0)
            .attrTween('d', function (d) {
              const previous = select(this).attr('d')
              const current = errorFn(d.values)
              return interpolatePath(previous, current, null)
            })

          // Update lines.
          g.select('.line')
            .attrTween('d', function (d) {
              const previous = select(this).attr('d')
              const current = lineFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('stroke-dasharray', d => self._lineStyle.strokeDashArray(d.name))

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides.
  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get bisection.
    const bisect = bisector(d => _.scales.x.scale(d.x)).left
    const index = mouse ? self._chart.data.map(d => bisect(d.values, mouse[0])) : undefined

    // If no data point is found, just remove tooltip elements.
    if (typeof index === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get plots, only those that are not ignored.
    let x = _.scales.x.scale.invert(mouse[0])
    const plots = self._chart.data.filter(d => self._tooltip.ignore.indexOf(d.name) === -1)
      .map((d, i) => {
        // Data point
        const j = index[i]

        const data = d.values

        const left = data[j - 1] ? data[j - 1] : data[j]

        const right = data[j] ? data[j] : data[j - 1]

        const point = x - left.x > right.x - x ? right : left
        x = point.x

        // Marker
        if (point.y !== null && self._yRange.contains(point.y)) {
          self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name, d)
        } else {
          self._plotMarker.remove(d.name)
        }

        return {
          name: d.name,
          background: self._lineStyle.background(self._lineStyle.style(d.name), self._color.mapper(d)),
          x: point.x,
          y: point.y,
          lo: point.lo,
          hi: point.hi
        }
      })

    return {
      // TODO Replace this with the data points.
      title: x,
      content: {
        data: plots
      }
    }
  }

  // TODO Pre-compute solely data related metrics.
  self._chart.transformData = data => {
    return data.map(d => ({
      name: d.name,
      values: d.values.sort((a, b) => a.x - b.x)
        .map(dd => ({
          x: +dd.x,
          y: dd.y === null ? dd.y : +dd.y,
          lo: +dd.lo || 0,
          hi: +dd.hi || 0
        }))
    }))
  }

  // Extend widget update
  // Update plot before widget update because trends markers need the data update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  /**
   * Set/updates the data that is shown in the line chart.
   *
   * @method data
   * @methodOf LineChart
   * @param {Object[]} plots Array of objects representing the lines to show. Each plot has two properties:
   * <dl>
   *   <dt>name</dt>   <dd>{string} Name of the plot.</dd>
   *   <dt>values</dt> <dd>{Object[]} Plot data.</dd>
   * </dl>
   * The {values} property is an array of objects of the following structure:
   * <dl>
   *   <dt>x</dt> <dd>{number} X coordinate of the data point.</dd>
   *   <dt>y</dt> <dd>{number} Y coordinate of the data point. For missing data, this value can be null.</dd>
   *   <dt>lo</dt> <dd>{number} Optional lower error of the data point.</dd>
   *   <dt>hi</dt> <dd>{number} Optional upper error of the data point.</dd>
   * </dl>
   * @returns {LineChart} Reference to the LineChart API.
   *
   * const line = dalian.LinePlot('my-chart')
   *   .data([{
   *     name: 'trend 1',
   *     values: [
   *       {x: 1.3, y: 2.3},
   *       {x: 1.4, y: 2.1, lo: 1, hi: 0.5},
   *       {x: 5.3, y: -2.3},
   *       ...
   *     ]
   *   }, {
   *     name: 'trend 2',
   *     values: [
   *       {x: 2.5, y: 7.1, lo: 1.2},
   *       {x: 3.8, y: 5.3, hi: 1.3},
   *       {x: 1.7, y: 2.4},
   *       ...
   *     ]
   *   } ... ])
   *   .render()
   */
  return api
}
