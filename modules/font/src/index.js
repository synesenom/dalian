export default (self, api) => {
  // Set default values
  self = self || {}
  self._font = {
    size: '14px',
    color: 'black'
  }

  // Public API
  api = api || {}
  api.fontSize = (size = 14) => {
    self._font.size = size + 'px'
    return api
  }

  api.fontColor = (color) => {
    self._font.color = color
    return api
  }

  return { self, api }
}
