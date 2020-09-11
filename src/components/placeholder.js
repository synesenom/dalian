import extend from '../core/extend'
import StyleInjector from '../utils/style-injector'

// Classes.
const CLASSES = {
  placeholder: 'dalian-placeholder',
  message: 'dalian-placeholder-message'
}

/**
 * Component implementing the placeholder feature. The placeholder is a blank div with a message in the middle that
 * replaces the widget. It is useful when no data is available, or when the widgets needs to be hidden/shown
 * dynamically. When this component is available for a widget, its API is exposed directly via the widget's own
 * namespace.
 *
 * @function Placeholder
 */
export default (self, api) => {
  // Inject relevant style.
  StyleInjector.addClass(CLASSES.placeholder, {
    display: 'table',
    position: 'absolute',
    left: 0,
    top: 0,
    color: 'inherit',
    'font-family': 'inherit',
    'font-size': 'inherit',
    'pointer-events': 'none'
  }).addClass(CLASSES.message, {
    display: 'table-cell',
    'vertical-align': 'middle',
    'line-height': 'normal',
    'text-align': 'center',
    color: 'inherit',
    'font-family': 'inherit',
    'font-size': 'inherit'
  })

  // Private members.
  const _ = {
    // Variables.
    id: `${self._widget.id}-placeholder`,
    content: undefined
  }

  // Extend update.
  self._widget.update = extend(self._widget.update, duration => {
    // Update widget content.
    self._widget.content
      .transition().duration(duration)
      .style('opacity', typeof _.content === 'undefined' ? 1 : 0)
    self._widget.disable(typeof _.content !== 'undefined')

    // Update placeholder.
    if (typeof _.content === 'undefined') {
      // Update placeholder.
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        _.elem
          .transition().duration(duration)
          .style('opacity', 0)
          .remove()
        delete _.elem
      }
    } else {
      // Otherwise fade out widget and add placeholder
      if (typeof _.elem === 'undefined' || _.elem.empty()) {
        _.elem = self._widget.container.append('div')
          .attr('id', _.id)
          .attr('class', CLASSES.placeholder)
          .style('width', self._widget.size.width)
          .style('height', self._widget.size.height)
        _.elem.append('span')
          .attr('class', CLASSES.message)
          .style('opacity', 0)
          .html(_.content)
          .transition().duration(duration)
          .style('opacity', 1)
      }

      // Update placeholder.
      _.elem.style('font-size', 'inherit')
        .transition().duration(duration)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
        .style('color', 'inherit')
    }
  })

  // Public methods
  api = Object.assign(api || {}, {
    /**
     * Shows/hides the placeholder. If no placeholder content is provided, the widget is recovered. Note that this only
     * updates the status of the placeholder and the widget still needs to be rendered in order to take effect.
     *
     * @method placeholder
     * @methodOf Placeholder
     * @param {string} content Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is
     * removed. Note that the content can be an empty string in which case the widget is simply hidden.
     * @returns {Widget} Reference to the Widget's API.
     */
    placeholder: (content) => {
      _.content = content
      return api
    }
  })

  return { self, api }
}
