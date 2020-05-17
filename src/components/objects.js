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
    let _ = {
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
            .attr('clip-path', `url(#${self._chart.clipId})`)
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
      objects: {
        // TODO Docs.
        add: (id, obj, pos, duration, type = 'background') => {
          // Check if element exists.
          if (_.objects.has(id)) {
            return api
          }

          // Fetch scales.
          let scaleX = scales.x.scale
          let scaleY = scales.y.scale

          // Add object's own group.
          const g = _.getContainer(type).append('g')
            .attr('transform', `translate(${scaleX(pos.x)}, ${scaleY(pos.y)})`)
            .style('opacity', 0)

          // Add object to DOM,
          g.node().appendChild(obj)

          // Show object group.
          g.transition().duration(duration)
            .style('opacity', 1)

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

        // TODO Docs.
        remove: (id, duration) => {
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
