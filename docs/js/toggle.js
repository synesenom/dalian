function getLabel(method, arg) {
  switch (typeof arg) {
    default:
      if (Array.isArray(arg)) {
        switch (typeof arg[0]) {
          case 'string':
            return `.${method}(${arg ? `[${arg.map(d => `'${d}'`).join(', ')}]` : ''})`
          case 'number':
            return `.${method}([${arg.join(', ')}])`
        }
      }
      return `.${method}(${arg})`
    case 'undefined':
      return `.${method}()`
    case 'string':
      if (arg.startsWith('chart')) {
        return `.${method}(${arg})`
      }
      return `.${method}('${arg}')`
    case 'object':
      return `.${method}(${JSON.stringify(arg).replaceAll(',', ', ').replaceAll(':', ': ')})`
  }
}

function getElem(id) {
  // Grab element.
  const el = document.getElementById(`toggle-${id}`)

  // Add pre tag.
  const pre = document.createElement('pre')
  el.appendChild(pre)

  // Add code tag.
  const code = document.createElement('code')
  code.classList.add('javascript', 'hljs')
  pre.appendChild(code)

  // Return code tag.
  return code
}

function getMethod (chart, path) {
  let ret = chart
  path.split('.').forEach(key => {
    ret = ret[key]
  })
  return ret
}

function Controls (chart) {
  const api = {}

  api.data = generator => {
    // Init.
    const el = document.getElementById('toggle-data')
    el.innerHTML = `.data(${generator.name}())`

    // Event listener.
    el.addEventListener('click', () => {
      chart.data(generator()).render(1000)
    })

    return api
  }

  api.toggle = (method, states, options = {}) => {
    // Init.
    let i = 0
    const el = getElem(method)
    el.innerHTML = getLabel(method, states[0])

    // Event listener.
    el.addEventListener('click', () => {
      i = (i + 1) % states.length
      const state = states[i]
      el.innerHTML = getLabel(method, state)
      getMethod(chart, method)(state).render(typeof options.duration === 'number' ? options.duration : 1000)
      hljs.highlightBlock(el)

      // Callback.
      if (typeof options.callback === 'function') {
        options.callback(state)
      }
    })
    return api
  }

  return api;
}
