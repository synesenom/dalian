export default (self, api) => {
  // Private members
  let _ = {
    yMin: undefined,
    yMax: undefined
  }

  // Protected members
  self = Object.assign(self || {}, {
    _yRange: {
      min: data => {
        let dataMin = Math.min(...data)
        return typeof _.yMin !== 'undefined' ? Math.min(_.yMin, dataMin) : dataMin
      },

      max: data => {
        let dataMax = Math.max(...data)
        return typeof _.yMax !== 'undefined' ? Math.max(_.yMax, dataMax) : dataMax
      }
    }
  })

  api = Object.assign(api, {
    /**
     * Sets the lower boundary for the plot if it is lower than the calculated lower boundary.
     *
     * @method yMin
     * @methodOf Widget
     * @param {number} value The lower boundary to set.
     * @returns {Widget} Reference to the YRange API.
     */
    yMin: value => {
      _.yMin = value
      return api
    },

    /**
     * Sets the upper boundary for the plot if it is greater than the calculated upper boundary.
     *
     * @method yMax
     * @methodOf Widget
     * @param {number} value The upper boundary to set.
     * @returns {Widget} Reference to the YRange API.
     */
    yMax: value => {
      _.yMax = value
      return api
    }
  })

  return { self, api }
}
