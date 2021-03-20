// Re-usable elements.
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
const hidden = document.createElement('div')
hidden.style.opacty = 0
const img = document.createElement('img')

// TODO Docstring.
function getSvgBBox (svg) {
  hidden.appendChild(svg)
  document.body.appendChild(hidden)
  const bbox = svg.getBoundingClientRect()
  document.body.removeChild(hidden)
  return bbox
}

// TODO Docstring.
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
