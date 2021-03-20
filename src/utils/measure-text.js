const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

/**
 * Measures the width and height of some text in pixels.
 *
 * @method measureText
 * @param {string} text Text to measure.
 * @param {object} style Object representing the font style.
 * @return {object} Object representing the text with/height in pixels.
 */
export function measureText (text, style) {
  context.font = style.fontSize + ' ' + style.fontFamily
  return {
    width: context.measureText(text).width,
    height: parseFloat(style.fontSize)
  }
}
