import { scaleLinear, scaleBand, scalePoint } from 'd3'

/**
 * Component implementing a scale.
 *
 * @class Scale
 * @param {string} [kind = linear] Kind of scale: linear, band or point.
 * @param {string} [type = linear] Type of scale: linear.
 */
export default (kind = 'linear', type = 'linear') => {
  // Private members
  let _ = {
    kind,
    type,
    scale: (() => {
      switch (kind) {
        default:
        case 'linear':
          return scaleLinear()
        case 'band':
          return scaleBand().padding(0.1)
        case 'point':
          return scalePoint().padding(0.5)
      }
    })()
  }

  let api = {
    scale: _.scale,

    range: (min, max) => {
      _.scale.range([min, max])
      return api
    },

    domain: values => {
      switch (_.kind) {
        default:
        case 'linear':
          _.scale.domain([Math.min(...values), Math.max(...values)])
          break
        case 'band':
        case 'point':
          _.scale.domain(values)
          break
      }
      return api
    },

    kind: value => {
      if (typeof value === 'undefined') {
        return _.kind
      } else {
        switch (value) {
          default:
          case 'linear':
            _.scale = scaleLinear()
            break
          case 'band':
            _.scale = scaleBand().padding(0.1)
            break
          case 'point':
            _.scale = scalePoint().padding(0.5)
        }
      }
    }
  }

  return api
}
