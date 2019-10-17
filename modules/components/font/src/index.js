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
    /**
     * Sets the font size of the widget in pixels.
     *
     * @method fontSize
     * @methodOf Font
     * @param {number} size Size of the font in pixels.
     * @returns {Object} Reference to the Font API.
     */
    fontSize: (size = 12) => {
      self._font.size = size + 'px'
      return api
    },

    /**
     * Sets the font color of the widget.
     *
     * @method fontColor
     * @methodOf Font
     * @param {string} color Color to set as font color.
     * @returns {Object} Reference to the Font API.
     */
    fontColor: (color) => {
      self._font.color = color
      return api
    }
  })

  return { self, api }
}
