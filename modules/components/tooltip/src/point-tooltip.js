import { select } from 'd3-selection'
import BaseTooltip from './base-tooltip'

export default (_self, _api) => {
  // Inherit from base tooltip
  let {self, api} = BaseTooltip(_self, _api)

  // Overridden builder
  self._tooltip.builder = content => {
    if (typeof content === 'undefined') {
      self._tooltip.content()
      return undefined
    }

    // Create content node
    let contentNode = select(document.createElement('div'))
      .style('border-radius', '2px')
      .style('padding', '5px')
      .style('font-family', 'Courier')

    // Add title
    contentNode
      .append('div')
      .style('position', 'relative')
      .style('width', 'calc(100% - 10px)')
      .style('line-height', '11px')
      .style('margin', '5px')
      .style('margin-bottom', '10px')
      .text(self._tooltip.titleFormat(content.title))

    // Add color
    contentNode.style('border-left', content.stripe ? 'solid 2px ' + content.stripe : null)

    // Add content
    switch (content.content.type) {
      case 'metrics':
        // List of metrics
        content.content.data.forEach(row => {
          let entry = contentNode.append('div')
            .style('position', 'relative')
            .style('display', 'block')
            .style('width', 'auto')
            .style('height', '10px')
            .style('margin', '5px')
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'left')
            .style('color', '#888')
            .html(row.label);
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'right')
            .style('margin-left', '10px')
            .html(row.value)
        })
        break
      case 'plots':
        // List of plots
        content.content.data.sort((a, b) => a.name.localeCompare(b.name))
          .forEach(plot => {
            let entry = contentNode.append('div')
              .style('position', 'relative')
              .style('max-width', '150px')
              .style('height', '10px')
              .style('margin', '5px')
              .style('padding-right', '10px')
            entry.append('div')
              .style('position', 'relative')
              .style('width', '9px')
              .style('height', '9px')
              .style('float', 'left')
              .style('background', plot.background)
            entry.append('span')
              .style('position', 'relative')
              .style('width', 'calc(100% - 20px)')
              .style('height', '10px')
              .style('float', 'right')
              .style('line-height', '11px')
              .html(plot.value)
          })
        break
    }

    return contentNode.node().outerHTML
  }

  // Protected members
  self._tooltip = Object.assign(self._tooltip, {
    // Override methods
    titleFormat: x => x
  })

  // Extend API
  api = Object.assign(api, {
    tooltipTitleFormat: format => {
      self._tooltip.titleFormat = format
      return api
    }
  })

  return {self, api}
}
