import { format } from 'd3-format'
import { select } from 'd3-selection'
import { line, area, curveMonotoneX, curveLinear } from 'd3-shape'
import { bisector } from 'd3-array'
import { compose, encode, extend } from '../../../core/src/index'
import Chart from '../../../components/chart/src/index'
import Scale from '../../../components/scale/src/index'
import Axis from '../../../components/axis/src/index'
import LineStyles from '../../../components/line-styles/src/index'

/**
 * A line chart widget.
 *
 * @class LineChart
 * @param name
 * @param parent
 */
export default (name, parent) => {

  // TODO Add marker
  // TODO Add tooltip
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    LineStyles
  )
  self._lineChart = {
    // TODO make smooth a component
    smooth: false,
    // TODO Make label a component
    xLabel: '',
    yLabel: '',
    // TODO Make tick format a component to encapsulate default format
    xTickFormat: v => typeof v === 'number' && v > 1 ? format('.2s')(v) : v + '',
    yTickFormat: v => typeof v === 'number' && v > 1 ? format('.2s')(v) : v + '',
    scales: {
      x: Scale('linear'),
      y: Scale('linear')
    },
    axes: {
      x: Axis('x', 'bottom', self),
      y: Axis('y', 'left', self)
    },
    paths: new Map()
  }

  // Protected
  self._tooltip.createContent = () => {
    // TODO
    return 'Hello world!'
  }
  self._chart.plotSelectors = ['.line', '.error-band']
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

  // Private methods
  const _updateLineChart = duration => {
    // Collect all data points
    const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])
    const yData = flatData.map(d => d.y)
    const yMin = Math.min(...yData)
    const yMax = Math.max(...yData)

    // Update scales
    self._lineChart.scales.x.range(0, parseInt(self._widget.size.innerWidth))
      .domain(flatData.map(d => d.x))
    self._lineChart.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
      .domain(flatData.map(d => d.y))

    // Update axes
    self._lineChart.axes.x.label(self._lineChart.xLabel)
      .scale(self._lineChart.scales.x.scale)
      .tickFormat(self._lineChart.xTickFormat)
      .update(duration)
    self._lineChart.axes.y.label(self._lineChart.yLabel)
      .scale(self._lineChart.scales.y.scale)
      .tickFormat(self._lineChart.yTickFormat)
      .update(duration)

    // Create line and error path functions
    const lineFn = line()
      .x(d => self._lineChart.scales.x.scale(d.x))
      .y(d => self._lineChart.scales.y.scale(d.y))
      .curve(self._lineChart.smooth ? curveMonotoneX : curveLinear)
    const errorFn = area()
      .x(d => self._lineChart.scales.x.scale(d.x))
      .y0(d => self._lineChart.scales.y.scale(Math.max(yMin, d.y - d.lo)))
      .y1(d => self._lineChart.scales.y.scale(Math.min(yMax, d.y + d.hi)))
      .curve(self._lineChart.smooth ? curveMonotoneX : curveLinear)


    self._chart.plotGroups(self._chart.plots, {
      enter: g => {
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
            // Take paths for tooltip marker
            self._lineChart.paths.set(d.name, select(`.line.${encode(d.name)}`).node())
          })
        return g
      },
      union: {
        after: g => {
          // Update error bands
          g.select('.error-band')
            .attr('d', d => errorFn(d.values))

          // Update lines
          g.select('.line')
            .attr('d', d => lineFn(d.values))
            .style('stroke-dasharray', d => self._lineStyles.mapping(d.name))
          return g
        }
      }
    }, duration)

    // TODO Add markers
  }

  self._widget.update = extend(self._widget.update, _updateLineChart)

  // Public API
  api = Object.assign(api, {
    xLabel: label => {
      self._lineChart.xLabel = label
      return api
    },
    yLabel: label => {
      self._lineChart.yLabel = label
      return api
    },
    xTickFormat: format => {
      self._lineChart.xTickFormat = format
      return api
    },
    yTickFormat: format => {
      self._lineChart.yTickFormat = format
      return api
    },
    smooth: on => {
      self._lineChart.smooth = on
      return api
    }
  })
  return api
}
