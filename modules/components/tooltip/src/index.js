import { easeLinear } from 'd3-ease'
import { event, mouse, select } from 'd3-selection'
import { extend } from '@dalian/core'

export default (self, api) => {
  // Set default values
  self = self || {}
  self._tooltip = {
    container: {
      id: 'dalian-tooltip-container'
    },
    id: `${self._widget.id}-tooltip`,
    on: false
  }

  // Private methods
  const _getContainer = () => {
    let container = select('#' + self._tooltip.container.id)
    if (container.empty()) {
      return select('body').append('div')
        .attr('id', self._tooltip.container.id)
    }
  }

  const _getTooltip = (bbox, scroll) => {
    if (typeof self._tooltip.elem !== 'undefined' && !self._tooltip.elem.empty()) {
      return self._tooltip.elem
    } else {
      return self._tooltip.container.elem.append('div')
        .attr('id', self._tooltip.id)
        .style('position', 'absolute')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('border-radius', '2px')
        .style('padding', '5px')
        .style('box-shadow', '0 0 3px grey')
        .style('font-family', '"Courier", monospace')
        .style('font-size', '0.7em')
        .style('color', 'black')
        .style('pointer-events', 'none')
        .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
        .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
    }
  }

  const _hideTooltip = () => {
    if (typeof self._tooltip.elem !== 'undefined') {
      self._tooltip.elem
          .transition().duration(200)
          .style('opacity', 0)
          .on('end', function () {
            select(this)
                .style('display', 'none')
          })
    }
  }

  // Extend update method
  const _updateTooltip = () => {
    self._widget.container
        .style('pointer-events', self._tooltip.on ? 'all' : null)
        .on('mousemove', () => {
          self._tooltip.on && self._tooltip.show()
        })
        .on('mouseout', _hideTooltip)
  }
  self._widget.update = extend(self._widget.update, _updateTooltip)

  // Protected methods
  self._tooltip.createContent = () => {
    console.warn('createTooltip(mouse) is not implemented')
  }

  self._tooltip.show = () => {
    console.log('show');
    // Get mouse position relative to page

    let mx = event.pageX

    let my = event.pageY

    let boundingBox = self._widget.container.node().getBoundingClientRect()

    // Get scroll position
    let scroll = {
      left: window.pageXOffset || document.documentElement.scrollLeft,
      top: window.pageYOffset || document.documentElement.scrollTop
    }

    // If we are outside the charting area just remove tooltip
    if (mx < boundingBox.left + self._widget.margins.left - scroll.left
        || mx > boundingBox.right - self._widget.margins.right + scroll.left
        || my < boundingBox.top + self._widget.margins.top - scroll.top
        || my > boundingBox.bottom - self._widget.margins.bottom + scroll.top) {
      _hideTooltip()
      return
    }

    // Get or create container
    self._tooltip.container.elem = _getContainer()

    // Get or create tooltip
    self._tooltip.elem = _getTooltip(boundingBox, scroll)

    // Create content
    let m = mouse(self._widget.container.node())
    let content = self._tooltip.createContent([m[0] - self._widget.margins.left, m[1] - self._widget.margins.top])
    if (typeof content === 'undefined') {
      if (typeof self._tooltip.elem !== 'undefined') {
        // If content is invalid, remove tooltip
        _hideTooltip()
        return
      }
    } else {
      // Otherwise, set content
      self._tooltip.elem.html(content)
    }

    // Calculate position
    let elem = self._tooltip.elem.node().getBoundingClientRect()

    let tw = elem.width

    let th = elem.height

    let tx = mx + 20

    let ty = my + 20

    // TODO Make tooltip contained within the widget (left side)
    // Correct for edges
    if (tx + tw > boundingBox.right - self._widget.margins.right + scroll.left - 5) {
      tx -= tw + scroll.left + 40
      //tx = boundingBox.right - self._widget.margins.right + scroll.left - 10 - tw
    }
    if (ty + th > boundingBox.bottom - self._widget.margins.bottom + scroll.top - 5) {
      ty = boundingBox.bottom - self._widget.margins.bottom + scroll.top - 10 - th
    }

    // Set position
    self._tooltip.elem
      .style('display', 'block')
      .transition().duration(0)
      .style('opacity', 1)
      .transition()
    self._tooltip.elem
      .transition().duration(200).ease(easeLinear)
      .style('left', tx + 'px')
      .style('top', ty + 'px')
  }

  // Public API
  api = api || {}
  api.tooltip = on => {
    self._tooltip.on = on
    return api
  }

  return { self, api }
}
