import encode from '../core/encode'
import attributes from '../utils/attributes'
import styles from '../utils/styles'
import extend from '../core/extend'

// TODO Docstring
// TODO Example
export default (self, api) => {
  // Private members.
  const _ = {
    line: undefined,
    markers: new Map()
  }

  // Protected members.
  self = Object.assign(self || {}, {
    _plotMarker: {
      // TODO Docstring.
      add (x, y, id, point, size) {
        if (typeof _.line === 'undefined') {
          _.line = self._chart.plots.append('line')
        }
        attributes(_.line, {
          x1: x,
          y1: 0,
          x2: x,
          y2: self._widget.size.innerHeight,
          stroke: self._font.color,
          'stroke-width': 1,
          'stroke-dasharray': '4 4',
          opacity: 0.5
        })
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

      // TODO Docstring.
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
