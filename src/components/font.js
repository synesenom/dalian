import extend from '../core/extend'

// Default values.
const DEFAULTS = {
  size: 12,
  color: 'black'
}

/**
 * Component implementing the font features. When this component is available for a widget, its API is exposed via the
 * {.font} namespace.
 *
 * @function Font
 */
export default (self, api) => {
  // Protected members.
  self = Object.assign(self || {}, {
    _font: {
      size: DEFAULTS.size + 'px',
      color: DEFAULTS.color
    }
  })

  // Extend widget update.
  self._widget.update = extend(self._widget.update, () => {
    self._widget.container
      .style('font-size', self._font.size)
      .style('color', self._font.color)
  }, true)

  // Public API
  api = Object.assign(api || {}, {
    font: {
      /**
       * Sets the font size of the widget in pixels. Default size is 12px.
       *
       * @method size
       * @memberOf Font
       * @param {number} [size = 12] Size of the font in pixels.
       * @returns {Widget} Reference to the Widget API.
       */
      size: (size = DEFAULTS.size) => {
        self._font.size = size + 'px'
        return api
      },

      /**
       * Sets the font color of the widget. Default color is black.
       *
       * @method color
       * @memberOf Font
       * @param {string} [color = black] Color to set as font color.
       * @returns {Widget} Reference to the Widget API.
       */
      color: (color = DEFAULTS.color) => {
        self._font.color = color
        return api
      }
    }
  })

  return { self, api }
}
