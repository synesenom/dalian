import { select } from 'd3'

/*
 * Hidden variables
 */

// Create container.
let container

// Styles.
const styles = []

/*
 * Methods
 */

/**
 * Gets or creates the container.
 *
 * @method getContainer
 * @return {object} D3 selection of the container.
 */
function getContainer () {
  if (typeof container === 'undefined') {
    container = select('head')
      .append('style')
      .attr('id', 'dalian-style-container')
  }
  return container
}

/**
 * Builds a style entry.
 *
 * @method buildEntry
 * @param {string} selector Style query selector.
 * @param {object} styles Styles to add to the selector.
 * @return {string} The prepared style entry.
 */
function buildEntry (selector, styles) {
  const content = Object.entries(styles)
    .map(([name, value]) => `${name}:${value}`)
    .join(';')
  return `${selector}{${content}}`
}

/**
 * Injects a new style to the page.
 *
 * @method injectClass
 * @param {string} queryName Name of the selector.
 * @param {object} styleSheet Style sheet.
 * @param {string} marker Selector marker (. for class, # for ID).
 */
function injectStyle (queryName, styleSheet, marker = '.') {
  // Take action only if selector is not yet added.
  const selector = marker + queryName
  if (typeof styles.find(d => d.selector === selector) === 'undefined') {
    // Build entry.
    const entry = buildEntry(selector, styleSheet)

    // Inject style to head.
    const cont = getContainer()
    cont.text(cont.text() + entry)

    // Add selector to recorded selectors.
    styles.push({
      selector,
      entry
    })
  }
}

/**
 * Updates a style entry.
 *
 * @method updateStyle
 * @param {string} queryName Name of the selector.
 * @param {object} styleSheet Style sheet.
 * @param {string} marker Selector marker (. for class, # for ID).
 */
function updateStyle (queryName, styleSheet, marker) {
  // Find style.
  const selector = marker + queryName
  const style = styles.find(d => d.selector === selector)
  if (typeof style !== 'undefined') {
    // Update entry.
    style.entry = buildEntry(selector, styleSheet)

    // Replace entire style content.
    getContainer().text(styles.map(d => d.entry).join(''))
  }
}

/*
 * Exports
 */

/**
 * Injects a new class style to the page.
 *
 * @method injectClass
 * @param {string} selector Class name.
 * @param {object} styles Style entries.
 */
export function injectClass (selector, styles) {
  injectStyle(selector, styles)
}

/**
 * Injects a new ID style to the page.
 *
 * @method injectId
 * @param {string} selector ID name.
 * @param {object} styles Style entries.
 */
export function injectId (selector, styles) {
  injectStyle(selector, styles, '#')
}

/**
 * Updates an existing ID style to the page.
 *
 * @method updateId
 * @param {string} selector ID name.
 * @param {object} styles New style entries.
 */
export function updateId (selector, styles) {
  updateStyle(selector, styles, '#')
}
