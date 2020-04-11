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
       * @param {(number|null)} value The lower boundary to set. If null, the plot's own lower boundary is used.
       * @param {number} [stretch = 0] Scaling factor to stretch the lower boundary with. If not zero, the lower boundary is
       * expanded with the specified fraction of the entire X domain of the real plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: (value, stretch) => {
        base.min(value, stretch)
        return api
      },

      /**
       * Sets the upper boundary for the X axis.
       *
       * @method max
       * @methodOf XRange
       * @param {(number|null)} value The upper boundary to set. If null, the plot's own upper boundary is used.
       * @param {number} [stretch = 0] Scaling factor to stretch the upper boundary with. If not zero, the upper boundary is
       * expanded with the specified fraction of the entire X domain of the real plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: (value, stretch) => {
        base.max(value, stretch)
        return api
      }
    }
  })

  return { self, api }
}
