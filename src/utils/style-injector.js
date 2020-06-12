import { select } from 'd3'

export default (() => {
  const _ = {
    // Style container ID.
    id: 'dalian-style-container',

    // Style container.
    container: undefined,

    // Classes already added.
    classes: new Set()
  }

  function getContainer () {
    let container = _.container || select(`#${_.id}`)
    if (container.empty()) {
      _.container = select('head')
        .append('style')
        .attr('id', _.id)
    }
    return _.container
  }

  let api = {}

  api.addClass = (className, styles) => {
    // Take action only if selector is not yet added.
    if (!_.classes.has(className)) {
      // Build style entry.
      const content = Object.entries(styles).map(([name, value]) => `${name}:${value};`).join('')
      let entry = `.${className}{${content}}`

      // Inject style to head.
      const container = getContainer()
      container.text(container.text() + entry)

      // Add selector to recorded selectors.
      _.classes.add(className)
    }

    return api
  }

  return api
})()
