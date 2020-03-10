import { getTextWidth } from '../utils/measure-text'

export default scales => (() => {
  return (self, api) => {
    // Private members
    let _ = {
      pins: new Map()
    }

    // Public API
    api = Object.assign(api, {
      /**
       * Adds a pin to the chart. A pin is a vertical line with a circle on the top and an optional text label to
       * describe the pin. If the  marker ID already exists, no further markers are added.
       *
       * @method addPin
       * @methodOf Pin
       * @param {string} id Unique identifier of the pin.
       * @param {number} position Horizontal position.
       * @param {Object} options Pin design options. Supported values:
       * <ul>
       *   <li>{string} <i>color</i>: Pin color.</li>
       *   <li>{number} <i>size</i>: Size of the pin head in pixels.</li>
       *   <li>{number} <i>height</i>: Pin height relative to the Y range.</li>
       *   <li>{string} <i>text</i>: Label to add to the pin. The label is visible when hovering over the pin.</li>
       * </ul>
       * @param {number} [duration = 400] Duration of the animation of adding the pin.
       * @returns {Object} Reference to the Pin API.
       */
      addPin: (id, position, options = {}, duration = 400) => {
        // Check if pin exists
        if (_.pins.has(id)) {
          return
        }

        // Get marker positions
        let scaleX = scales.x.scale
        let scaleY = scales.y.scale
        const height = (1 - (options.height || 1)) * scaleY.range()[0]
        const text = options.text || ''
        const style = window.getComputedStyle(self._widget.container.node())
        const length = getTextWidth(text, {
          size: options.fontSize || self._font.size,
          family: style.fontFamily
        })

        // Add pin
        const g = self._chart.plots.append('g')
          .attr('class', 'pin')
          .style('opacity', 0)
        g.append('line')
          .attr('class', 'pin-needle')
          .attr('x1', scaleX(position) + 1)
          .attr('y1', scaleY.range()[0])
          .attr('x2', scaleX(position) + 1)
          .attr('y2', height)
          .style('stroke', options.color || self._font.color)
          .style('stroke-width', '2px')
        g.append('circle')
          .attr('class', 'pin-head')
          .attr('cx', scaleX(position) + 1)
          .attr('cy', height)
          .attr('r', (options.size || 6) + 'px')
          .style('stroke', 'white')
          .style('stroke-width', '1px')
          .style('fill', options.color || self._font.color)
          .on('mouseover', () => {
            label.transition().duration(300)
              .style('opacity', 1)
          })
          .on('mouseleave', () => {
            label.transition().duration(300)
              .style('opacity', 0)
          })
        const label = g.append('text')
          .attr('class', 'pin-label')
          .attr('x', Math.min(scaleX(position), scaleX.range()[1] - length * 1.2) - 5)
          .attr('y', height - (options.size || 6) - 10)
          .attr('text-anchor', 'start')
          .style('opacity', 0)
          .text(text)

        // Show pin
        g.transition().duration(duration)
          .style('opacity', 1)

        const pin = {
          g: g,
          remove: duration => {
            g.transition().duration(duration)
              .style('opacity', 0)
              .on('end', () => {
                g.remove()
              })
          },
          update: duration => {
            g.select('.pin-needle')
              .transition().duration(duration)
              .attr('x1', scaleX(position) + 2)
              .attr('y1', scaleY.range()[0])
              .attr('x2', scaleX(position) + 2)
              .attr('y2', (1 - (height || 1)) * scaleY.range()[0])
            g.select('.pin-head')
              .transition().duration(duration)
              .attr('cx', scaleX(position) + 2)
              .attr('cy', (1 - (height || 1)) * scaleY.range()[0])
            g.select('.pin-label')
              .transition().duration(duration)
              .attr('x', Math.min(scaleX(position), scaleX.range()[1] - length * 1.2) - 5)
              .attr('y', height - (options.size || 6) - 10)
          }
        }

        // Add to pins
        _.pins.set(id, pin)
        return api
      },

      /**
       * Removes a pin from the chart.
       *
       * @method removePin
       * @methodOf Pin
       * @param {string} id Identifier of the pin to remove. If pin with the specified identifier does not exist, no
       * change is applied.
       * @param {number} duration Duration of the remove animation.
       * @returns {Object} Reference to the Pin API.
       */
      removePin: (id, duration = 400) => {
        if (_.pins.has(id)) {
          _.pins.get(id).remove(duration)
          _.pins.delete(id)
        }
        return api
      }
    })

    return { self, api }
  }
})()
