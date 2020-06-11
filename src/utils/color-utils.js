import {color, hsl} from 'd3'

export function lighter(col, factor = 0.4) {
  const c = hsl(col)
  c.l += factor * (1 - c.l)
  return c
}

export function brightness (rgb) {
  const c = color(rgb)
  return 0.229 * c.r + 0.587 * c.g + 0.114 * c.b
}

export function backgroundAdjustedColor (color) {
  return brightness(color) > 150 ? '#000' : '#fff'
}
