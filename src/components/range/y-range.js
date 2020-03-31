// TODO Merge with XRange to a BaseRange
// TODO Add documentation
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
        return typeof _.yMin !== 'undefined' ? _.yMin : dataMin
      },

      max: data => {
        let dataMax = Math.max(...data)
        return typeof _.yMax !== 'undefined' ? _.yMax : dataMax
      }
    }
  })

  api = Object.assign(api, {
    yRange: {
      /**
       * Sets the lower boundary for the plot.
       *
       * @method min
       * @methodOf YRange
       * @param {number} value The lower boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        _.yMin = value
        return api
      },

      /**
       * Sets the upper boundary for the plot.
       *
       * @method yMax
       * @methodOf YRange
       * @param {number} value The upper boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: value => {
        _.yMax = value
        return api
      }
    }
  })

  return { self, api }
}
