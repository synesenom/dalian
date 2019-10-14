import { encode } from '../../../core/src/index'

export default (self, api) => {
  self = Object.assign(self || {}, {
    _plotMarker: {
      markers: new Map(),
      paths: new Map()
    }
  })

  self._plotMarker.findY = (path, x) => {
    if (typeof path === 'undefined') {
      return
    }
    let pathLength = path.getTotalLength()
    let start = 0
    let end = pathLength
    let target = (start + end) / 2

    x = Math.max(x, path.getPointAtLength(0).x)
    x = Math.min(x, path.getPointAtLength(pathLength).x)

    while (target >= start && target <= pathLength) {
      let pos = path.getPointAtLength(target)

      if (Math.abs(pos.x - x) < 0.01) {
        return pos.y
      } else if (pos.x > x) {
        end = target
      } else {
        start = target
      }
      target = (start + end) / 2
    }
  }

  self._plotMarker.add = (paths, name, x) => {
    let y = self._plotMarker.findY(paths.get(name), x)
    if (typeof y === 'number') {
      let marker = self._plotMarker.markers.get(name)
      self._plotMarker.markers.set(name, marker || self._chart.plots.append('circle'))
      self._plotMarker.markers.get(name)
        .attr('class', `plot-marker ${encode(name)}`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .style('fill', self._colors.mapping(name))
        .style('pointer-events', 'none')
    }
  }

  self._plotMarker.remove = name => {
    self._plotMarker.markers.forEach((d, k) => {
      d.remove()
      self._plotMarker.markers.delete(k)
    })
  }

  return {self, api}
}
