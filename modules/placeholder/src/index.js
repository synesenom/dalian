export default (self, api) => {
  // Set default values
  self = self || {}
  self._placeholder = {
    id: `${self._widget.id}-placeholder`
  }

  const _updatePlaceholder = () => {
    if (typeof self._placeholder.elem !== 'undefined') {
      self._placeholder.elem
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)
        .style(self._widget.pos.x.ignore, null)
        .style(self._widget.pos.x.attr, self._widget.pos.x.value)
        .style(self._widget.pos.y.ignore, null)
        .style(self._widget.pos.y.attr, self._widget.pos.y.value)
    }
  }

  // Append update
  let updateWidget = self._widget.update
  self._widget.update = duration => {
    updateWidget(duration)
    _updatePlaceholder()
  }

  api = api || {}
  api.placeholder = (content, duration = 700) => {
    // If no content provided, remove placeholder and show widget
    if (typeof content === 'undefined') {
      self._widget.container
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
      // Otherwise hide widget and add placeholder
      self._widget.container
        .transition().duration(duration)
        .style('opacity', 0)

      // Otherwise fade out widget and add placeholder
      if (typeof self._placeholder.elem === 'undefined' || self._placeholder.elem.empty()) {
        self._placeholder.elem = self._widget.parent.append('div')
          .attr('id', self._placeholder.id)
          .style('display', 'table')
          .style('position', 'absolute')
          .style('width', self._widget.size.innerWidth)
          .style('height', self._widget.size.innerHeight)
          .style(self._widget.pos.x.ignore, null)
          .style(self._widget.pos.x.attr, self._widget.pos.x.value)
          .style(self._widget.pos.y.ignore, null)
          .style(self._widget.pos.y.attr, self._widget.pos.y.value)
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
