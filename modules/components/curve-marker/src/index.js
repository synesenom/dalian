import { encode } from '../../../core/src/index'

export default (self, api) => {
  self = self || {}
  self._curveMarker = {
    markers: new Map(),
    paths: new Map()
  }

  self._curveMarker.findY = (path, x) => {
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

  self._curveMarker.add = (paths, name, x) => {
    let y = self._curveMarker.findY(paths.get(name), x)
    if (typeof y === 'number') {
      let marker = self._curveMarker.markers.get(name)
      self._curveMarker.markers.set(name, marker || self._chart.plots.append('circle'))
      self._curveMarker.markers.get(name)
        .attr('class', `tooltip-marker ${encode(name)}`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .style('fill', self._colors.mapping(name))
        .style('pointer-events', 'none')
    }
  }

  self._curveMarker.remove = name => {
    self._curveMarker.markers.forEach((d, k) => {
      d.remove()
      self._curveMarker.markers.delete(k)
    })
  }

  api = api || {}


  return {self, api}
}
