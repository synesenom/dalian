import { bisector } from 'd3-array'
import { encode, extend } from '../../../core/src/index'

/**
 * Factory of the trend marker feature.
 *
 * @function TrendMarker
 * @param {Object} self Object containing the protected variables and methods.
 * @param {Object} api Object containing the public API methods.
 * @param {Object} scales Object containing the X and Y scales.
 * @returns {{self: Object, api: Object}} Object containing the extended protected and public containers.
 */
// TODO Get rid of the scales parameter
export default (self, api, scales) => {
  // Private members
  let _ = {
    markers: new Map(),

    adjustMarker: (key, start, end) => {
      let data = self._chart.data.find(d => d.name === key)
      if (typeof data === 'undefined') {
        return
      }

      // Get trend-marker data point indices
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
      let plateau = y1 < y2 ? y2 : y1

      return {
        start: {
          x: x1,
          y: y1
        },
        end: {
          x: x2,
          y: y2
        },
        plateau
      }
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, duration => {
    _.markers.forEach(marker => marker.update(duration))
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Adds a trend marker to the chart. A trend marker is a labeled pair of dots indicating changes in the plot. If the
     * marker ID already exists, no further markers are added.
     *
     * @method addMarker
     * @methodOf TrendMarker
     * @param {string} id Unique identifier of the trend marker.
     * @param {string} key Key of the plot to add the trend marker to.
     * @param {number} start Starting (left side) value of the trend marker.
     * @param {number} end Ending (right side) value of the trend marker.
     * @param {string} label Label to display on the marker.
     * @param {number} [duration = 700] Duration of the animation of adding the marker.
     * @returns {Object} Reference to the TrendMarker API.
     */
    addMarker: (id, key, start, end, label, duration = 700) => {
      // Check if trend-marker exists
      if (_.markers.has(id)) {
        return
      }

      // Get marker positions
      let scaleX = scales.x.scale
      let scaleY = scales.y.scale
      let pos = _.adjustMarker(key, start, end)

      // Build group without showing it
      let g = self._chart.plots.append('g')
        .attr('class', 'trend-marker ' + encode(key))
        .style('opacity', 0)
      let horizontal = g.append('line')
        .attr('class', 'horizontal')
        .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)))
        .attr('y1', scaleY(pos.plateau))
        .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)))
        .attr('y2', scaleY(pos.plateau))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      let verticalStart = g.append('line')
        .attr('class', 'vertical-start')
        .attr('x1', scaleX(pos.start.x))
        .attr('y1', scaleY(pos.start.y))
        .attr('x2', scaleX(pos.start.x))
        .attr('y2', scaleY(pos.plateau))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      let circleStart = g.append('circle')
        .attr('class', 'start')
        .attr('cx', scaleX(pos.start.x))
        .attr('cy', scaleY(pos.start.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      let verticalEnd = g.append('line')
        .attr('class', 'vertical-end')
        .attr('x1', scaleX(pos.end.x))
        .attr('y1', scaleY(pos.end.y))
        .attr('x2', scaleX(pos.end.x))
        .attr('y2', scaleY(pos.plateau))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      let circleEnd = g.append('circle')
        .attr('class', 'end')
        .attr('cx', scaleX(pos.end.x))
        .attr('cy', scaleY(pos.end.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      let text = g.append('text')
        .attr('x', scaleX(pos.start.x))
        .attr('y', scaleY(pos.plateau))
        .attr('dy', -5)
        .attr('text-anchor', 'start')
        .style('fill', self._font.color)
        .style('font-family', 'inherit')
        .style('font-size', self._font.size)
        .text(label)

      // Show marker
      g.transition().duration(duration)
        .style('opacity', 1)

      let marker = {
        remove: (duration = 700) => {
          g.transition().duration(duration)
            .style('opacity', 0)
            .on('end', () => {
              g.remove()
            })
        },
        update: duration => {
          let pos = _.adjustMarker(key, start, end)
          horizontal
            .transition().duration(duration)
            .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)))
            .attr('y1', scaleY(pos.plateau))
            .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)))
            .attr('y2', scaleY(pos.plateau))
            .style('stroke', self._colors.mapping(key))
          verticalStart
            .transition().duration(duration)
            .attr('x1', scaleX(pos.start.x))
            .attr('y1', scaleY(pos.start.y))
            .attr('x2', scaleX(pos.start.x))
            .attr('y2', scaleY(pos.plateau))
            .style('stroke', self._colors.mapping(key))
          circleStart
            .transition().duration(duration)
            .attr('cx', scaleX(pos.start.x))
            .attr('cy', scaleY(pos.start.y))
            .style('fill', self._colors.mapping(key))
          verticalEnd
            .transition().duration(duration)
            .attr('x1', scaleX(pos.end.x))
            .attr('y1', scaleY(pos.end.y))
            .attr('x2', scaleX(pos.end.x))
            .attr('y2', scaleY(pos.plateau))
            .style('stroke', self._colors.mapping(key))
          circleEnd
            .transition().duration(duration)
            .attr('cx', scaleX(pos.end.x))
            .attr('cy', scaleY(pos.end.y))
            .style('fill', self._colors.mapping(key))
          text
            .style('font-size', self._font.size)
            .transition().duration(duration)
            .style('fill', self._font.color)
            .attr('x', scaleX(pos.start.x))
            .attr('y', scaleY(pos.plateau))
        }
      }

      // Add to markers
      _.markers.set(id, marker)
      return api
    },

    /**
     * Removes a trend marker from the chart.
     *
     * @method removeMarker
     * @methodOf TrendMarker
     * @param {string} id Identifier of the trend marker to remove. If trend marker with the specified identifier does
     * not exist, no change is applied.
     * @returns {Object} Reference to the TrendMarker API.
     */
    removeMarker: id => {
      if (_.markers.has(id)) {
        _.markers.get(id).remove()
        _.markers.delete(id)
      }
      return api
    },
  })

  return {self, api}
}
