import { color } from 'd3'

function toSRgb(channel) {
  let c = channel / 255.
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export default function (rgb) {
  let col = color(rgb)
  return 0.2126 * toSRgb(col.r) + 0.7152 * toSRgb(col.g) + 0.0722 * toSRgb(col.b)
}
