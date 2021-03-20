import { select } from 'd3'

// TODO Docstring.
export default (() => {
  const TAG = 'dalian-style-container'

  const _ = {
    // Styles added to the head.
    styles: []
  }

  // TODO Docstring.
  function getContainer () {
    if (typeof _.container === 'undefined') {
      _.container = select('head')
        .append('style')
        .attr('id', TAG)
    }
    return _.container
  }

  // TODO Docstring.
  function getMarker (type) {
    switch (type) {
      default:
      case 'class':
        return '.'
      case 'id':
        return '#'
    }
  }

  // TODO Docstring.
  function buildEntry (selector, styles) {
    const content = Object.entries(styles).map(([name, value]) => `${name}:${value}`).join(';')
    return `${selector}{${content}}`
  }

  // TODO Remove default values.
  // TODO Docstring.
  function addStyle (name, styles, type = 'class') {
    // Take action only if selector is not yet added.
    const selector = getMarker(type) + name
    if (typeof _.styles.find(d => d.selector === selector) === 'undefined') {
      // Build entry.
      const entry = buildEntry(selector, styles)

      // Inject style to head.
      const container = getContainer()
      container.text(container.text() + entry)

      // Add selector to recorded selectors.
      _.styles.push({
        selector,
        entry
      })
    }
  }

  // TODO Docstring.
  function updateStyle (name, styles, type) {
    // Find style.
    const selector = getMarker(type) + name
    const style = _.styles.find(d => d.selector === selector)
    if (typeof style !== 'undefined') {
      // Update entry.
      style.entry = buildEntry(selector, styles)

      // Replace entire style content.
      getContainer().text(_.styles.map(d => d.entry).join(''))
    }
  }

  const api = {}

  /* test-code */
  api.__test__ = {
    _reset () {
      _.container = undefined
      _.styles = []
      return api
    },
    addStyle,
    buildEntry,
    getContainer,
    getMarker,
    updateStyle,
    TAG
  }
  /* end-test-code */

  // TODO Docstring.
  api.addClass = (selector, styles) => {
    addStyle(selector, styles, 'class')
    return api
  }

  // TODO Docstring.
  api.updateClass = (selector, styles) => {
    updateStyle(selector, styles, 'class')
    return api
  }

  // TODO Docstring.
  api.addId = (selector, styles) => {
    addStyle(selector, styles, 'id')
    return api
  }

  // TODO Docstring.
  api.updateId = (selector, styles) => {
    updateStyle(selector, styles, 'id')
    return api
  }

  return api
})()
