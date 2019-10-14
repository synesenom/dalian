import { extend } from '@dalian/core'

export default (self, api) => {
  // Private members
  let _ = {
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
    placeholder: (content, duration = 700) => {
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
          _.elem.append('span')
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
  })

  return {self, api}
}
