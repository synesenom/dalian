import { select } from 'd3'
import encode from '../core/encode'
import styles from '../utils/styles'

/**
 * Component implementing the highlighting feature. Highlight fades out all plots except a set of specified ones. When
 * this component is available for a widget, its API is exposed directly via the widget's own namespace.
 *
 * @function Highlight
 */
export default (container, selectors, highlightStyle = { blur: { opacity: 0.1 } }) => (() => {
  return (self, api) => {
    // TODO Docstring.
    function createRemoveStyle (style) {
      const properties = Object.keys(style.focus || {})
        .concat(Object.keys(style.blur || {}))
      return properties.reduce((obj, d) => Object.assign(obj, { [d]: null }), {})
    }

    // Private members.
    const _ = {
      container: undefined,
      highlightStyle,
      removeStyle: createRemoveStyle(highlightStyle),
      currentKeys: null,

      // TODO Docstring.
      highlight: (selector, keys, duration) => {
        // Ignore highlight during animation.
        if (self._widget.transition) {
          return
        }

        // Update current keys.
        if (keys === null) {
          _.currentKeys = null
        } else {
          _.currentKeys = Array.isArray(keys) ? keys : [keys]
        }

        // Stop current transitions and create new one.
        const selection = (_.container || (_.container = container())).selectAll(selector)
          .interrupt()
        const t = selection.transition().duration(duration || 0)

        // Prepare key group.
        let keyGroup
        if (typeof keys === 'string') {
          keyGroup = [encode(keys)]
        } else if (Array.isArray(keys)) {
          keyGroup = keys.map(encode)
        } else {
          styles(selection.transition(t), _.removeStyle)
          return
        }

        // Perform highlight.
        // Highlight selected elements.
        styles(selection.filter(function () {
          const elem = select(this)
          return keyGroup.reduce((s, d) => s || elem.classed(d), false)
        }).transition(t), _.highlightStyle.focus || _.removeStyle)

        // Blur others.
        styles(selection.filter(function () {
          const elem = select(this)
          return !keyGroup.reduce((s, d) => s || elem.classed(d), false)
        }).transition(t), _.highlightStyle.blur || _.removeStyle)
      }
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _highlight: {
        // TODO Docstring.
        style (style) {
          _.highlightStyle = style
          _.removeStyle = createRemoveStyle(style)
        },

        // TODO Docstring.
        isHighlighted (key) {
          return _.currentKeys === null || _.currentKeys.indexOf(key) > -1
        }
      }
    })

    // Public API.
    // TODO Expose highlightStyle to API.
    api = Object.assign(api || {}, {
      /**
       * Highlights a single plot or multiple plots.
       *
       * @method highlight
       * @memberOf Highlight
       * @param {(string | string[] | null)} [keys] Single key or array of keys identifying the elements to highlight.
       * If key is {null} or {undefined}, the highlight is removed (all plots become visible).
       * @param {number} [duration = 0] Duration of the highlight animation in ms.
       * @returns {Widget} Reference to the Widget's API.
       */
      highlight: (keys, duration = 0) => {
        // Check if container is specified.
        if (typeof container() === 'undefined') {
          throw Error('Highlight.container is not specified')
        }

        // Highlight elements.
        selectors.forEach(d => _.highlight(d, keys, duration))

        // Return widget API.
        return api
      }
    })

    return { self, api }
  }
})()
