import extend from '../core/extend'
import { injectClass } from '../utils/style-injector'

// Classes.
const CLASSES = {
  placeholder: 'dalian-placeholder',
  message: 'dalian-placeholder-message'
}

/**
 * Component implementing the placeholder feature. The placeholder is a blank div with a message in the middle that
 * replaces the widget. It is useful when no data is available, or when the charts needs to be hidden/shown
 * dynamically. When this component is available for a widget, its API is exposed directly via the widget's own
 * namespace.
 *
 * @function Placeholder
 */
export default (self, api) => {
  // Inject relevant style.
  injectClass(CLASSES.placeholder, {
    display: 'table',
    position: 'absolute',
    left: 0,
    top: 0,
    color: 'inherit',
    'font-family': 'inherit',
    'font-size': 'inherit',
    'pointer-events': 'none'
  })
  injectClass(CLASSES.message, {
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
    id: `${self._widget.id}-placeholder`
  }

  // Extend update.
  self._widget.update = extend(self._widget.update, duration => {
    // Update widget content.
    self._widget.content
      .transition().duration(duration)
      .style('opacity', typeof _.placeholder === 'undefined' ? 1 : 0)
    self._widget.disable(typeof _.placeholder !== 'undefined')

    // Update placeholder.
    if (typeof _.placeholder === 'undefined') {
      if (typeof _.container !== 'undefined' && !_.container.empty()) {
        _.container
          .transition().duration(duration)
          .style('opacity', 0)
          .remove()
        delete _.container
      }
    } else {
      if (typeof _.container === 'undefined' || _.container.empty()) {
        _.container = self._widget.container.append('div')
          .attr('id', _.id)
          .attr('class', CLASSES.placeholder)
          .style('width', self._widget.size.width)
          .style('height', self._widget.size.height)
          .style('opacity', 0)
        _.content = _.container.append('span')
          .attr('class', CLASSES.message)
          .html(_.placeholder)
      }

      // Update placeholder.
      _.container.style('font-size', 'inherit')
        .style('color', 'inherit')
        .transition().duration(duration)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
        .style('opacity', 1)
      _.content.html(_.placeholder)
    }
  })

  // Public methods.
  api = Object.assign(api || {}, {
    /**
     * Shows/hides the placeholder. If no placeholder content is provided, the widget is recovered. Note that this only
     * updates the status of the placeholder and the widget still needs to be rendered in order to take effect.
     *
     * @method placeholder
     * @memberOf Placeholder
     * @param {string} content Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is
     * removed. Note that the content can be an empty string in which case the widget is simply hidden.
     * @returns {Widget} Reference to the Widget's API.
     */
    placeholder: (content) => {
      _.placeholder = content
      return api
    }
  })

  return { self, api }
}
