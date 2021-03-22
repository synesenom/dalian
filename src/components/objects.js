import extend from '../core/extend'
import { select } from 'd3'

/**
 * Component implementing the objects feature. This feature allows for inserting various SVG elements to the background
 * of a chart. When this component is available for a widget, its API is exposed via the {.objects} namespace.
 *
 * @function Objects
 */
export default scales => (() => {
  return (self, api) => {
    // Private members.
    const _ = {
      // Variables.
      containers: {},
      objects: new Map(),

      // Methods.
      // TODO Docstring.
      getContainer (type = 'outside') {
        if (typeof _.containers[type] === 'undefined') {
          // Add container.
          if (type === 'outside') {
            _.containers[type] = self._widget.content.append('g')
              .attr('class', 'objects-container')
          } else {
            _.containers[type] = self._chart.plots.append('g')
              .attr('class', 'objects-container')
          }

          // Move relevant containers on top.
          if (type === 'background') {
            _.containers[type].lower()
          } else {
            _.containers[type].raise()
          }
        }

        return _.containers[type]
      }
    }

    // Extend widget update.
    self._widget.update = extend(self._widget.update, duration => {
      _.objects.forEach(obj => obj.update(duration))
    })

    // Public methods.
    api = Object.assign(api || {}, {
      objects: {
        /**
         * Adds an SVG element to the widget using internal (data level) or widget coordinates.
         *
         * @param {string} id Unique identifier of the object to add. If an object with the ID already exists, no action
         * is taken.
         * @param {Element} obj The SVG HTML element to insert to the widget.
         * @param {Object} pos Object representing the {x} and {y} coordinates of the point to add the object at. The
         * coordinates are used as the widget's internal (data) coordinates.
         * @param {Object} options Options of inserting the object. Supported
         * values:
         * <ul>
         *   <li><code>boolean</code>layer: Where to insert the object: {background} of the plot area, {foreground} of the plot area or {outside}. In case of foreground or background, the object is clipped by the plot region. Default value is outside.</li>
         *   <li><code>boolean</code>floating: Whether to insert a floating object (position is used as data coordinates
         *   and the object position is updated when data changes) or fixed (position is used as coordinates relative to
         *   the widget's top left corner and does not change when data is updated). Set it to true if you want to
         *   insert objects using data coordinates and want them to follow the changes in data, otherwise leave it
         *   unset. Default sis false.</li>
         * </ul>
         * @param {number} [duration = 0] Duration of the insert animation.
         * @returns {Widget} Reference to the Widget's API.
         */
        add (id, obj, pos, options, duration = 0) {
          // Fetch scales.
          const scaleX = scales.x.scale
          const scaleY = scales.y.scale

          // Add object's own group.
          const g = _.getContainer(options && options.layer).append('g')
            .attr('transform', options && options.floating
              ? `translate(${scaleX(pos.x)}, ${scaleY(pos.y)})`
              : `translate(${pos.x}, ${pos.y})`)
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
                .attr('transform', options && options.floating
                  ? `translate(${scaleX(pos.x)}, ${scaleY(pos.y)})`
                  : `translate(${pos.x}, ${pos.y})`)
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
        remove (id, duration = 0) {
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
        },

        /**
         * Returns a D3 selection to an invisible SVG that can be used to draw an object to add. Useful if you want to use D3's simple chainable API to create objects to add.
         *
         * @method svg
         * @methodOf Objects
         * @return {Selection} D3 selection to the Objects API SVG.
         */
        svg () {
          // Create object SVG if not yet created.
          if (typeof _.svg === 'undefined') {
            _.svg = select('body').append('svg')
              .style('display', 'none')
              .style('opacity', 0)
              .style('position', 'fixed')
          }
          return _.svg
        }
      }
    })

    return { self, api }
  }
})()
