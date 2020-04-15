import extend from '../core/extend'

/**
 * Component implementing the font features. When this component is available for a widget, its API is exposed via the
 * {.font} namespace.
 *
 * @function Font
 */
export default (self, api) => {
  // Private members
  let _ = {
    defaults: {
      size: 12,
      color: 'black'
    }
  }

  // Protected members
  self = Object.assign(self || {}, {
    _font: {
      size: _.defaults.size + 'px',
      color: _.defaults.color
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
    font: {
      /**
       * Sets the font size of the widget in pixels. Default size is 12px.
       *
       * @method size
       * @methodOf Font
       * @param {number} size Size of the font in pixels.
       * @returns {Widget} Reference to the Widget API.
       */
      size: size => {
        self._font.size = (size || _.defaults.size) + 'px'
        return api
      },

      /**
       * Sets the font color of the widget. Default color is black.
       *
       * @method color
       * @methodOf Font
       * @param {string} color Color to set as font color.
       * @returns {Widget} Reference to the Widget API.
       */
      color: (color) => {
        self._font.color = color || _.defaults.color
        return api
      }
    }
  })

  return { self, api }
}
