import { bisector } from 'd3'
import encode from '../core/encode'
import extend from '../core/extend'


/**
 * Component implementing the trend feature. A trend is a labeled pair of dots indicating changes in the plot. When this
 * component is available in a widget, it is accessible through the {.trend} namespace.
 *
 * @function Trend
 */
// TODO Add API .text()
// TODO Sync with XRange and YRange.
export default scales => (() => {
  return (self, api) => {
    // Private members
    let _ = {
      // Variables.
      container: undefined,
      trends: new Map(),

      // Methods
      getContainer: () => {
        // Get or create container.
        if (typeof _.container === 'undefined') {
          _.container = self._chart.plots.append('g')
            .attr('class', 'trend-container')
            .attr('clip-path', `url(#${self._chart.clipId})`)
        }
        return _.container
      },

      adjustTrend: (key, start, end) => {
        let data = self._chart.data.find(d => d.name === key)
        if (typeof data === 'undefined') {
          return
        }

        // Get trend data point indices
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
      _.trends.forEach(trend => trend.update(duration))
    })

    // Public API
    api.trend = {
      /**
       * Adds a trend to the chart. If the trend ID already exists, no further trends are added.
       *
       * @method add
       * @methodOf Trend
       * @param {string} id Unique identifier of the trends.
       * @param {string} key Key of the plot to add the trend to.
       * @param {number} start Starting (left side) value of the trend.
       * @param {number} end Ending (right side) value of the trend.
       * @param {string} label Label to display on the trend.
       * @param {number} [duration = 400] Duration of the animation of adding the trend.
       * @returns {Object} The object representing the trend. This object contains the DOM group containing the trend
       * and update/remove methods.
       */
      add: (id, key, start, end, label, duration = 400) => {
        // Check if trend exists
        if (_.trends.has(id)) {
          return api
        }

        // Get trend positions
        let scaleX = scales.x.scale
        let scaleY = scales.y.scale
        let pos = _.adjustTrend(key, start, end)

        // Build group without showing it
        const g = _.getContainer().append('g')
          .attr('class', 'trend trend-' + encode(key))
          .style('color', self._colors.mapping(key))
          .style('opacity', 0)
        // TODO Use attributes/styles methods to set properties
        const path = g.append('path')
          .attr('class', 'trend-line')
          .attr('fill', 'none')
          .attr('stroke', 'currentColor')
          .attr('stroke-dasharray', '3 3')
          .attr('stroke-width', 1)
          .attr('d', `M${scaleX(pos.start.x)},${scaleY(pos.start.y)}V${scaleY(pos.plateau)}H${scaleX(pos.end.x)}V${scaleY(pos.end.y)}`)
        const circleStart = g.append('circle')
          .attr('class', 'start')
          .attr('cx', scaleX(pos.start.x))
          .attr('cy', scaleY(pos.start.y))
          .attr('r', 4)
          .attr('stroke', 'none')
          .attr('fill', 'currentColor')
        const circleEnd = g.append('circle')
          .attr('class', 'end')
          .attr('cx', scaleX(pos.end.x))
          .attr('cy', scaleY(pos.end.y))
          .attr('r', 4)
          .attr('stroke', 'none')
          .attr('fill', 'currentColor')
        const text = g.append('text')
          .attr('x', scaleX(pos.start.x))
          .attr('y', scaleY(pos.plateau))
          .attr('dy', -5)
          .attr('text-anchor', 'start')
          .attr('fill', self._font.color)
          .style('font-family', 'inherit')
          .style('font-size', self._font.size)
          .text(label)

        // Show trend
        g.transition().duration(duration)
          .style('opacity', 1)

        const trend = {
          g,
          remove: duration => {
            g.transition().duration(duration)
              .style('opacity', 0)
              .on('end', () => {
                g.remove()
              })
          },
          update: duration => {
            // Update group.
            g.transition().duration(duration)
              .style('color', self._colors.mapping(key))

            // Update elements.
            const pos = _.adjustTrend(key, start, end)
            path.transition().duration(duration)
              .attr('d', `M${scaleX(pos.start.x)},${scaleY(pos.start.y)}V${scaleY(pos.plateau)}H${scaleX(pos.end.x)}V${scaleY(pos.end.y)}`)
            circleStart
              .transition().duration(duration)
              .attr('cx', scaleX(pos.start.x))
              .attr('cy', scaleY(pos.start.y))
            circleEnd
              .transition().duration(duration)
              .attr('cx', scaleX(pos.end.x))
              .attr('cy', scaleY(pos.end.y))
            text
              .attr('font-size', self._font.size)
              .attr('fill', self._font.color)
              .transition().duration(duration)
              .attr('x', scaleX(pos.start.x))
              .attr('y', scaleY(pos.plateau))
          }
        }

        // Add to trends
        _.trends.set(id, trend)
        return api
      },

      /**
       * Removes one or all trends from the chart.
       *
       * @method remove
       * @methodOf Trend
       * @param {string} [id = undefined] Identifier of the trend to remove. If trend with the specified identifier does
       * not exist, no change is applied. If it is not specified, all trends are removed from the current chart.
       * @param {number} [duration = 400] Duration of the remove animation.
       */
      remove: (id, duration) => {
        // If id is not specified, remove all trends
        if (typeof id === 'undefined') {
          _.trends.forEach(pin => pin.remove())
          _.trends.clear()
        }
        if (_.trends.has(id)) {
          // Otherwise, remove trend if it exists
          _.trends.get(id).remove(duration)
          _.trends.delete(id)
        }
      },
    }

    return { self, api }
  }
})()
