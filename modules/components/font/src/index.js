import { extend } from '@dalian/core'

export default (self, api) => {
  // Protected members
  self = Object.assign(self || {}, {
    _font: {
      size: '12px',
      color: 'black'
    }
  })

  // Extend widget update
  self._widget.update = extend(self._widget.update, () => {
    self._widget.container
      .style('font-size', self._font.size)
      .style('color', self._font.color)
  }, true)

  // Public API
  api = Object.assign(api || {}, {
    fontSize: (size = 12) => {
      self._font.size = size + 'px'
      return api
    },

    fontColor: (color) => {
      self._font.color = color
      return api
    }
  })

  return { self, api }
}
