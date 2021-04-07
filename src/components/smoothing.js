import {curveMonotoneX, curveLinear, curveCardinalClosed, curveLinearClosed} from 'd3'

// Default values.
const DEFAULTS = {
  on: false
}

/**
 * Component implementing the polygon smoothing feature. This component allows for smoothing polygons in charts that
 * have elements made of polygons such as lines or areas. When this component is available, its API is exposed
 * directly via the widget's own namespace.
 *
 * @function Smoothing
 */
export default (self, api) => {
  // Private members.
  const _ = {
    on: DEFAULTS.on
  }

  // Protected members.
  self = Object.assign(self || {}, {
    _smoothing: {
      // TODO Docstring.
      open: () => _.on ? curveMonotoneX : curveLinear,

      // TODO Docstring.
      closed: () => _.on ? curveCardinalClosed : curveLinearClosed,

      // TODO Docstring.
      isOn: () => _.on
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Enables/disables the smooth property.
     *
     * @method smoothing
     * @memberOf Smoothing
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
