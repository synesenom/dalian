import BaseRange from './base-range'

/**
 * Component implementing the Y range constraints. This component enables setting the vertical min/max boundaries for a
 * chart. When this component is available for a widget, its API is exposed via the {.yRange} namespace.
 *
 * @function YRange
 */
export default (self, api) => {
  let base = BaseRange()

  self = Object.assign(self || {}, {
    _yRange: {
      range: base.range,
      contains: base.contains
    }
  })

  api = Object.assign(api || {}, {
    yRange: {
      /**
       * Sets the lower boundary for the Y axis.
       *
       * @method min
       * @memberOf YRange
       * @param {number?} value The lower boundary to set. If not specified, the calculated lower boundary is used.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        base.min(value)
        return api
      },

      /**
       * Compresses the Y axis by expanding the lower boundary of the Y range with the specified fraction of the total
       * range.
       *
       * @method compressMin
       * @memberOf YRange
       * @param {number} [value = 0] Scaling factor to expand the lower boundary with.
       * @returns {Widget} Reference to the Widget's API.
       */
      compressMin: (value = 0) => {
        base.compressMin(value)
        return api
      },

      /**
       * Sets the upper boundary for the Y axis.
       *
       * @method max
       * @memberOf YRange
       * @param {number?} value The upper boundary to set. If not set, the calculated upper boundary is used.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: value => {
        base.max(value)
        return api
      },

      /**
       * Compresses the X axis by expanding the upper boundary of the X range with the specified fraction of the total
       * range.
       *
       * @method compressMax
       * @memberOf YRange
       * @param {number} [value = 0] Scaling factor to expand the upper boundary with.
       * @returns {Widget} Reference to the Widget's API.
       */
      compressMax: (value = 0) => {
        base.compressMax(value)
        return api
      },
    }
  })

  return { self, api }
}
