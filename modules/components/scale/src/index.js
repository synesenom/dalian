import { scaleLinear, scaleBand, scalePoint } from 'd3-scale'

/**
 * Component implementing a scale.
 *
 * @class Scale
 * @param {string} [kind = linear] Kind of scale: linear, band or point.
 * @param {string} [type = linear] Type of scale: linear.
 */
export default (kind = 'linear', type = 'linear') => {
  let self = {
    kind,
    type
  }

  // Add domain
  switch (kind) {
    default:
    case 'linear':
      self.scale = scaleLinear()
      break
    case 'band':
      self.scale = scaleBand().padding(0.1)
      break
    case 'point':
      self.scale = scalePoint().padding(0.5)
  }

  let api = {
    scale: self.scale,
    range: (min, max) => {
      self.scale.range([min, max])
      return api
    },
    domain: values => {
      switch (self.kind) {
        default:
        case 'linear':
          self.scale.domain([Math.min(...values), Math.max(...values)])
          break
        case 'band':
        case 'point':
          self.scale.domain(values)
          break
      }
      return api
    }
  }

  return api
}
