import encode from '../core/encode'
import attributes from '../utils/attributes'
import styles from '../utils/styles'
import extend from '../core/extend'

export default (self, api) => {
  // Private members.
  let _ = {
    markers: new Map()
  }

  self = Object.assign(self || {}, {
    _plotMarker: {
      add (x, y, id, point, size) {
        // Get or create marker.
        _.markers.set(id, _.markers.get(id) || self._chart.plots.append('circle'))

        // Set attributes.
        attributes(_.markers.get(id), {
          class: `plot-marker ${encode(point.name)}`,
          cx: x,
          cy: y,
          r: size || 4
        })

        // Set styles.
        styles(_.markers.get(id), {
          stroke: 'white',
          fill: self._color.mapper(point),
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

  // Remove markers when exiting widget.
  self._widget.update = extend(self._widget.update, () => {
    self._widget.container.on('mouseout.plot-marker', self._plotMarker.remove)
  })

  return { self, api }
}
