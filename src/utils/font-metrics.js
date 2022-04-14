import Dom from './dom'

const dom = Dom().add('canvas')

/**
 * Resizes canvas.
 *
 * @method resize
 * @param {number} width New canvas width.
 * @param {number} height New canvas height.
 */
function resize (width, height) {
  const canvas = dom.canvas()

  canvas.style.width = width + 'px'
  canvas.width = width
  canvas.style.height = height + 'px'
  canvas.height = height
}

/**
 * Measures the metrics of a single character in pixels.
 *
 * @method measureCharacter
 * @param {string} char Character to measure.
 * @param {string} fontFamily Font family.
 * @param {number} fontSize Font size in pixels.
 * @return {object} Object containing the min/max heights of the character relative to the baseline.
 */
function measureCharacter (char, fontFamily, fontSize) {
  const context = dom.canvas().getContext('2d')

  // Get character width first.
  const charWidth = context.measureText(char).width
  const charHeight = fontSize

  // Calculate container size.
  const padding = 100
  const width = 2 * padding + charWidth
  const height = 2 * padding + charHeight

  // Resize canvas and set fonts.
  resize(width, height)
  context.font = fontSize + 'px ' + fontFamily

  // Clear canvas.
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)

  // Draw text.
  context.fillStyle = '#000'
  context.fillText(char, padding, padding + charHeight)

  // Measure top and bottom.
  const pixelData = context.getImageData(0, 0, width, height).data
    .filter((d, i) => i % 4 === 0)
  const min = Math.floor(pixelData.findIndex(d => d < 255) / width)
  pixelData.reverse()
  const max = height - Math.floor(pixelData.findIndex(d => d < 255) / width)
  return { min, max }
}

/*
 * Export
 */

/**
 * Calculates the font metrics for a font family relative to the font size (em).
 *
 * @method fontMetrics
 * @param {string} fontFamily Font family to measure metrics for.
 * @return {object} Object containing thexHeight, capHeight, descender and ascender values.
 */
// TODO Calculate only if family or size has changed.
export default function (fontFamily) {
  // Set font size to some large enough value.
  const fontSize = 100

  // Measure characters.
  const x = measureCharacter('x', fontFamily, fontSize)
  const y = measureCharacter('y', fontFamily, fontSize)
  const h = measureCharacter('h', fontFamily, fontSize)
  const H = measureCharacter('H', fontFamily, fontSize)

  // Calculate metrics.
  const xHeight = x.max - x.min

  return {
    xHeight: xHeight / fontSize,
    capHeight: (H.max - H.min) / fontSize,
    descender: (y.max - y.min - xHeight) / fontSize,
    ascender: (h.max - h.min) / fontSize
  }
}
