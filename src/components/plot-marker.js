import encode from '../core/encode'

export default (self, api) => {
  self = Object.assign(self || {}, {
    _plotMarker: {
      markers: new Map()
    }
  })

  self._plotMarker.add = (x, y, name) => {
    if (typeof x === 'number') {
      let marker = self._plotMarker.markers.get(name)
      self._plotMarker.markers.set(name, marker || self._chart.plots.append('circle'))
      self._plotMarker.markers.get(name)
        .attr('class', `plot-marker ${encode(name)}`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .style('stroke', 'white')
        .style('fill', self._colors.mapping(name))
        .style('pointer-events', 'none')
    }
  }

  self._plotMarker.remove = name => {
    if (typeof name === 'undefined') {
      self._plotMarker.markers.forEach((d, k) => {
        d.remove()
        self._plotMarker.markers.delete(k)
      })
    } else if (self._plotMarker.markers.has(name)) {
      self._plotMarker.markers.get(name).remove()
      self._plotMarker.markers.delete(name)
    }
  }

  return {self, api}
}
