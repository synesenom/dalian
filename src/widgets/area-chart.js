import { area, bisector, extent, line, select } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import encode from '../core/encode'
import extend from '../core/extend'
import compose from '../core/compose'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Opacity from '../components/opacity'
import PlotMarker from '../components/plot-marker'
import PointTooltip from '../components/tooltip/point-tooltip'
import Scale from '../components/scale'
import Smoothing from '../components/smoothing'
import YRange from '../components/range/y-range'

/**
 * The area chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [Highlight]{@link ../components/highlight.html},
 * [LeftAxis]{@link ../components/left-axis.html},
 * [Opacity]{@link ../components/opacity.html},
 * [PointTooltip]{@link ../components/point-tooltip.html},
 * [Smoothing]{@link ../components/smoothing.html}.
 *
 * @function AreaChart
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
    Chart('area-chart', name, parent, 'svg'),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    PlotMarker,
    Opacity(0.4),
    Smoothing,
    PointTooltip,
    Highlight(['.plot-group', '.plot-marker']),
    YRange
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {
      // Collect all data points
      const flatData = self._chart.data.map(d => d.values).flat()

      // Add some buffer one sided to the vertical range.
      const yData = flatData.map(d => d.y)
      const yRange = extent(yData)
      const yBuffer = 0.01 * (yRange[1] - yRange[0])
      yRange[1] += yBuffer

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(flatData.map(d => d.x))
      // Make sure scale starts at 0
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._yRange.range(yRange))

      // Create area and line.
      const areaFn = area()
        .x(d => _.scales.x.scale(d.x))
        .y0(() => _.scales.y.scale(0))
        .y1(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())
      const lineFn = line()
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .curve(self._smoothing.curve())

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)

          // Add area.
          g.append('path')
            .attr('class', d => `area ${encode(d.name)}`)
            .attr('d', d => areaFn(d.values))
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')

          // Add line.
          g.append('path')
            .attr('class', d => `line ${encode(d.name)}`)
            .attr('d', d => lineFn(d.values))
            .attr('fill', 'none')
            .attr('stroke', 'currentColor')
          return g
        },
        update: g => {
          // Update area.
          g.select('.area')
            .attrTween('d', function (d) {
              let previous = select(this).attr('d')
              let current = areaFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .style('fill-opacity', self._opacity.value())

          // Update line.
          g.select('.line')
            .attrTween('d', function (d) {
              let previous = select(this).attr('d')
              let current = lineFn(d.values)
              return interpolatePath(previous, current, null)
            })

          g.style('opacity', 1)

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
        self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name, d.name)

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
          y: dd.y
        }))
    }))
  }

  // Extend widget update
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  return api

  // Documentation.
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
   * @returns {AreaChart} Reference to the AreaChart API.
   */
}
