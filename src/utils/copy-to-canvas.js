/*
 * Hidden variables
 */
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
const hidden = document.createElement('div')
const img = document.createElement('img')

/*
 * Methods
 */
/**
 * Retrieves the bounding client for an SVG element.
 *
 * @method getSvgBBox
 * @param {SVGElement} svg SVG element to get bounding box for.
 * @return {DOMRect} The bounding client rectangle.
 */
function getSvgBBox (svg) {
  hidden.style.opacty = 0
  hidden.appendChild(svg)
  document.body.appendChild(hidden)
  const bbox = svg.getBoundingClientRect()
  document.body.removeChild(hidden)
  return bbox
}

/*
 * Export
 */

/**
 * Copies the content of an SVG element to canvas and returns the string representation of the canvas image.
 *
 * @method copyToCanvas
 * @param {SVGElement} svg SVG element to copy content of.
 * @param {number} [scale = 3] Scaling to apply for the content during the copy.
 * @param {string} format Format of the canvas image.
 * @param {number} [quality = 0.92] Quality of the image.
 * @return {Promise<string>} Promise containing the canvas image as a string.
 * @async
 */
export default async (svg, scale = 3, format = 'png', quality = 0.92) => {
  // Get SVG data.
  const svgData = new window.XMLSerializer().serializeToString(svg)

  // Add hidden div to measure SVG size.
  const svgSize = getSvgBBox(svg)

  // Init canvas.
  canvas.width = svgSize.width * scale
  canvas.height = svgSize.height * scale
  canvas.style.width = svgSize.width + 'px'
  canvas.style.height = svgSize.height + 'px'

  // Scale context.
  context.scale(scale, scale)

  // Create image.
  img.setAttribute('src',
    'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgData))))
  return new Promise(resolve => {
    img.onload = () => {
      // Draw image on canvas.
      context.drawImage(img, 0, 0)

      // Resolve with data URl.
      resolve(canvas.toDataURL('image/' + format, quality))
    }
  })
}
