const canvas = document.createElement('canvas')
canvas.style.fontFamily = 'inherit'
const context = canvas.getContext('2d')


export function getTextWidth(text, font) {
  context.font = font.size + ' ' + font.family
  return context.measureText(text).width
}
