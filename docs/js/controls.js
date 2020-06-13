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
    if (typeof labels !== 'undefined') {
      // Update label.
      d3.select(`#${func.name}`)
        .interrupt()
        .text(variable.toUpperCase() + ' - ' + labels[this[variable]] + '.')
        .style('color', 'royalblue')
        .transition().duration(2000)
        .style('color', null)
    }
  }
}
