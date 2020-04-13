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
       * is extended with the specified fraction of the entire Y range of the real plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        base.min(value)
        return api
      },

      /**
       * Sets an expansion to the lower boundary. This method expands the Y range to the lower boundary with the
       * specified of the total range. Default value
       *
       * @method expandMin
       * @methodOf XRange
       * @param {number} [value = 0] Scaling factor to expand the lower boundary with. If not zero, the lower boundary
       * is extended with the specified fraction of the entire Y range of the current plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      expandMin: value => {
        base.expandMin(value)
        return api
      },

      /**
       * Sets the upper boundary for the Y axis.
       *
       * @method max
       * @methodOf YRange
       * @param {(number|null)} value The upper boundary to set. If null, the plot's own upper boundary is used.
       * is extended with the specified fraction of the entire Y range of the real plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: value => {
        base.max(value)
        return api
      },

      /**
       * Sets an expansion to the lower boundary. This method expands the Y range to the upper boundary with the
       * specified of the total range. Default value
       *
       * @method expandMax
       * @methodOf XRange
       * @param {number} [value = 0] Scaling factor to expand the upper boundary with. If not zero, the upper boundary
       * is extended with the specified fraction of the entire Y range of the current plot area.
       * @returns {Widget} Reference to the Widget's API.
       */
      expandMax: value => {
        base.expandMax(value)
        return api
      },
    }
  })

  return { self, api }
}
