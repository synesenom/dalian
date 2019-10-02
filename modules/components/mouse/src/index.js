/**
 * Factory implementing the component handling mouse interactions.
 *
 * @class Mouse
 * @param {Object} self Object containing the private members.
 * @param {Object} api Object containing the public methods.
 * @returns {{self: Object, api: Object}} Object representing the extension of the private and public methods.
 */
export default (self, api) => {
  // Set default values
  self = self || {}
  self._mouse = {
    callbacks: {}
  }

  // Protected methods
  self._mouse.mouseover = (...args) => {
    if (typeof self._mouse.callbacks.over !== 'undefined') {
      self._mouse.callbacks.over(...args)
    }
  }

  self._mouse.mouseleave = (...args) => {
    if (typeof self._mouse.callbacks.leave !== 'undefined') {
      self._mouse.callbacks.leave(...args)
    }
  }

  self._mouse.click = (...args) => {
    if (typeof self._mouse.callbacks.click !== 'undefined') {
      self._mouse.callbacks.click(...args)
    }
  }

  // Public API
  api = api || {}

  /**
   * Sets the callback for the mouseover event.
   *
   * @method mouseover
   * @param {Function} callback Function to call on mouseover.
   * @returns {Object} Reference to the current API.
   */
  api.mouseover = callback => {
    self._mouse.callbacks.over = callback
    return api
  }

  /**
   * Sets the callback for the mouseleave event.
   *
   * @method mouseleave
   * @param {Function} callback Function to call on mouseleave.
   * @returns {Object} Reference to the current API.
   */
  api.mouseleave = callback => {
    self._mouse.callbacks.leave = callback
    return api
  }

  /**
   * Sets the callback for the click event.
   *
   * @method click
   * @param {Function} callback Function to call on click.
   * @returns {Object} Reference to the current API.
   */
  api.click = callback => {
    self._mouse.callbacks.click = callback
    return api
  }

  return { self, api }
}
