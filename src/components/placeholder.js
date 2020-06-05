import extend from '../core/extend'
import styles from '../utils/styles'

/**
 * Component implementing the placeholder feature. The placeholder is a blank div with a message in the middle that
 * replaces the widget. It is useful when no data is available, or when the widgets needs to be hidden/shown
 * dynamically. When this component is available for a widget, its API is exposed directly via the widget's own
 * namespace.
 *
 * @function Placeholder
 */
export default (self, api) => {
  // Private members
  const _ = {
    // Variables
    id: `${self._widget.id}-placeholder`
  }

  // Extend update
  self._widget.update = extend(self._widget.update, duration => {
    if (typeof _.elem !== 'undefined') {
      _.elem
        .style('font-size', 'inherit')
        .transition().duration(duration)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
        .style('color', 'inherit')
    }
  })

  // Public methods
  api = Object.assign(api || {}, {
    /**
     * Shows/hides the placeholder. If no placeholder content is provided, the widget is recovered.
     *
     * @method placeholder
     * @methodOf Placeholder
     * @param {string} content Content of the placeholder. Can be HTML formatted. If omitted, the placeholder is
     * removed. Note that the content can be an empty string in which case the widget is simply hidden.
     * @param {number} [duration = 0] Duration of the placeholder animation in ms.
     * @returns {Widget} Reference to the Widget's API.
     */
    placeholder: (content, duration = 0) => {
      // If no content provided, remove placeholder and show widget
      if (typeof content === 'undefined') {
        self._widget.content
          .style('display', 'block')
          .transition().duration(duration)
          .style('opacity', 1)
        self._widget.disable(false)
        if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
          _.elem
            .transition().duration(duration)
            .style('opacity', 0)
            .remove()
          delete _.elem
        }
      } else {
        // Otherwise hide widget and add placeholders
        self._widget.content
          .transition().duration(duration)
          .style('opacity', 0)
          .on('end', () => {
            self._widget.content.style('display', 'none')
          })
        self._widget.disable(true)

        // Otherwise fade out widget and add placeholder
        if (typeof _.elem === 'undefined' || _.elem.empty()) {
          _.elem = self._widget.container.append('div')
            .attr('id', _.id)
            .attr('class', 'dalian-placeholder')
          styles(_.elem, {
            display: 'table',
            position: 'absolute',
            width: self._widget.size.width,
            height: self._widget.size.height,
            left: 0,
            top: 0,
            color: 'inherit',
            'font-family': 'inherit',
            'font-size': 'inherit',
            'pointer-events': 'none'
          })
          styles(_.elem.append('span'), {
            display: 'table-cell',
            'vertical-align': 'middle',
            'line-height': 'normal',
            'text-align': 'center',
            color: 'inherit',
            'font-family': 'inherit',
            'font-size': 'inherit',
            opacity: 0
          }).html(content)
            .transition().duration(duration)
            .style('opacity', 1)
        }
      }
      return api
    }
  })

  return { self, api }
}
