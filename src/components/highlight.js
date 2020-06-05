import { select } from 'd3'
import encode from '../core/encode'

// FIXME Plots entering are not affected by the highlight

/**
 * Component implementing the highlighting feature. Highlight fades out all plots except a set of specified ones. When
 * this component is available for a widget, its API is exposed directly via the widget's own namespace.
 *
 * @function Highlight
 */
export default selectors => (() => {
  return (self, api) => {
    // Private members.
    const _ = {
      selectors,
      highlightSelection: (selector, keys, duration) => {
        // Ignore highlight during animation.
        if (self._widget.transition) {
          return
        }

        // Stop current transitions.
        const selection = self._highlight.container.selectAll(selector)
        selection.transition()

        // Perform highlight.
        if (typeof keys === 'string') {
          // Single key.
          selection.transition().duration(duration)
            .style('opacity', function () {
              return select(this).classed(encode(keys)) ? 1 : 0.1
            })
        } else if (Array.isArray(keys)) {
          // Multiple keys.
          const encodedKeys = keys.map(encode)
          selection.transition().duration(duration)
            .style('opacity', function () {
              const elem = select(this)
              return encodedKeys.reduce((s, d) => s || elem.classed(d), false) ? 1 : 0.1
            })
        } else {
          // Remove highlight.
          selection.transition().duration(duration || 0)
            .style('opacity', 1)
        }
      }
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _highlight: {
        container: undefined,
        selectors: undefined
      }
    })

    // Public API.
    api = Object.assign(api || {}, {
      /**
       * Highlights a single plot or multiple plots.
       *
       * @method highlight
       * @methodOf Highlight
       * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the elements to highlight.
       * If key is {null} or {undefined}, the highlight is removed (all plots become visible).
       * @param {number} duration Duration of the highlight animation in ms.
       * @returns {Widget} Reference to the Widget's API.
       */
      highlight: (keys, duration) => {
        // Check if container is specified.
        if (typeof self._highlight.container === 'undefined') {
          throw Error('Highlight.container is not specified')
        }

        // Highlight elements.
        _.selectors.forEach(d => _.highlightSelection(d, keys, duration))

        // Return widget API.
        return api
      }
    })

    return { self, api }
  }
})()
