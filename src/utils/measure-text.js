const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

// TODO Docstring.
export function measureText (text, style) {
  context.font = style.fontSize + ' ' + style.fontFamily
  return {
    width: context.measureText(text).width,
    height: parseFloat(style.fontSize)
  }
}
