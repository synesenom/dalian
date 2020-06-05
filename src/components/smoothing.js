import { curveMonotoneX, curveLinear } from 'd3'

/**
 * Component implementing the polygon smoothing feature. This component allows for smoothing polygons in charts that
 * have elements made of polygons such as lines or areas. When this component is available, its API is exposed
 * directly via the widget's own namespace.
 *
 * @function Smoothing
 */
export default (self, api) => {
  // Default values.
  const DEFAULTS = {
    on: false
  }

  // Private members
  const _ = {
    on: DEFAULTS.on
  }

  // Protected members
  self = Object.assign(self || {}, {
    _smoothing: {
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
     * @param {boolean} [on = false] Whether to enable polygon smoothing.
     * @returns {Widget} Reference to the Widget's API.
     */
    smoothing: (on = DEFAULTS.on) => {
      _.on = on
      return api
    }
  })

  return { self, api }
}
