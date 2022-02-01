/**
 * Component implementing the mouse features. When this component is available for a widget, its API is exposed via the
 * {.mouse} namespace.
 *
 * @function Mouse
 */
export default (self, api) => {
  // Private members.
  const _ = {
    callbacks: {}
  }

  // Protected members.
  self = Object.assign(self || {}, {
    _mouse: {
      // TODO Docstring.
      over: (...args) => {
        if (typeof _.callbacks.over === 'function') {
          _.callbacks.over(...args)
        }
      },

      // TODO Docstring.
      leave: (...args) => {
        if (typeof _.callbacks.leave === 'function') {
          _.callbacks.leave(...args)
        }
      },

      // TODO Docstring.
      click: (...args) => {
        if (typeof _.callbacks.click === 'function') {
          _.callbacks.click(...args)
        }
      },

      // TODO Docstring.
      isEnabled: type => typeof _.callbacks[type] === 'function',

      // TODO Docstring.
      hasAny: () => Object.values(_.callbacks).reduce((has, d) => has || typeof d === 'function', false)
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    mouse: {
      /**
       * Sets the callback for the over event.
       *
       * @method over
       * @memberOf Mouse
       * @param {Function} callback Function to call on over.
       * @returns {Widget} Reference to the Widget API.
       */
      over: callback => {
        _.callbacks.over = callback
        return api
      },

      /**
       * Sets the callback for the leave event.
       *
       * @method leave
       * @memberOf Mouse
       * @param {Function} callback Function to call on leave.
       * @returns {Widget} Reference to the Widget API.
       */
      leave: callback => {
        _.callbacks.leave = callback
        return api
      },

      /**
       * Sets the callback for the click event.
       *
       * @method click
       * @memberOf Mouse
       * @param {Function} callback Function to call on click.
       * @returns {Widget} Reference to the Widget API.
       */
      click: callback => {
        _.callbacks.click = callback
        return api
      }
    }
  })

  return { self, api }
}
