import extend from '../core/extend'

/**
 * Component implementing the objects feature. This feature allows for inserting various SVG elements to the background
 * of a chart. When this component is available for a widget, its API is exposed via the {.objects} namespace.
 *
 * @function Objects
 */
export default scales => (() => {
  return (self, api) => {
    // Private members
    const _ = {
      // Variables
      containers: {
        background: undefined
      },
      objects: new Map(),

      // Methods
      getContainer (type = 'background') {
        // Get or create container.
        if (typeof _.containers[type] === 'undefined') {
          _.containers[type] = self._chart.plots.append('g')
            .attr('class', 'objects-container')
          if (type === 'background') {
            _.containers[type].lower()
          } else {
            _.containers[type].raise()
          }
        }
        return _.containers[type]
      }
    }

    // Extend widget update
    self._widget.update = extend(self._widget.update, duration => {
      _.objects.forEach(obj => obj.update(duration))
    })

    api = Object.assign(api || {}, {
      // TODO Add convert method to get sizes using internal coordinates.
      // TODO Add hidden SVG to draw object in before inserting.
      objects: {
        /**
         * Adds an SVG object to the widget using internal (data level) coordinates.
         *
         * @param {string} id Unique identifier of the object to add. If an object with the ID already exists, no action
         * is taken.
         * @param {Element} obj The object to insert to the widget.
         * @param {Object} pos Object representing the {x} and {y} coordinates of the point to add the object at. The
         * coordinates are used as the widget's internal (data) coordinates.
         * @param {Object} [options = {}] Options of inserting the object. Supported values:
         * <ul>
         *   <li><code>boolean</code>foreground: Whether to insert the object in the foreground of the widget (on top
         *   of widget elements). Default value is false.</li>
         * </ul>
         * @param {number} [duration = 0] Duration of the insert animation.
         * @returns {Widget} Reference to the Widget's API.
         */
        add: (id, obj, pos, options = {}, duration = 0) => {
          // Fetch scales.
          const scaleX = scales.x.scale
          const scaleY = scales.y.scale

          // Add object's own group.
          const g = _.getContainer(options.foreground ? 'foreground' : 'background').append('g')
            .attr('transform', `translate(${scaleX(pos.x)}, ${scaleY(pos.y)})`)
            .style('opacity', 0)

          // Add object to DOM,
          g.node().appendChild(obj)

          // Show object group.
          if (_.objects.has(id)) {
            // If object exists, first remove it.
            api.objects.remove(id, duration)
            g.transition().duration(duration)
              .style('opacity', 1)
          } else {
            g.transition().duration(duration)
              .style('opacity', 1)
          }

          // Build object.
          const object = {
            g,
            remove: duration => {
              g.transition().duration(duration)
                .style('opacity', 0)
                .on('end', () => {
                  g.remove()
                })
            },
            update: duration => {
              g.transition().duration(duration)
                .attr('transform', `translate(${scaleX(pos.x)}, ${scaleY(pos.y)})`)
            }
          }

          _.objects.set(id, object)
          return api
        },

        /**
         * Removes one or all objects from the widget.
         *
         * @method remove
         * @methodOf Objects
         * @param {(string | null)?} id Identifier of the object to remove. If not specified or null, all objects are
         * removed.
         * @param {number} [duration = 0] Duration of the removal animation.
         * @returns {Widget} Reference to the Widget's API.
         */
        remove: (id, duration = 0) => {
          // If id is not specified, remove all objects
          if (typeof id === 'undefined' || id === null) {
            _.objects.forEach(obj => obj.remove(duration))
            _.objects.clear()
          }

          if (_.objects.has(id)) {
            // Otherwise, remove pins if it exists
            _.objects.get(id).remove(duration)
            _.objects.delete(id)
          }

          return api
        }
      }
    })

    return { self, api }
  }
})()
