import { format } from 'd3-format'
import { select } from 'd3-selection'
import { line, area, curveMonotoneX, curveLinear } from 'd3-shape'
import { bisector } from 'd3-array'
import { compose, encode, extend } from '../../../core/src/index'
import Chart from '../../../components/chart/src/index'
import Scale from '../../../components/scale/src/index'
import Axis from '../../../components/axis/src/index'

export default (name, parent) => {
  let { self, api } = Chart('line-chart', name, parent, 'svg')
  self._areaChart = {
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
  self._tooltip.builder = () => {
    // TODO
    return 'Hello world!'
  }
  self._chart.plotSelectors = ['.area']
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

  // Private methods
  const _updateLineChart = duration => {
    // Collect all data points
    const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])
    const yData = flatData.map(d => d.y)
    const yMin = Math.min(...yData)
    const yMax = Math.max(...yData)

    // Update scales
    self._areaChart.scales.x.range(0, parseInt(self._widget.size.innerWidth))
      .domain(flatData.map(d => d.x))
    self._areaChart.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
      .domain(flatData.map(d => d.y))

    // Update axes
    self._areaChart.axes.x.label(self._areaChart.xLabel)
      .scale(self._areaChart.scales.x.scale)
      .tickFormat(self._areaChart.xTickFormat)
      .update(duration)
    self._areaChart.axes.y.label(self._areaChart.yLabel)
      .scale(self._areaChart.scales.y.scale)
      .tickFormat(self._areaChart.yTickFormat)
      .update(duration)

    // Create line and error path functions
    const areaFn = area()
      .x(d => self._areaChart.scales.x.scale(d.x))
      .y0(parseFloat(self._widget.size.innerHeight))
      .y1(d => self._areaChart.scales.y.scale(Math.min(yMax, d.y)))
      .curve(self._areaChart.smooth ? curveMonotoneX : curveLinear)

    // Add plots
    self._chart.plotGroups(self._chart.plots, {
      enter: g => {
        // Add areas
        g.append('path')
          .attr('class', d => `area ${encode(d.name)}`)
          .attr('d', d => areaFn(d.values))
          .style('stroke', 'none')
          .style('fill-opacity', 0.2)
          .each(d => {
            // Take paths for tooltip marker
            self._areaChart.paths.set(d.name, select(`.line.${encode(d.name)}`).node())
          })
        return g
      },
      union: {
        after: g => {
          // Update area
          g.select('.area')
            .attr('d', d => areaFn(d.values))
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
      self._areaChart.xLabel = label
      return api
    },
    yLabel: label => {
      self._areaChart.yLabel = label
      return api
    },
    xTickFormat: format => {
      self._areaChart.xTickFormat = format
      return api
    },
    yTickFormat: format => {
      self._areaChart.yTickFormat = format
      return api
    },
    smooth: on => {
      self._areaChart.smooth = on
      return api
    }
  })
  return api
}
