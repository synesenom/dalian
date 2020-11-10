import { color, hsl } from 'd3'

/**
 * Returns a lighter version of a color.
 *
 * @method lighter
 * @param {string} col String representing the color to lighten.
 * @param {number} factor Factor of lightening.
 * @return {Object} D3 color object representing the lightened color.
 */
export function lighter (col, factor = 0.4) {
  const c = hsl(col)
  c.l += factor * (1 - c.l)
  return c
}

/**
 * Returns the brightness value for a color.
 * Source: https://www.w3.org/TR/AERT/#color-contrast
 *
 * @method brightness
 * @param {string} col String representing the color.
 * @return {number} The perceived brightness.
 */
export function brightness (col) {
  const c = color(col)
  return 0.229 * c.r + 0.587 * c.g + 0.114 * c.b
}

/**
 * Returns black or white depending on the background color
 * s brightness.
 *
 * @method backgroundAdjustedColor
 * @param {string} col String representing the background color.
 * @return {string} Hex color representing black or white depending on the background brightness.
 */
export function backgroundAdjustedColor (col) {
  return brightness(col) > 150 ? '#000' : '#fff'
}
