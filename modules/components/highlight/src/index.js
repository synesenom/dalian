import { select } from 'd3-selection'
import { encode } from '../../../core/src/index'

export default (self, api) => {
  // Private members
  let _ = {
    /**
     * Highlights elements by a single selector. The selector and the key(s) (identifiers) of the elements are used
     * together to select parts of the widget to highlight.
     *
     * @method highlightSelection
     * @methodOf Highlight
     * @param {string} selector Selector for the elements to highlight.
     * @param {(string | string[])} keys Single key or array of keys to highlight elements for. If key is null or
     * undefined, the highlight is reversed (all elements become visible).
     * @param {number} duration Duration of the highlight animation in ms.
     * @private
     */
    highlightSelection: (selector, keys, duration) => {
      // TODO If currently animated, don't highlight
      /*if (_.transition) {
        return
      }*/

      // Stop current transitions
      let elems = self._highlight.container.selectAll(selector)
      elems.transition()

      // Perform highlight
      if (typeof keys === 'string') {
        // Single key
        elems.transition().duration(duration)
          .style('opacity', function () {
            return select(this).classed(encode(keys)) ? 1 : 0.1
          })
      } else if (Array.isArray(keys)) {
        // Multiple keys
        let keys = keys.map(d => encode(d))
        elems.transition().duration(duration)
          .style('opacity', function () {
            let elem = select(this)
            return keys.reduce((s, d) => s || elem.classed(d), false) ? 1 : 0.1
          })
      } else {
        // Remove highlight
        elems.transition().duration(duration || 0)
          .style('opacity', 1)
      }
    }
  }

  // Protected methods
  self = Object.assign(self || {}, {
    _highlight: {
      container: undefined,
      selectors: undefined
    }
  })

  // Public API
  api = Object.assign(api || {} , {
    /**
     * Highlights a single plot or multiple plots.
     *
     * @method highlight
     * @methodOf Highlight
     * @param {(string | string[])} keys Single key or array of keys to highlight elements for. If key is null or
     * undefined, the highlight is reversed (all elements become visible).
     * @param {number} [duration = 400] Duration of the highlight animation in ms.
     * @returns {Object} Reference to the API of the component.
     */
    highlight: (keys, duration = 400) => {
      // Check if container is specified
      if (typeof self._highlight.container === 'undefined') {
        throw Error('Highlight.container is not specified')
      }

      // Check if selectors is specified
      if (typeof self._highlight.selectors === 'undefined') {
        throw Error('Highlight.selectors is not specified')
      }

      // Highlight elements
      self._highlight.selectors.forEach(d => _.highlightSelection(d, keys, duration))
      return api
    }
  })

  return { self, api }
}
