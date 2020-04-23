const checkbox = (func, id, variable, labels) => {
  const _func = func
  return () => {
    _func()
    if (typeof labels !== 'undefined') {
      d3.select(`#${id}`).text((this[variable] ? labels[0] : labels[1]) + '.')
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
