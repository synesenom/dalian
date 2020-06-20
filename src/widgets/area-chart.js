import { area, bisector, extent, line, select } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import extend from '../core/extend'
import compose from '../core/compose'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import LineColor from '../components/line-color'
import Objects from '../components/objects'
import Opacity from '../components/opacity'
import PlotMarker from '../components/plot-marker'
import PointTooltip from '../components/tooltip/point-tooltip'
import Scale from '../components/scale'
import Smoothing from '../components/smoothing'
import YRange from '../components/range/y-range'

/**
 * The area chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Plots can be highlighted by passing their plot names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/line-color.html">LineColor</a></li>
 *   <li><a href="../components/objects.html">Objects</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/point-tooltip.html">PointTooltip</a></li>
 *   <li><a href="../components/smoothing.html">Smoothing</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function AreaChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
// TODO Support negative values with different color.
export default (name, parent = 'body') => {
  // Build widget from components
  const scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('area-chart', name, parent),
    LeftAxis(scales.y),
    LineColor('currentColor'),
    BottomAxis(scales.x),
    PlotMarker,
    Objects(scales),
    Opacity(0.4),
    Smoothing,
    PointTooltip,
    Highlight(() => self._chart.plots, ['.plot-group', '.plot-marker']),
    YRange
  )

  // Private members
  const _ = {
    // Variables.
    scales,

    // Methods.
    update (duration) {
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
        .y0(_.scales.y.scale(0))
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
            .style('color', self._color.mapper)

          // Add area.
          g.append('path')
            .attr('class', 'area')
            .attr('d', d => areaFn(d.values))
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')

          // Add line.
          g.append('path')
            .attr('class', 'line')
            .attr('d', d => lineFn(d.values))
            .attr('fill', 'none')
            .attr('stroke', self._lineColor.mapping)

          return g
        },
        update: g => {
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          // Update area.
          g.select('.area')
            .attrTween('d', function (d) {
              const previous = select(this).attr('d')
              const current = areaFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .attr('fill-opacity', self._opacity.value())

          // Update line.
          g.select('.line')
            .attr('stroke', self._lineColor.mapping)
            .attrTween('d', function (d) {
              const previous = select(this).attr('d')
              const current = lineFn(d.values)
              return interpolatePath(previous, current, null)
            })

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._tooltip.content = mouse => {
    // If outside the plot, hide tooltip
    if (typeof mouse === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get bisection
    const bisect = bisector(d => _.scales.x.scale(d.x)).left
    const index = mouse ? self._chart.data.map(d => bisect(d.values, mouse[0])) : undefined

    // If no data point is found, just remove tooltip elements
    if (typeof index === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Get plots
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
        self._plotMarker.add(_.scales.x.scale(x), _.scales.y.scale(point.y), d.name, d)

        return {
          name: d.name,
          background: self._color.mapper(d),
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
          x: +dd.x,
          y: +dd.y
        }))
    }))
  }

  // Extend widget update
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Set/updates the data that is shown in the area chart.
     *
     * @method data
     * @methodOf AreaChart
     * @param {Object[]} plots Array of objects representing the area plots to show. Each plot has two properties:
     * <dl>
     *   <dt>name</dt>   <dd>{string} Name of the plot.</dd>
     *   <dt>values</dt> <dd>{Object[]} Plot data.</dd>
     * </dl>
     * The {values} property is an array of objects of the following structure:
     * <dl>
     *   <dt>x</dt> <dd>{number} X coordinate of the data point.</dd>
     *   <dt>y</dt> <dd>{number} Y coordinate of the data point.</dd>
     * </dl>
     * @returns {AreaChart} Reference to the AreaChart API.
     *
     * @example
     *
     * const area = dalian.AreaChart('my-chart')
     *   .data([{
     *     name: 'area 1',
     *     values: [
     *       {x: 0.0, y: 1.1},
     *       {x: 0.1, y: 1.2},
     *       {x: 0.2, y: 1.4}
     *       ...
     *     ]
     *   }, {
     *     name: 'area 2',
     *     values: [
     *       {x: 0.0, y: 4.3},
     *       {x: 0.1, y: 4.2},
     *       {x: 0.2, y: 3.8}
     *       ...
     *     ]
     *   }])
     *   .render()
     */
  })
  return api
}
