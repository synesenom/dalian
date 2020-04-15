import encode from '../core/encode'
import attributes from '../utils/attributes'
import styles from '../utils/styles'

export default (self, api) => {
  // Private members.
  let _ = {
    markers: new Map()
  }

  self = Object.assign(self || {}, {
    _plotMarker: {
      add (x, y, id, name, size) {
        // Get or create marker.
        _.markers.set(id, _.markers.get(id) || self._chart.plots.append('circle'))

        // Set attributes.
        attributes(_.markers.get(id), {
          class: `plot-marker ${encode(name)}`,
          cx: x,
          cy: y,
          r: size || 4
        })

        // Set styles.
        styles(_.markers.get(id), {
          stroke: 'white',
          fill: self._colors.mapping(name),
          'pointer-events': 'none'
        })
      },

      remove (id) {
        if (typeof id === 'undefined') {
          _.markers.forEach((d, k) => {
            d.remove()
            _.markers.delete(k)
          })
        } else if (_.markers.has(id)) {
          _.markers.get(id).remove()
          _.markers.delete(id)
        }
      }
    }
  })

  return { self, api }
}
