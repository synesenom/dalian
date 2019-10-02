import { event, select } from 'd3-selection'

export default (self, api) => {
  self = self || {}
  self._description = {
    id: `${self._widget.id}-description`
  }

  const _getDescription = () => {
    if (typeof self._description.elem !== 'undefined' && !self._description.elem.empty()) {
      return self._description.elem
    } else {
      return select('body').append('div')
        .attr('id', self._description.id)
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
  }

  const _removeDescription = () => {
    if (typeof self._description.elem !== 'undefined' && !self._description.elem.empty()) {
      self._description.elem.remove()
      delete self._description.elem
    }
  }

  // Public API
  api = api || {}
  api.description = content => {
    // If content is empty, disable description
    if (typeof content === 'undefined') {
      self._widget.container.on('contextmenu', null)
    } else {
      // Otherwise bind description event to context menu
      self._widget.container.on('contextmenu', () => {
        // Prevent default event
        event.preventDefault()

        // Update or create description
        self._description.elem = _getDescription()
          .html(content)
      }).on('mouseleave', () => {
        // Remove description if mouse leaves widget
        _removeDescription()
      })
    }
    return api
  }

  return api
}
