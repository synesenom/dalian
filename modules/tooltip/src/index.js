import { easeLinear } from 'd3-ease'
import { event, mouse, select } from 'd3-selection'
import { extend } from '@dalian/core'

// TODO Remove dependency on Widget
export default (self, api) => {
  // Set default values
  self = self || {}
  self._tooltip = {
    containerId: 'dalian-tooltip-container',
    containerElem: undefined,
    id: `${self._widget.id}-tooltip`,
    elem: undefined,
    on: false
  }

  const _getContainer = () => {
    let container = select('#' + self._tooltip.containerId)
    if (container.empty()) {
      return select('body').append('div')
        .attr('id', self.tooltip.containerId)
    }
  }

  const _getTooltip = (bbox, scroll) => {
    if (typeof self._tooltip.elem !== 'undefined' && !self._tooltip.elem.empty()) {
      return self._tooltip.elem
    } else {
      return self._tooltip.containerElem.append('div')
        .attr('id', self._tooltip.id)
        .style('position', 'absolute')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('border-r', '2px')
        .style('box-shadow', '0 0 3px grey')
        .style('font-family', '"Courier", monospace')
        .style('font-size', '0.7em')
        .style('color', 'black')
        .style('pointer-events', 'none')
        .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
        .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
    }
  }

  // Extend update method
  const _updateTooltip = () => {
    self._widget.container
        .style('pointer-events', self._tooltip.on ? 'all' : null)
        .on('mousemove', () => self._tooltip.on && self._tooltip.show());
  }
  self._widget.update = extend(self._widget.update, _updateTooltip);

  self._tooltip.createContent = () => {
    console.warn('createTooltip(mouse) is not implemented')
  }

  // Private methods
  self._tooltip.show = () => {
    // Create container and tooltip ID
    let m = mouse(self._widget.container.node())

    let mx = event.pageX

    let my = event.pageY

    let boundingBox = self._widget.container.node().getBoundingClientRect()

    // Get scroll position
    let scroll = {
      left: window.pageXOffset || document.documentElement.scrollLeft,
      top: window.pageYOffset || document.documentElement.scrollTop
    }
    // If we are outside the charting area just remove tooltip

    if (mx < boundingBox.left + self._widget.margins.left - scroll.left ||
      mx > boundingBox.right - self._widget.margins.right + scroll.left ||
      my < boundingBox.top + self._widget.margins.top - scroll.top ||
      my > boundingBox.bottom - self._widget.margins.bottom + scroll.top) {
      select('#' + self._tooltip.id)
        .transition().duration(200)
        .style('opacity', 0)
        .on('end', function () {
          select(this)
            .style('display', 'none')
        })
      return
    }

    // Get or create container
    self._tooltip.containerElem = _getContainer()

    // Get or create tooltip
    self._tooltip.elem = _getTooltip(boundingBox, scroll)

    // Create content
    let content = self._tooltip.createContent([m[0] - self._widget.margins.left, m[1] - self._widget.margins.top])
    if (typeof content === 'undefined') {
      if (typeof self._tooltip.elem !== 'undefined') {
        // If content is invalid, remove tooltip
        self._tooltip.elem
          .transition().duration(200)
          .style('opacity', 0)
          .on('end', function () {
            select(this)
              .style('display', 'none')
          })
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
