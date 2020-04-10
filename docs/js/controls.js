const toggle = (func, id, variable, labels) => {
  const _func = func
  return () => {
    _func()
    d3.select(`#${id} .desc-button`).classed('on', this[variable])
    d3.select(`#${id} .desc-button-label`).text('- ' + (this[variable] ? labels[0] : labels[1]) + '.')
  }
}
