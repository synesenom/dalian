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
       * @methodOf YRange
       * @param {(number|null)} value The lower boundary to set. If null, the plot's own lower boundary is used.
       * @param {number} [stretch = 0] Scaling factor to stretch the lower boundary with. If not zero, the lower boundary is
       * expanded with the specified fraction of the entire Y domain of the real plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: (value, stretch) => {
        base.min(value, stretch)
        return api
      },

      /**
       * Sets the upper boundary for the Y axis.
       *
       * @method max
       * @methodOf YRange
       * @param {(number|null)} value The upper boundary to set. If null, the plot's own upper boundary is used.
       * @param {number} [stretch = 0] Scaling factor to stretch the upper boundary with. If not zero, the upper boundary is
       * expanded with the specified fraction of the entire Y domain of the real plot area.
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
