function extractStyle (elem) {
  const computedStyle = window.getComputedStyle(elem)
  const css = {}
  for (let i = 0; i < computedStyle.length; i++) {
    css[computedStyle[i]] = computedStyle.getPropertyValue(computedStyle[i])
  }
  return css
}

function copyStyle (elem, styles) {
  for (const name in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, name)) {
      elem.style[name] = styles[name]
    }
  }
}

export default svg => {
  // Extract styles.
  const styles = Array.from(svg.querySelectorAll('*')).map(extractStyle)

  // Copy SVG DOM tree.
  const svgCopy = svg.cloneNode(true)

  // Copy SVG and children styles.
  copyStyle(svgCopy, extractStyle(svg))
  svgCopy.querySelectorAll('*')
    .forEach((elem, i) => copyStyle(elem, styles[i]))

  // Set background by parent's background or white.
  svgCopy.style.backgroundColor = svg.parentNode.style.backgroundColor || '#fff'

  return svgCopy
}
