export default (() => {
  const _ = {}

  function getCanvas () {
    if (typeof _.canvas === 'undefined') {
      _.canvas = document.createElement('canvas')
    }
    return _.canvas
  }

  function getContext () {
    const canvas = getCanvas()
    if (typeof _.context === 'undefined') {
      _.context = canvas.getContext('2d')
    }
    return _.context
  }

  // Create canvas and context that we use to draw characters in.
  function resize (width, height) {
    const canvas = getCanvas()
    canvas.style.width = width + 'px'
    canvas.width = width
    canvas.style.height = height + 'px'
    canvas.height = height
  }

  function measureCharacter (char, fontFamily, fontSize) {
    const context = getContext()

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

  // Return font metrics method.
  return fontFamily => {
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
})()
