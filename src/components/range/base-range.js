export default () => {
  // Private members
  let _ = {
    min: undefined,
    max: undefined
  }

  // Public API
  return {
    min: data => typeof _.min !== 'undefined' ? _.min : Math.min(...data),
    max: data => typeof _.max !== 'undefined' ? _.max : Math.max(...data),
    setMin: value => _.min = value,
    setMax: value => _.max = value
  }
}
