import { select } from 'd3'

const TAG = 'dalian-style-container'

export default (() => {
  const _ = {
    // Style container.
    container: undefined,

    // Styles added to the head.
    styles: [],
  }

  function getContainer () {
    let container = _.container || select(`#${TAG}`)
    if (container.empty()) {
      _.container = select('head')
        .append('style')
        .attr('id', TAG)
    }
    return _.container
  }

  function getMarker (type) {
    switch (type) {
      default:
      case 'class':
        return '.'
      case 'id':
        return '#'
    }
  }

  function buildEntry (selector, styles, type) {
    const content = Object.entries(styles).map(([name, value]) => `${name}:${value};`).join('')
    return `${getMarker(type)}${selector}{${content}}`
  }

  function addStyle (selector, styles, type = 'class') {
    // Take action only if selector is not yet added.
    if (typeof _.styles.find(d => d.selector === selector) === 'undefined') {
      // Build entry.
      const entry = buildEntry(selector, styles, type)

      // Inject style to head.
      const container = getContainer()
      container.text(container.text() + entry)

      // Add selector to recorded selectors.
      _.styles.push({selector, type, entry})
    }
  }

  function updateStyle (selector, styles, type) {
    // Find ir create style.
    let style = _.styles.find(d => d.selector === selector)
    if (typeof styles !== 'undefined') {
      // Update entry.
      style.entry = buildEntry(selector, styles, type)

      // Replace entire style content.
      getContainer().text(_.styles.map(d => d.entry).join(''))
    }
  }

  let api = {}

  api.addClass = (selector, styles) => {
    addStyle(selector, styles, 'class')
    return api
  }

  api.updateClass = (selector, styles) => {
    updateStyle(selector, styles, 'class')
    return api
  }

  api.addId = (selector, styles) => {
    addStyle(selector, styles, 'id')
    return api
  }

  api.updateId = (selector, styles) => {
    updateStyle(selector, styles, 'id')
    return api
  }

  return api
})()
