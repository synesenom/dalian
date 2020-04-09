import { event, select } from 'd3'

/**
 * Component implementing the widget description feature. A description is a static pop-up label shown when the context
 * menu is opened (historically on right mouse click). The description disappears once the mouse leaves the widget. When
 * this component is available for a widget, its API is exposed directly via the widget's own namespace.
 *
 * @function Description
 */
export default (self, api) => {
  // Private members
  let _ = {
    // Variables
    id: `${self._widget.id}-description`,

    // Methods
    getDescription: () => {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        return _.elem
      } else {
        return select('body').append('div')
          .attr('id', _.id)
          .style('position', 'absolute')
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY - 20) + 'px')
          .style('width', 'auto')
          .style('max-width', '500px')
          .style('padding', '10px')
          .style('background', 'white')
          .style('box-shadow', '0 0 3px black')
          .style('border-radius', '3px')
          .style('color', 'black')
          .style('font-size', '0.8em')
          .style('font-family', 'inherit')
          .style('line-height', '1.35em')
          .style('pointer-events', 'none')
      }
    },

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
     */
    description: content => {
      // If content is empty, disable description
      if (typeof content === 'undefined') {
        self._widget.container.on('contextmenu', null)
      } else {
        // Otherwise bind description event to context menu
        self._widget.container.on('contextmenu', () => {
          // Prevent default event
          event.preventDefault()

          // Update or create description
          _.elem = _.getDescription()
            .html(content)
        }).on('mouseleave', () => {
          // Remove description if mouse leaves widget
          _.removeDescription()
        })
      }
      return api
    }
  })

  return {self, api}
}
