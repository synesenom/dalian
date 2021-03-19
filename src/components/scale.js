import { scaleBand, scaleLinear, scaleLog, scalePoint, scalePow } from 'd3'

/**
 * Component implementing a scale.
 *
 * @function Scale
 * @param {string} [type = linear] Type of scale: linear, band or point.
 */
export default (type = 'linear') => {
  // Private members
  const _ = {
    type,
    scale: (() => {
      switch (type) {
        default:
        case 'linear':
          return scaleLinear()
        case 'sqrt':
          return scalePow().exponent(0.5)
        case 'log':
          return scaleLog()
        case 'band':
          return scaleBand().padding(0.1)
        case 'point':
          return scalePoint().padding(0.5)
      }
    })()
  }

  const api = {
    scale: _.scale,

    range: (min, max) => {
      _.scale.range([min, max])
      return api
    },

    domain: values => {
      switch (_.type) {
        default:
        case 'linear':
        case 'sqrt':
        case 'log':
          _.scale.domain([Math.min(...values), Math.max(...values)])
          break
        case 'band':
        case 'point':
          _.scale.domain(values)
          break
      }
      return api
    },

    type: value => {
      if (typeof value === 'undefined') {
        return _.type
      } else {
        switch (value) {
          default:
          case 'linear':
            _.scale = scaleLinear()
            break
          case 'log':
            _.scale = scaleLog()
            break
          case 'sqrt':
            _.scale = scalePow().exponent(0.5)
            break
          case 'band':
            _.scale = scaleBand().padding(0.1)
            break
          case 'point':
            _.scale = scalePoint().padding(0.5)
        }
      }
    },

    measure: size => Math.abs(_.scale.invert(size) - _.scale.invert(0))
  }

  return api
}
