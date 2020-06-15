const checkbox = (func, variable, labels) => {
  const _func = func
  return () => {
    _func()
    if (typeof labels !== 'undefined') {
      d3.select(`#${func.name}`).text(variable.toUpperCase() + ' - ' + (this[variable] ? labels[0] : labels[1]) + '.')
    }
  }
}

const radio = (id, buttons) => {
  const radios = d3.selectAll(`#${id} .button`)
    .data(buttons)
  return buttons.map(btn => {
    const _func = btn
    return () => {
      _func()
      radios.classed('on', d => d === btn)
    }
  })
}

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
