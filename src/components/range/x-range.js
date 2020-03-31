export default (self, api) => {
  // Private members
  let _ = {
    xMin: undefined,
    xMax: undefined
  }

  // Protected members
  self = Object.assign(self || {}, {
    _xRange: {
      min: data => {
        let dataMin = Math.min(...data)
        return typeof _.xMin !== 'undefined' ? _.xMin : dataMin
      },

      max: data => {
        let dataMax = Math.max(...data)
        return typeof _.xMax !== 'undefined' ? _.xMax : dataMax
      }
    }
  })

  api = Object.assign(api, {
    xRange: {
      /**
       * Sets the lower boundary for the plot.
       *
       * @method xMin
       * @methodOf XRange
       * @param {number} value The lower boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      min: value => {
        _.xMin = value
        return api
      },

      /**
       * Sets the upper boundary for the plot.
       *
       * @method xMax
       * @methodOf XRange
       * @param {number} value The upper boundary to set.
       * @returns {Widget} Reference to the Widget's API.
       */
      max: value => {
        _.xMax = value
        return api
      }
    }
  })

  return { self, api }
}
