import { bisector } from 'd3-array'
import { encode, extend } from '../../../core/src/index'

export default (self, api) => {
  // Private members
  let _ = {
    // Variables
    markers: new Map(),

    // Methods
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
    },

    update: duration => {
      _.markers.forEach(marker => marker.update(duration))
    }
  }

  // Protected members
  self = Object.assign(self || {}, {
    addMarker: (id, key, start, end, label) => {
      // Check if marker exists
      if (_.markers.has(id)) {
        return
      }

      console.log('foo')
      let scaleX = _.scales.x.scale
      let scaleY = _.scales.y.scale
      let pos = _.adjustMarker(key, start, end)
      let g = self._chart.plots.append('g')
        .attr('class', 'marker ' + encode(key))
      g.append('line')
        .attr('class', 'horizontal')
        .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)))
        .attr('y1', scaleY(pos.corner.y))
        .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)))
        .attr('y2', scaleY(pos.corner.y))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      g.append('line')
        .attr('class', 'vertical')
        .attr('x1', scaleX(pos.corner.x))
        .attr('y1', scaleY(pos.start.y))
        .attr('x2', scaleX(pos.corner.x))
        .attr('y2', scaleY(pos.end.y))
        .style('stroke', self._colors.mapping(key))
        .style('stroke-dasharray', '3 3')
        .style('stroke-width', 1)
      g.append('circle')
        .attr('class', 'start')
        .attr('cx', scaleX(pos.start.x))
        .attr('cy', scaleY(pos.start.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      g.append('circle')
        .attr('class', 'end')
        .attr('cx', scaleX(pos.end.x))
        .attr('cy', scaleY(pos.end.y))
        .attr('r', 4)
        .style('stroke', 'none')
        .style('fill', self._colors.mapping(key))
      g.append('text')
        .attr('x', scaleX(pos.corner.x))
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
            .attr('x1', scaleX(Math.max(pos.start.x, pos.start.x)))
            .attr('y1', scaleY(pos.corner.y))
            .attr('x2', scaleX(Math.min(pos.end.x, pos.end.x)))
            .attr('y2', scaleY(pos.corner.y))
            .style('stroke', self._colors.mapping(key))
          g.select('.vertical')
            .transition().duration(duration)
            .attr('x1', scaleX(pos.corner.x))
            .attr('y1', scaleY(pos.start.y))
            .attr('x2', scaleX(pos.corner.x))
            .attr('y2', scaleY(pos.end.y))
            .style('stroke', self._colors.mapping(key))
          g.select('.start')
            .transition().duration(duration)
            .attr('cx', scaleX(pos.start.x))
            .attr('cy', scaleY(pos.start.y))
            .style('fill', self._colors.mapping(key))
          g.select('.end')
            .transition().duration(duration)
            .attr('cx', scaleX(pos.end.x))
            .attr('cy', scaleY(pos.end.y))
            .style('fill', self._colors.mapping(key))
          g.select('text')
            .style('font-size', self._font.size)
            .style('fill', self._font.color)
            .attr('text-anchor', pos.start.y < pos.end.y ? 'start' : 'end')
            .attr('x', scaleX(pos.corner.x))
            .transition().duration(duration)
            .attr('y', scaleY(pos.corner.y))
        }
      }

      // Add to markers
      _.markers.set(id, marker)
      return api
    }
  })

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update)

  // Public API
  api = Object.assign(api || {}, {
    addMarker: (id, key, start, end, label) => {

    },
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
