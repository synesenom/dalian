import encode from '../core/encode'

export default (self, api) => {
  self = Object.assign(self || {}, {
    _plotMarker: {
      markers: new Map()
    }
  })

  self._plotMarker.add = (x, y, id, name, size) => {
    let marker = self._plotMarker.markers.get(id)
    self._plotMarker.markers.set(id, marker || self._chart.plots.append('circle'))
    self._plotMarker.markers.get(id)
      .attr('class', `plot-marker ${encode(name)}`)
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', size || 4)
      .style('stroke', 'white')
      .style('fill', self._colors.mapping(name))
      .style('pointer-events', 'none')
  }

  self._plotMarker.remove = id => {
    if (typeof id === 'undefined') {
      self._plotMarker.markers.forEach((d, k) => {
        d.remove()
        self._plotMarker.markers.delete(k)
      })
    } else if (self._plotMarker.markers.has(id)) {
      self._plotMarker.markers.get(id).remove()
      self._plotMarker.markers.delete(id)
    }
  }

  return {self, api}
}
