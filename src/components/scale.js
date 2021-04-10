import { scaleBand, scaleLinear, scalePoint, scalePow } from 'd3'

/**
 * Component implementing a scale.
 *
 * @function Scale
 * @param {string} [type = linear] Type of scale: linear, band or point.
 */
// TODO Get rid of this component.
export default (type = 'linear') => {
  // Private members
  // TODO Save domain and range.
  const _ = {
    type,
    scale: (() => {
      switch (type) {
        default:
        case 'linear':
          return scaleLinear()
        case 'sqrt':
          return scalePow().exponent(0.5)
        case 'band':
          return scaleBand().padding(0.1)
        case 'point':
          return scalePoint().padding(0.5)
      }
    })()
  }

  const api = x => _.scale(x)

  // TODO Get rid of this getter.
  Object.defineProperty(api, 'scale', {
    get: () => _.scale
  })

  api.copy = () => _.scale.copy()

  api.range = range => {
    _.scale.range(range)
    return api
  }

  api.domain = values => {
    _.scale.domain(values)
    return api
  }

  api.type = value => {
    if (typeof value === 'undefined') {
      return _.type
    } else {
      switch (value) {
        default:
        case 'linear':
          _.scale = scaleLinear()
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
    return api
  }

  api.invert = _.scale.invert

  api.measure = size => Math.abs(_.scale.invert(size) - _.scale.invert(0))

  /*
  const api = {
    get scale () {
      return _.scale
    },

    range: (min, max) => {
      _.scale.range([min, max])
      return api
    },

    domain: values => {
      _.scale.domain(values)
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
      return api
    },

    measure: size => Math.abs(_.scale.invert(size) - _.scale.invert(0))
  }
   */

  return api
}
