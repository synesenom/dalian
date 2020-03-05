import { select } from 'd3'
import encode from '../core/encode'

// FIXME Plots entering are not affected by the highlight

/**
 * Component generator implementing the highlight feature.
 *
 * @class Highlight
 * @param {string[]} selectors Array of strings defining the highlightable selections.
 * @returns {Function} Function representing the highlight component.
 */
export default selectors => (() => {
  return (self, api) => {
    // Private members
    let _ = {
      selectors,
      highlightSelection: (selector, keys, duration) => {
        if (self._widget.transition) {
          return
        }

        // Stop current transitions
        let selection = self._highlight.container.selectAll(selector)
        selection.transition()

        // Perform highlight
        if (typeof keys === 'string') {
          // Single key
          selection.transition().duration(duration)
            .style('opacity', function () {
              return select(this).classed(encode(keys)) ? 1 : 0.1
            })
        } else if (Array.isArray(keys)) {
          // Multiple keys
          let keys = keys.map(d => encode(d))
          selection.transition().duration(duration)
            .style('opacity', function () {
              let elem = select(this)
              return keys.reduce((s, d) => s || elem.classed(d), false) ? 1 : 0.1
            })
        } else {
          // Remove highlight
          selection.transition().duration(duration || 0)
            .style('opacity', 1)
        }
      }
    }

    // Protected members
    self = Object.assign(self || {}, {
      _highlight: {
        container: undefined,
        selectors: undefined
      }
    })

    // Public API
    api = Object.assign(api || {}, {
      /**
       * Highlights a single plot or multiple plots.
       *
       * @method highlight
       * @methodOf Highlight
       * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the elements to highlight. If key is
       * is {null} or {undefined}, the highlight is removed (all plots become visible).
       * @param {number} [duration = 400] Duration of the highlight animation in ms.
       * @returns {Object} Reference to the Highlight API.
       */
      highlight: (keys, duration = 400) => {
        // Check if container is specified
        if (typeof self._highlight.container === 'undefined') {
          throw Error('Highlight.container is not specified')
        }

        // Highlight elements
        _.selectors.forEach(d => _.highlightSelection(d, keys, duration))
        return api
      }
    })

    return { self, api }
  }
})()
