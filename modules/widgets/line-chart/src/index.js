import { format } from 'd3-format'
import { select } from 'd3-selection'
import { line, area } from 'd3-shape'
import { bisector } from 'd3-array'
import { compose, encode, extend } from '../../../core/src/index'
import Chart from '../../../components/chart/src/index'
import Scale from '../../../components/scale/src/index'
import LeftAxis from '../../../components/axis/src/left-axis'
import BottomAxis from '../../../components/axis/src/bottom-axis'
import Smoothing from '../../../components/smoothing/src/index'
import LineStyle from '../../../components/line-style/src/index'
import PlotMarker from '../../../components/plot-marker/src/index'
import { PointTooltip } from '../../../components/tooltip/src/index'
import Highlight from '../../../components/highlight/src/index'
import TrendMarker from '../../../components/trend-marker/src/index'

/**
 * The line chart widget.
 *
 * @class LineChart
 * @param {string} name Name of the widget. Should be a unique identifier.
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
    paths: new Map(),

    // Methods
    /**
     * The line chart's update method.
     *
     * @method update
     * @methodOf LineChart
     * @param {number} [duration] Duration of the update animation in ms.
     * @private
     */
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
            .each(d => {
              // Take paths for plot-marker
              _.paths.set(d.name, select(`.line.${encode(d.name)}`).node())
            })
          return g
        },
        union: {
          // TODO Fix ugly path update, make it continuous
          after: g => {
            // Update error bands
            g.select('.error-band')
              .attr('d', d => errorFn(d.values))

            // Update lines
            g.select('.line')
              .attr('d', d => lineFn(d.values))
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
      self._plotMarker.add(_.paths, d.name, mouse[0])

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
  // Update plot before widget update because the trend markers need the data update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  return api
}
