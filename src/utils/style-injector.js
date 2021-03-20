import { select } from 'd3'


/*
 * Hidden variables
 */

// Create container.
const container = select('head')
  .append('style')
  .attr('id', 'dalian-style-container')

// Styles.
const styles = []


/*
 * Methods
 */

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
    container.text(container.text() + entry)

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
    container.text(styles.map(d => d.entry).join(''))
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
export function injectClass(selector, styles) {
  injectStyle(selector, styles)
}

/**
 * Injects a new ID style to the page.
 *
 * @method injectId
 * @param {string} selector ID name.
 * @param {object} styles Style entries.
 */
export function injectId(selector, styles) {
  injectStyle(selector, styles, '#')
}

/**
 * Updates an existing ID style to the page.
 *
 * @method updateId
 * @param {string} selector ID name.
 * @param {object} styles New style entries.
 */
export function updateId(selector, styles) {
  updateStyle(selector, styles, '#')
}
