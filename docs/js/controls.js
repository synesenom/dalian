const state = (func, variable, labels) => {
  const _func = func
  return () => {
    _func()
    if (typeof labels === 'string') {
      d3.select(`#${func.name}`)
        .text(labels)
    }
    if (Array.isArray(labels)) {
      d3.select(`#${func.name}`)
        .text(labels[this[variable]])
    }
  }
}
