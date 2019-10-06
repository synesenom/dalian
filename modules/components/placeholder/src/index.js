import { extend } from '@dalian/core'

export default (self, api) => {
  // Set default values
  self = self || {}
  self._placeholder = {
    id: `${self._widget.id}-placeholder`
  }

  // Private methods
  const _updatePlaceholder = duration => {
    if (typeof self._placeholder.elem !== 'undefined') {
      self._placeholder.elem
        .style('font-size', 'inherit')
        .transition().duration(duration)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
        .style('color', 'inherit')
    }
  }
  // Extend update
  self._widget.update = extend(self._widget.update, _updatePlaceholder)

  // Public methods
  api = api || {}
  api.placeholder = (content, duration = 700) => {
    // If no content provided, remove placeholder and show widget
    if (typeof content === 'undefined') {
      self._widget.content
        .style('display', 'block')
        .transition().duration(duration)
        .style('opacity', 1)
      if (typeof self._placeholder.elem !== 'undefined' && !self._placeholder.elem.empty()) {
        self._placeholder.elem
          .transition().duration(duration)
          .style('opacity', 0)
          .remove()
        delete self._placeholder.elem
      }
    } else {
      // Otherwise hide widget and add placeholders
      self._widget.content
        .transition().duration(duration)
        .style('opacity', 0)
        .on('end', () => {
          self._widget.content.style('display', 'none')
        })

      // Otherwise fade out widget and add placeholder
      if (typeof self._placeholder.elem === 'undefined' || self._placeholder.elem.empty()) {
        self._placeholder.elem = self._widget.container.append('div')
          .attr('id', self._placeholder.id)
          .attr('class', 'dalian-placeholder')
          .style('display', 'table')
          .style('position', 'absolute')
          .style('width', self._widget.size.width)
          .style('height', self._widget.size.height)
          .style('left', 0)
          .style('top', 0)
          .style('color', 'inherit')
          .style('font-family', 'inherit')
          .style('font-size', 'inherit')
          .style('pointer-events', 'none')
        self._placeholder.elem.append('span')
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
