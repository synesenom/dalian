import { bisector } from 'd3'
import encode from '../core/encode'
import extend from '../core/extend'
import attributes from '../utils/attributes'

/**
 * Component implementing the trends feature. A trends is a labeled pair of dots indicating changes in the plot. When this
 * component is available in a widget, it is accessible through the {.trends} namespace.
 *
 * @function Trends
 */
// TODO Add API .text()
export default scales => (() => {
  return (self, api) => {
    // Private members.
    const _ = {
      // Variables.
      container: undefined,
      trends: new Map()
    }

    // TODO Docstring.
    function getContainer () {
      // Get or create container.
      if (typeof _.container === 'undefined') {
        _.container = self._chart.plots.append('g')
          .attr('class', 'trends-container')
      }
      return _.container
    }

    // TODO Docstring.
    function adjustTrend (key, start, end) {
      const data = self._chart.data.find(d => d.name === key)
      if (typeof data === 'undefined') {
        return
      }

      // Get trends data point indices
      const bisect = bisector(d => d.x).left
      const i1 = bisect(data.values, start)
      const i2 = bisect(data.values, end)
      if (i1 === null || i2 === null) {
        return
      }

      // Get coordinates and color
      const x1 = data.values[i1].x

      const y1 = data.values[i1].y

      const x2 = data.values[i2].x

      const y2 = data.values[i2].y
      const plateau = y1 < y2 ? y2 : y1

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

    // Extend widget update.
    self._widget.update = extend(self._widget.update, duration => {
      _.trends.forEach(trend => trend.update(duration))
    })

    // Public API.
    api = Object.assign(api || {}, {
      trends: {
        /**
         * Adds a trends to the chart. If the trends ID already exists, no further trends are added.
         *
         * @method add
         * @memberOf Trends
         * @param {string} id Unique identifier of the trends.
         * @param {string} key Key of the plot to add the trends to.
         * @param {number} start Starting (left side) value of the trends.
         * @param {number} end Ending (right side) value of the trends.
         * @param {string} label Label to display on the trends.
         * @param {string} color Color of the trend line.
         * @param {number} [duration = 0] Duration of the animation of adding the trends.
         * @returns {Object} The object representing the trends. This object contains the DOM group containing the trends
         * and update/remove methods.
         */
        add: (id, key, start, end, label, color, duration = 0) => {
          // Check if trends exists
          if (_.trends.has(id)) {
            return api
          }

          // Get trends positions
          const scaleX = scales.x.scale
          const scaleY = scales.y.scale
          const pos = adjustTrend(key, start, end)

          // Build group without showing it
          const g = getContainer().append('g')
            .attr('class', 'trend trend-' + encode(key))
            .style('color', color || '#000')
            .style('opacity', 0)
          const path = attributes(g.append('path'), {
            fill: 'none',
            stroke: 'currentColor',
            'stroke-dasharray': '3 3',
            'stroke-width': 1,
            d: `M${scaleX(pos.start.x)},${scaleY(pos.start.y)}V${scaleY(pos.plateau)}H${scaleX(pos.end.x)}V${scaleY(pos.end.y)}`
          })
          const circleStart = attributes(g.append('circle'), {
            cx: scaleX(pos.start.x),
            cy: scaleY(pos.start.y),
            r: 4,
            stroke: 'none',
            fill: 'currentColor'
          })
          const circleEnd = attributes(g.append('circle'), {
            cx: scaleX(pos.end.x),
            cy: scaleY(pos.end.y),
            r: 4,
            stroke: 'none',
            fill: 'currentColor'
          })
          const text = attributes(g.append('text'), {
            x: scaleX(pos.start.x),
            y: scaleY(pos.plateau),
            dy: -5,
            'text-anchor': 'start',
            fill: self._font.color
          }).style('font-family', 'inherit')
            .style('font-size', self._font.size)
            .text(label)

          // Show trends
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
                .style('color', color || '#000')

              // Update elements.
              const pos = adjustTrend(key, start, end)
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
         * @memberOf Trends
         * @param {string} [id = undefined] Identifier of the trends to remove. If trends with the specified identifier
         * does not exist, no change is applied. If it is not specified, all trends are removed from the current chart.
         * @param {number} [duration = 0] Duration of the remove animation.
         */
        remove: (id, duration = 0) => {
          // If id is not specified, remove all trends
          if (typeof id === 'undefined') {
            _.trends.forEach(pin => pin.remove())
            _.trends.clear()
          }
          if (_.trends.has(id)) {
            // Otherwise, remove trends if it exists
            _.trends.get(id).remove(duration)
            _.trends.delete(id)
          }
        }
      }
    })

    return { self, api }
  }
})()
