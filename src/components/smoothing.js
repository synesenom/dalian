import { curveMonotoneX, curveLinear } from 'd3'

/**
 * Component implementing the polygon smoothing feature.
 *
 * @class Smoothing
 * @param {Object} self Object containing the protected variables and methods.
 * @param {Object} api Object containing the public API methods.
 * @returns {{self: Object, api: Object}} Object containing the extended protected and public containers.
 */
export default (self, api) => {
  // Private members
  let _ = {
    on: false
  }

  // Protected members
  self = Object.assign(self || {}, {
    _smoothing: {
      /**
       * Returns the curve to use for drawing paths. The return value should be passed to d3's curve() method.
       *
       * @method curve
       * @methodOf Smoothing
       * @returns {Object} Object representing the path curve class to use.
       * @protected
       */
      curve: () => _.on ? curveMonotoneX : curveLinear
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Enables/disables the smooth property.
     *
     * @method smoothing
     * @methodOf Smoothing
     * @param {boolean} [on = false] Whether to enable polygon smoothing. If not specified, smoothing is disabled.
     * @returns {Object} Reference to the Smoothing API.
     */
    smoothing: (on = false) => {
      _.on = on
      return api
    }
  })

  return {self, api}
}
