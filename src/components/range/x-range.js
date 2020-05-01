import BaseRange from './base-range'

/**
 * Component implementing the Y range constraints. This component enables setting the horizontal min/max boundaries for
 * a chart. When this component is available for a widget, its API is exposed via the {.xRange} namespace.
 *
 * @function XRange
 */
export default (self, api) => {
  let base = BaseRange()

  self = Object.assign(self || {}, {
    _xRange: {
      range: base.range,
      contains: base.contains
    }
  })

  api = Object.assign(api || {}, {
    xRange: {
      /**
       * Sets the lower boundary for the X axis.
       *
       * @method min
       * @methodOf XRange
       * @param {(number|null)} value The lower boundary to set. If null, the calculated lower boundary is used.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        base.min(value)
        return api
      },

      /**
       * Compresses the X axis by expanding the lower boundary of the X range with the specified fraction of the total
       * range.
       *
       * @method compressMin
       * @methodOf XRange
       * @param {number} [value = 0] Scaling factor to expand the lower boundary with.
       * @returns {Widget} Reference to the Widget's API.
       */
      compressMin: (value = 0) => {
        base.compressMin(value)
        return api
      },

      /**
       * Sets the upper boundary for the X axis.
       *
       * @method max
       * @methodOf XRange
       * @param {(number|null)} value The upper boundary to set. If null, the calculated upper boundary is used.
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
       * @methodOf XRange
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
