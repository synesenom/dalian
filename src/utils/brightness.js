import { color } from 'd3'

export default rgb => {
  let c = color(rgb)
  return 0.229 * c.r + 0.587 * c.g + 0.114 * c.b
}
