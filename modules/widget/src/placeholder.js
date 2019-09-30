import { select } from 'd3-selection'

// TODO Remove dependency on Widget
const Placeholder = (self, api) => {
  // Set default values
  self = self || {}
  self.placeholder = {
    id: `${self.widget.id}-placeholder`,
    elem: undefined
  }

  api = api || {}
  api.placeholder = (content, duration = 700) => {
    // If no content provided, remove placeholder and show widget
    if (typeof content === 'undefined') {
      self.widget.dom.container
        .transition().duration(duration)
        .style('opacity', 1)
      if (typeof self.placeholder.elem !== 'undefined' && !self.placeholder.elem.empty()) {
        self.placeholder.elem
          .transition().duration(duration)
          .style('opacity', 0)
          .remove()
        delete self.placeholder.elem
      }
    } else {
      // Otherwise hide widget and add placeholder
      this.widget.dom.container
        .transition().duration(duration)
        .style('opacity', 0)

      // Otherwise fade out widget and add placeholder
      if (typeof self.placeholder.elem === 'undefined' || self.placeholder.elem.empty()) {
        self.placeholder.elem = select('body').append('div')
          .attr('id', self.placeholder.id)
          .style('display', 'table')
          .style('position', 'absolute')
          .style('width', self.widget.size.innerWidth)
          .style('height', self.widget.size.innerHeight)
          .style(self.widget.pos.x.attr, self.widget.pos.x.value)
          .style(self.widget.pos.y.attr, self.widget.pos.y.value)
          .style('color', self.widget.font.color)
          .style('font-family', 'inherit')
          .style('font-size', self.widget.font.size)
          .style('pointer-events', 'none')
        self.placeholder.elem.append('span')
          .style('display', 'table-cell')
          .style('vertical-align', 'middle')
          .style('line-height', 'normal')
          .style('text-align', 'center')
          .style('color', 'inherit')
          .style('font-family', 'inherit')
          .style('font-size', 'inherit')
          .style('opacity', 0)
          .html(content)
          .transition().duration(duration)
          .style('opacity', 1)
      }
    }
    return api
  }

  return api
}
