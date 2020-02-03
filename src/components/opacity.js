/**
 * Component implementing the opacity feature.
 *
 * @class Opacity
 * @param {Object} self Object containing the protected variables and methods.
 * @param {Object} api Object containing the public API methods.
 * @returns {{self: Object, api: Object}} Object containing the extended protected and public containers.
 */
export default (self, api) => {
  // Private members
  let _ = {
    value: 0.5
  }

  // Protected members
  self = Object.assign(self || {}, {
    _opacity: {
      /**
       * Returns the current opacity value.
       *
       * @method value
       * @methodOf Opacity
       * @returns {number} The current opacity value to use.
       * @protected
       */
      value: () => _.value
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the opacity value.
     *
     * @method opacity
     * @methodOf Opacity
     * @param {number} value The opacity value to set.
     * @returns {Object} Reference to the Opacity API.
     */
    opacity: value => {
      _.value = value
      return api
    }
  })

  return {self, api}
}
