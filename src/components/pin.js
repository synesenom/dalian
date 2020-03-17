import luminance from '../utils/luminance'
import extend from '../core/extend'


/**
 * Component implementing the pin feature. A pin is a vertical line with a circle on the top and an optional text label
 * as description. When this component is available in a widget, it is accessible through the {.pin} namespace.
 *
 * @function Pin
 */
export default scales => (() => {
  return (self, api) => {
    // Private members
    let _ = {
      pins: new Map()
    }

    // Extend widget update
    self._widget.update = extend(self._widget.update, duration => {
      _.pins.forEach(pin => pin.update(duration))
    })

    // Public API
    api.pin = {
      /**
       * Adds a pin to the chart. If the  marker ID already exists, no further markers are added.
       *
       * @method add
       * @methodOf Pin
       * @param {string} id Unique identifier of the pin.
       * @param {number} position Value to add pin to.
       * @param {Object} [options = {}] Pin design options. Supported values:
       * <ul>
       *   <li>{string} <i>color</i>: Pin color.</li>
       *   <li>{number} <i>size</i>: Size of the pin head in pixels.</li>
       *   <li>{number} <i>height</i>: Pin height relative to the Y range.</li>
       *   <li>{string} <i>text</i>: Label to add to the pin. The label is visible when hovering over the pin.</li>
       * </ul>
       * @param {number} [duration = 400] Duration of the animation of adding the pin.
       * @returns {Object} The object representing the pin. This object contains the DOM group containing the pin and
       * update/remove methods.
       */
      add: (id, position, options = {}, duration = 400) => {
        // Check if pin exists
        if (_.pins.has(id)) {
          return
        }

        // Get marker positions
        let scaleX = scales.x.scale
        let scaleY = scales.y.scale
        const color = options.color || self._font.color
        const height = (1 - (options.height || 1)) * scaleY.range()[0]
        const text = options.text || ''

        // Add pin group
        const g = self._chart.plots.append('g')
          .attr('class', 'pin')
          .style('opacity', 0)

        // Pin label
        const label = g.append('g')
          .attr('class', 'pin-label')
          .style('opacity', 0)
          .style('pointer-events', 'none')

        // Label text
        const labelText = label.append('text')
          .attr('class', 'pin-label-text')
          .attr('y', height - (options.size || 6) - 10)
          .attr('text-anchor', 'start')
          .attr('stroke', 'none')
          .attr('fill', luminance(color) > 0.179 ? '#000' : '#fff')
          .text(text)

        // Compute text length, adjust text
        const length = labelText.node().getComputedTextLength() * 1.05
        labelText.attr('x', Math.min(scaleX(position), scaleX.range()[1] - length))
          .attr('textLength', length)

        // Label box
        let bbox = labelText.node().getBBox()
        const labelBox = label.append('rect')
          .attr('class', 'pin-label-box')
          .attr('x', bbox.x - 5)
          .attr('y', bbox.y - 5)
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 10)
          .attr('rx', 2)
          .attr('stroke', 'none')
          .attr('fill', text === '' ? 'none' : color)
        // Move box behind text
        label.node().insertBefore(labelBox.node(), labelText.node())

        // Updates
        const mouseover = function () {
          // Show label
          label.transition().duration(300).style('opacity', 1)

          // Hide other pins
          _.pins.forEach(p => {
            p.g.transition().duration(300)
              .style('opacity', p.g === g ? 1 : 0.1)
          })
        }
        const mousemove = () => {
          g.remove()
          self._chart.plots.node().appendChild(g.node())
        }
        const mouseleave = () => {
          // Hide label
          label.transition().duration(300).style('opacity', 0)

          // Show other pins
          _.pins.forEach(p => {
            p.g.transition().duration(300)
              .style('opacity', 1)
          })
        }

        // Pin needle with mouse interactions
        const needle = g.append('line')
          .attr('class', 'pin-needle')
          .attr('x1', scaleX(position) + 1)
          .attr('y1', scaleY.range()[0])
          .attr('x2', scaleX(position) + 1)
          .attr('y2', height)
          .style('stroke', color)
          .style('stroke-width', '2px')
          .style('pointer-events', 'all')
          .on('mouseover', mouseover)
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave)

        // Pin head with mouse interactions
        const head = g.append('circle')
          .attr('class', 'pin-head')
          .attr('cx', scaleX(position) + 1)
          .attr('cy', height)
          .attr('r', (options.size || 6) + 'px')
          .style('stroke', 'white')
          .style('stroke-width', '1px')
          .style('fill', color)
          .style('pointer-events', 'all')
          .on('mouseover', mouseover)
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave)

        // Show pin
        g.transition().duration(duration)
          .style('opacity', 1)

        const pin = {
          g,
          remove: duration => {
            g.transition().duration(duration)
              .style('opacity', 0)
              .on('end', () => {
                g.remove()
              })
          },
          update: duration => {
            needle.transition().duration(duration)
              .attr('x1', scaleX(position) + 1)
              .attr('y1', scaleY.range()[0])
              .attr('x2', scaleX(position) + 1)
              .attr('y2', height)
            head.transition().duration(duration)
              .attr('cx', scaleX(position) + 1)
              .attr('cy', height)
            labelText.attr('x', Math.min(scaleX(position), scaleX.range()[1] - length))
              .attr('y', height - (options.size || 6) - 10)
            bbox = labelText.node().getBBox()
            labelBox.attr('x', bbox.x - 5)
              .attr('y', bbox.y - 5)
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 10)
          }
        }

        // Add to pins
        _.pins.set(id, pin)
        return api
      },

      /**
       * Removes one or all pins from the chart.
       *
       * @method remove
       * @methodOf Pin
       * @param {string} [id = undefined] Identifier of the pin to remove. If pin with the specified identifier does not
       * exist, no change is applied. If it is not specified, all pins are removed from the current chart.
       * @param {number} [duration = 400] Duration of the remove animation.
       */
      remove: (id, duration = 400) => {
        // If id is not specified, remove all pins
        if (typeof id === 'undefined') {
          _.pins.forEach(pin => pin.remove())
          _.pins.clear()
        }
        if (_.pins.has(id)) {
          // Otherwise, remove pin if it exists
          _.pins.get(id).remove(duration)
          _.pins.delete(id)
        }
      }
    }

    return { self, api }
  }
})()
