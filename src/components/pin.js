import luminanceAdjustedColor from '../utils/luminance-adjusted-color'
import extend from '../core/extend'
import attributes from '../utils/attributes'

/**
 * Component implementing the pin feature. A pin is a vertical line with a circle on the top and an optional text label
 * as description. When this component is available for a widget, its API is exposed via the {.pin} namespace.
 *
 * @function Pin
 */
// TODO Add options.fix to show label all the time.
export default scales => (() => {
  return (self, api) => {
    // Private members
    let _ = {
      // Variables
      container: undefined,
      pins: new Map(),

      // Methods
      getContainer: () => {
        // Get or create container.
        if (typeof _.container === 'undefined') {
          _.container = self._chart.plots.append('g')
            .attr('class', 'pin-container')
            .attr('clip-path', `url(#${self._chart.clipId})`)
        }
        return _.container
      }
    }

    // Extend widget update
    self._widget.update = extend(self._widget.update, duration => {
      _.pins.forEach(pin => pin.update(duration))
    })

    // Public API
    api = Object.assign(api || {}, {
      pin: {
        /**
         * Adds a pin to the chart. If the pon ID already exists, the pin with the existing ID is updated.
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
         * @param {number} duration Duration of the animation of adding the pin.
         * @returns {Widget} Reference to the Widget's API.
         */
        add: (id, position, options = {}, duration) => {
          // Check if pin exists
          if (_.pins.has(id)) {
            return api
          }

          // Get marker positions
          let scaleX = scales.x.scale
          let scaleY = scales.y.scale
          const color = options.color || self._font.color
          const height = (1 - (options.height || 1)) * scaleY.range()[0]
          const text = options.text || ''

          // Add pin group
          const g = _.getContainer().append('g')
            .attr('class', 'pin')
            .style('color', color)
            .style('opacity', 0)

          // Pin label
          const label = g.append('g')
            .attr('class', 'pin-label')
            .style('opacity', 0)
            .style('pointer-events', 'none')

          // Label text
          const labelText = attributes(label.append('text'), {
            class: 'pin-label-text',
            y: height - (options.size || 6) - 10,
            'text-anchor': 'start',
            stroke: 'none',
            fill: luminanceAdjustedColor(color)
          }).text(text)

          // Compute text length, adjust text
          const length = labelText.node().getComputedTextLength() * 1.05
          labelText.attr('x', Math.min(scaleX(position), scaleX.range()[1] - length) - 10)
            .attr('textLength', length)

          // Label box
          let bbox = labelText.node().getBBox()
          const labelBox = attributes(label.append('rect'), {
            class: 'pin-label-box',
            x: bbox.x - 5,
            y: bbox.y - 5,
            width: bbox.width + 10,
            height: bbox.height + 10,
            rx: 2,
            stroke: 'none',
            fill: text === '' ? 'none' : color
          })
          // Move box behind text
          label.node().insertBefore(labelBox.node(), labelText.node())

          // Mouse event handlers
          const mouseover = () => {
            // Show label
            label.transition().duration(300).style('opacity', 1)

            // Hide other pins
            _.pins.forEach(p => {
              p.g.transition().duration(300)
                .style('opacity', p.g === g ? 1 : 0.1)
            })
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

          const click = (() => {
            let isClicked = false

            return () => {
              if (isClicked) {
                // Hide label
                label.transition().duration(300).style('opacity', 0)

                // Show other pins
                _.pins.forEach(p => {
                  p.g.transition().duration(300)
                    .style('opacity', 1)
                })

                // Update click status
                isClicked = false
              } else {
                // Show label
                label.transition().duration(300).style('opacity', 1)

                // Hide other pins
                _.pins.forEach(p => {
                  p.g.transition().duration(300)
                    .style('opacity', p.g === g ? 1 : 0.1)
                })

                // Update click status
                isClicked = true
              }
            }
          })()

          // Pin needle with mouse interactions
          const needle = attributes(g.append('line'), {
            class: 'pin-needle',
            x1: scaleX(position) + 1,
            y1: scaleY.range()[0],
            x2: scaleX(position) + 1,
            y2: height,
            stroke: 'currentColor',
            'stroke-width': '2px'
          }).style('pointer-events', 'all')
            .on('click.pin', click)
            .on('mouseover.pin', mouseover)
            .on('mouseleave.pin', mouseleave)

          // Pin head with mouse interactions
          const head = attributes(g.append('circle'), {
            class: 'pin-head',
            cx: scaleX(position) + 1,
            cy: height,
            r: (options.size || 6) + 'px',
            stroke: 'white',
            'stroke-width': '1px',
            fill: 'currentColor'
          }).style('pointer-events', 'all')
            .on('mouseover.pin', mouseover)
            .on('mouseleave.pin', mouseleave)

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
              labelText.attr('x', Math.min(scaleX(position), scaleX.range()[1] - length) - 10)
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
         * @param {number} duration Duration of the remove animation.
         * @returns {Widget} Reference to the Widget's API.
         */
        remove: (id, duration) => {
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

          return api
        }
      }
    })

    return { self, api }
  }
})()
