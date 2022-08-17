// TODO Docstring.
export default () => {
  // Private members.
  const _ = {
    min: undefined,
    max: undefined,
    compressMax: 0,
    compressMin: 0
  }

  // Public API.
  return {
    // TODO Docstring.
    min (value) {
      _.min = value
    },

    // TODO Docstring.
    max (value) {
      _.max = value
    },

    // TODO Docstring.
    compressMin (value) {
      _.compressMin = Math.abs(value || 0)
    },

    // TODO Docstring.
    compressMax (value) {
      _.compressMax = Math.abs(value || 0)
    },

    // TODO Docstring.
    range: data => {
      // Determine final boundaries.
      let min = typeof _.min !== 'undefined' ? _.min : Math.min(...data)
      let max = typeof _.max !== 'undefined' ? _.max : Math.max(...data)

      // Add stretch or buffer to range.
      const range = max - min
      min -= _.compressMin > 0 ? _.compressMin * range : 0
      max += _.compressMax > 0 ? _.compressMax * range : 0

      // Return range.
      return [min, max]
    },

    // TODO Docstring.
    contains: value => (typeof _.min === 'undefined' || value >= _.min) &&
      (typeof _.max === 'undefined' || value <= _.max)
  }
}
