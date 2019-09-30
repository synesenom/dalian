import { event, select } from 'd3-selection'

// TODO Remove dependency on Widget
const Description = (self, api) => {
  self = self || {}
  self.description = {
    id: `${self.widget.id}-description`,
    elem: undefined
  }

  const _getDescription = () => {
    if (typeof self.description.elem !== 'undefined' && !self.description.elem.empty()) {
      return self.description.elem
    } else {
      return select('body').append('div')
        .attr('id', self.description.id)
        .style('position', 'absolute')
        .style('left', (event.pageX + 20) + 'px')
        .style('top', (event.pageY - 20) + 'px')
        .style('width', 'auto')
        .style('max-width', '500px')
        .style('padding', '10px')
        .style('background', 'white')
        .style('box-shadow', '0 0 1px black')
        .style('border-r', '3px')
        .style('color', 'black')
        .style('font-size', '0.8em')
        .style('font-family', 'inherit')
        .style('line-height', '1.35em')
        .style('pointer-events', 'none')
    }
  }

  const _removeDescription = () => {
    if (typeof self.description.elem !== 'undefined' && !self.description.elem.empty()) {
      self.description.elem.remove()
      delete self.description.elem
    }
  }

  // Public API
  api = api || {}
  api.description = content => {
    // If content is empty, disable description
    if (typeof content !== 'undefined') {
      this.widget.dom.container.on('contextmenu', null)
    } else {
      // Otherwise bind description event to context menu
      this.widget.dom.container.on('contextmenu', () => {
        // Prevent default event
        event.preventDefault()

        // Update or create description
        self.description.elem = _getDescription()
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
