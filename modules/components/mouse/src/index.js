/**
 * Factory implementing the component handling mouse interactions.
 *
 * @class Mouse
 * @param {Object} self Object containing the private members.
 * @param {Object} api Object containing the public methods.
 * @returns {{self: Object, api: Object}} Object representing the extension of the private and public methods.
 */
export default (self, api) => {
  // Private members
  let _ = {
    callbacks: {}
  }

  // Protected members
  self = Object.assign(self, {
    _mouse: {
      mouseover: (...args) => {
        if (typeof _.callbacks.over === 'function') {
          _.callbacks.over(...args)
        }
      },

      mouseleave: (...args) => {
        if (typeof _.callbacks.leave === 'function') {
          _.callbacks.leave(...args)
        }
      },

      click: (...args) => {
        if (typeof _.callbacks.click === 'function') {
          _.callbacks.click(...args)
        }
      },

      isEnabled: type => {
        return typeof _.callbacks[type] === 'function'
      }
    }
  })

  // Public API
  api = Object.assign(api, {
    /**
     * Sets the callback for the mouseover event.
     *
     * @method mouseover
     * @param {Function} callback Function to call on mouseover.
     * @returns {Object} Reference to the current API.
     */
    mouseover: callback => {
      _.callbacks.over = callback
      return api
    },

    /**
     * Sets the callback for the mouseleave event.
     *
     * @method mouseleave
     * @param {Function} callback Function to call on mouseleave.
     * @returns {Object} Reference to the current API.
     */
    mouseleave: callback => {
      _.callbacks.leave = callback
      return api
    },

    /**
     * Sets the callback for the click event.
     *
     * @method click
     * @param {Function} callback Function to call on click.
     * @returns {Object} Reference to the current API.
     */
    click: callback => {
      _.callbacks.click = callback
      return api
    }
  })

  return { self, api }
}
