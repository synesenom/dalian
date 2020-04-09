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
      min: base.min,
      max: base.max
    }
  })

  api = Object.assign(api || {}, {
    xRange: {
      /**
       * Sets the lower boundary for the X axis.
       *
       * @method min
       * @methodOf XRange
       * @param {number} value The lower boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        base.setMin(value)
        return api
      },

      /**
       * Sets the upper boundary for the X axis.
       *
       * @method max
       * @methodOf XRange
       * @param {number} value The upper boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: value => {
        base.setMax(value)
        return api
      }
    }
  })

  return { self, api }
}
