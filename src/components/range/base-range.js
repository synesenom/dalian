export default () => {
  // Private members
  let _ = {
    min: undefined,
    max: undefined
  }

  // Public API
  return {
    min: value => _.min = value,
    max: value => _.max = value,
    range: data => [
      typeof _.min !== 'undefined' ? _.min : Math.min(...data),
      typeof _.max !== 'undefined' ? _.max : 1.01 * Math.max(...data)
    ],
    contains: value => (typeof _.min === 'undefined' || value >= _.min)
      && (typeof _.max === 'undefined' || value <= _.max)
  }
}
