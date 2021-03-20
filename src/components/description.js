import { event, select } from 'd3'
import StyleInjector from '../utils/style-injector'

// Classes.
const CLASSES = {
  description: 'dalian-description'
}

/**
 * Component implementing the widget description feature. A description is a static pop-up label shown when the context
 * menu is opened (historically on right mouse click). The description disappears once the mouse leaves the widget. When
 * this component is available for a widget, its API is exposed directly via the widget's own namespace.
 *
 * @function Description
 */
export default (self, api) => {
  // Inject relevant style.
  StyleInjector.addClass(CLASSES.description, {
    position: 'absolute',
    width: 'auto',
    'max-width': '500px',
    padding: '10px',
    background: '#fff',
    'box-shadow': '0 0 3px #000',
    'border-radius': '3px',
    color: '#000',
    'font-size': '.8em',
    'font-family': 'inherit',
    'line-height': '1.35em',
    'pointer-events': 'none'
  })

  // Private members.
  const _ = {
    // Variables.
    id: `${self._widget.id}-description`,

    // Methods.
    // TODO Docstring.
    getDescription: () => {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        return _.elem
      } else {
        return select('body').append('div')
          .attr('id', _.id)
          .attr('class', CLASSES.description)
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY - 20) + 'px')
      }
    },

    // TODO Docstring.
    removeDescription: () => {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        _.elem.remove()
        delete _.elem
      }
    }
  }

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Enables/disables description for the current widget.
     *
     * @method description
     * @methodOf Description
     * @param {string} [content] Content of the description. Can be HTML formatted. If not provided, description is
     * disabled.
     * @returns {Widget} Reference to the Widget's API.
     * @example
     *
     * // Enable description with the content 'Beautiful data'.
     * chart.description('Beautiful data')
     *
     * // Disable description.
     * chart.description()
     */
    description: content => {
      // If content is empty, disable description
      if (typeof content === 'undefined') {
        self._widget.container.on('contextmenu.description', null)
      } else {
        // Otherwise bind description event to context menu
        self._widget.container.on('contextmenu.description', () => {
          // Prevent default event
          event.preventDefault()

          // Update or create description
          _.elem = _.getDescription()
            .html(content)
        }).on('mouseleave.description', () => {
          // Remove description if mouse leaves widget
          _.removeDescription()
        })
      }
      return api
    }
  })

  return { self, api }
}
