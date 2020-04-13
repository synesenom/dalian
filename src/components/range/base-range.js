export default () => {
  // Private members
  let _ = {
    min: null,
    max: null,
    scaleMax: 0,
    scaleMin: 0
  }

  // Public API
  return {
    min: value => _.min = value,

    max: value => _.max = value,

    expandMin: value => _.scaleMin = Math.abs(value || 0),

    expandMax: value => _.scaleMax = Math.abs(value || 0),

    range: data => {
      // Determine final boundaries.
      let min = typeof _.min !== 'undefined' && _.min !== null ? _.min : Math.min(...data)
      let max = typeof _.max !== 'undefined' && _.max !== null ? _.max : Math.max(...data)

      // Add stretch or buffer to range.
      let range = max - min
      min -= _.scaleMin > 0 ? _.scaleMin * range : 0
      max += _.scaleMax > 0 ? _.scaleMax * range : 0

      // Return range.
      return [min, max]
    },

    contains: value => (typeof _.min === 'undefined' || _.min === null || value >= _.min)
      && (typeof _.max === 'undefined' || _.max === null || value <= _.max)
  }
}
