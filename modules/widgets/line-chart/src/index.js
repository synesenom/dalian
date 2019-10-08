import { format } from 'd3-format'
import { select } from 'd3-selection'
import { line, area } from 'd3-shape'
import { bisector } from 'd3-array'
import { compose, encode, extend } from '../../../core/src/index'
import Chart from '../../../components/chart/src/index'
import Scale from '../../../components/scale/src/index'
import Axis from '../../../components/axis/src/index'
import Smoothing from '../../../components/smoothing/src/index'
import LineStyles from '../../../components/line-styles/src/index'
import CurveMarker from '../../../components/curve-marker/src/index'

/**
 * The line chart widget.
 *
 * @class LineChart
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    LineStyles,
    CurveMarker,
    Smoothing
  )

  // Private members
  let _ = {
    // Variables
    scales: {
      x: Scale('linear'),
      y: Scale('linear')
    },
    axes: {
      x: Axis('x', 'bottom', self),
      y: Axis('y', 'left', self)
    },
    paths: new Map(),
    // TODO Make markers a component
    markers: new Map(),

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

      // Update axes
      _.axes.x.label(self._lineChart.xLabel)
        .scale(_.scales.x.scale)
        .tickFormat(self._lineChart.xTickFormat)
        .update(duration)
      _.axes.y.label(self._lineChart.yLabel)
        .scale(_.scales.y.scale)
        .tickFormat(self._lineChart.yTickFormat)
        .update(duration)

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
              // Take paths for tooltip marker
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

      // Add markers
      _.markers.forEach(marker => marker.update(duration))
    },

    /**
     * Adjusts marker. Sets position of handles and corner based on the start and end coordinates.
     *
     * @method adjustMarker
     * @methodOf LineChart
     * @param {string} key Identifier of the marker.
     * @param {(number | string)} start Start X position of the marker.
     * @param {(number | string)} end End X position of the marker.
     * @returns {(Object | undefined)} Object containing the marker positions if marker exists and could be adjusted,
     * undefined otherwise.
     * @private
     */
    adjustMarker: (key, start, end) => {
      let data = self._chart.data.find(d => d.name === key)
      if (typeof data === 'undefined') {
        return
      }

      // Get marker data point indices
      let bisect = bisector(d => d.x).left
      let i1 = bisect(data.values, start)
      let i2 = bisect(data.values, end)
      if (i1 === null || i2 === null) {
        return
      }

      // Get coordinates and color
      let x1 = data.values[i1].x

      let y1 = data.values[i1].y

      let x2 = data.values[i2].x

      let y2 = data.values[i2].y
      let xCorner = y1 < y2 ? x1 : x2
      let yCorner = y1 < y2 ? y2 : y1

      return {
        start: {
          x: x1,
          y: y1
        },
        end: {
          x: x2,
          y: y2
        },
        corner: {
          x: xCorner,
          y: yCorner
        }
      }
    }
  }

  // Protected members
  // TODO (there should not be any, since this is a final widget)

  self._lineChart = {
    // TODO Make label a component
    xLabel: '',
    yLabel: '',
    // TODO Make tick format a component to encapsulate default format
    xTickFormat: v => typeof v === 'number' && v > 1 ? format('.2s')(v) : v + '',
    yTickFormat: v => typeof v === 'number' && v > 1 ? format('.2s')(v) : v + '',
    // TODO move to 2D chart
    tooltipYFormat: v => v.toFixed(2)
  }

  // Protected
  // TODO Create separate method for mouse move
  // TODO Don't mix tooltip behavior with markers
  // TODO Create getXY method for obtaining plot coordinates of mouse
  // Extend inherited method
  self._chart.tooltipContent = mouse => {
    if (typeof mouse === 'undefined') {

      self._curveMarker.remove()
      return
    }
    // Get bisection
    let bisect = bisector(d => _.scales.x.scale(d.x)).left
    let index = mouse ? self._chart.data.map(d => bisect(d.values, mouse[0])) : undefined

    // If no data point is found, just remove tooltip elements
    if (typeof index === 'undefined') {
      self._curveMarker.remove()
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
      self._curveMarker.add(_.paths, d.name, mouse[0])

      // TODO Add tooltip format
      return {
        name: d.name,
        background: self._lineStyles.background(self._lineStyles.style(d.name), self._colors.mapping(d.name)),
        value: self._lineChart.tooltipYFormat(point.y)
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

  self._chart.plotSelectors = ['.line', '.error-band', '.tooltip-marker', '.marker']

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

  self._widget.update = extend(self._widget.update, _.update)

  // Public API
  api = Object.assign(api, {
    addMarker: (id, key, start, end, label, duration) => {
      // Check if marker exists
      if (_.markers.has(id)) {
        return
      }

      let scaleX = _.scales.x.scale
      let scaleY = _.scales.y.scale
      let pos = _.adjustMarker(key, start, end)
      let g = self._chart.plots.append('g')
        .attr('class', 'marker ' + encode(key))
      g.append('line')
        .attr('class', 'horizontal')
        .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)) + 2)
        .attr('y1', scaleY(pos.corner.y))
        .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)) + 2)
        .attr('y2', scaleY(pos.corner.y))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      g.append('line')
        .attr('class', 'vertical')
        .attr('x1', scaleX(pos.corner.x) + 2)
        .attr('y1', scaleY(pos.start.y))
        .attr('x2', scaleX(pos.corner.x) + 2)
        .attr('y2', scaleY(pos.end.y))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      g.append('circle')
        .attr('class', 'start')
        .attr('cx', scaleX(pos.start.x) + 2)
        .attr('cy', scaleY(pos.start.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      g.append('circle')
        .attr('class', 'end')
        .attr('cx', scaleX(pos.end.x) + 2)
        .attr('cy', scaleY(pos.end.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      g.append('text')
        .attr('x', scaleX(pos.corner.x) + 2)
        .attr('y', scaleY(pos.corner.y))
        .attr('dy', -5)
        .attr('text-anchor', pos.start.y < pos.end.y ? 'start' : 'end')
        .style('fill', self._font.color)
        .style('font-family', 'inherit')
        .style('font-size', self._font.size)
        .text(label)

      let marker = {
        remove: (duration = 700) => {
          g.transition().duration(duration)
            .style('opacity', 0)
            .on('end', () => {
              g.remove()
            })
        },
        update: duration => {
          let scaleX = _.scales.x.scale
          let scaleY = _.scales.y.scale
          let pos = _.adjustMarker(key, start, end)
          g.select('.horizontal')
            .transition().duration(duration)
            .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)) + 2)
            .attr('y1', scaleY(pos.corner.y))
            .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)) + 2)
            .attr('y2', scaleY(pos.corner.y))
            .style('stroke', self._colors.mapping(key))
          g.select('.vertical')
            .transition().duration(duration)
            .attr('x1', scaleX(pos.corner.x) + 2)
            .attr('y1', scaleY(pos.start.y))
            .attr('x2', scaleX(pos.corner.x) + 2)
            .attr('y2', scaleY(pos.end.y))
            .style('stroke', self._colors.mapping(key))
          g.select('.start')
            .transition().duration(duration)
            .attr('cx', scaleX(pos.start.x) + 2)
            .attr('cy', scaleY(pos.start.y))
            .style('fill', self._colors.mapping(key))
          g.select('.end')
            .transition().duration(duration)
            .attr('cx', scaleX(pos.end.x) + 2)
            .attr('cy', scaleY(pos.end.y))
            .style('fill', self._colors.mapping(key))
          g.select('text')
            .style('font-size', self._font.size)
            .style('fill', self._font.color)
            .attr('text-anchor', pos.start.y < pos.end.y ? 'start' : 'end')
            .attr('x', scaleX(pos.corner.x) + 2)
            .transition().duration(duration)
            .attr('y', scaleY(pos.corner.y))
        }
      }

      // Add to markers
      _.markers.set(id, marker)
      return api
    },
    removeMarker: id => {
      if (_.markers.has(id)) {
        _.markers.get(id).remove()
        _.markers.delete(id)
      }
      return api
    },
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
    }
  })
  return api
}
