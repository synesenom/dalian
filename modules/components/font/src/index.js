import { extend } from '../../../core/src/index'

export default (self, api) => {
  // Set default values
  self = self || {}
  self._font = {
    size: '12px',
    color: 'black'
  }

  // Extend widget update
  const _updateFont = () => {
    self._widget.container
        .style('font-size', self._font.size)
        .style('color', self._font.color)
  }
  self._widget.update = extend(self._widget.update, _updateFont, true)

  // Public API
  api = api || {}
  api.fontSize = (size = 12) => {
    self._font.size = size + 'px'
    return api
  }

  api.fontColor = (color) => {
    self._font.color = color
    return api
  }

  return { self, api }
}
