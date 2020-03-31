import { select } from 'd3'
import BaseTooltip from './tooltip'

/**
 * Component implementing the element tooltip feature. The element tooltip is a pre-formatted tooltip that takes a
 * data point and displays it in the tooltip with a colored left border. Can be used in widgets where the tooltip
 * displays info for a specific element in the widget (hence the name), such as bar widgets or pie widgets. It inherits
 * all methods from the [Tooltip]{@link ../components/tooltip.html} component. Relevant API methods:
 * [on]{@link ../components/tooltip.html#on}, [xFormat]{@link ../components/tooltip.html#xFormat},
 * [yFormat]{@link ../components/tooltip.html#yFormat}.
 *
 * @function PointTooltip
 */
export default (self, api) => {
  // Inherit from base tooltip
  let base = BaseTooltip(self, api)

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Override methods
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node
      let contentNode = select(document.createElement('div'))
        .style('border-radius', '2px')
        .style('padding', '10px')
        .style('font-family', 'inherit')
        .style('border-left', content.stripe ? 'solid 4px ' + content.stripe : null)

      // Add title
      contentNode
        .append('div')
        .style('position', 'relative')
        .style('width', 'calc(100% - 10px)')
        .style('line-height', '11px')
        .style('margin', '2px')
        .style('margin-bottom', '10px')
        .text(self._tooltip.xFormat(content.title))

      // Add content
      content.content.data.forEach(item => {
          let entry = contentNode.append('div')
            .style('position', 'relative')
            .style('height', '10px')
            .style('margin', '2px')
            .style('padding-right', '10px')
            .style('line-height', '11px')
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'left')
            .style('margin-right', '10px')
            .text(item.name + ':')
          entry.append('span')
            .style('position', 'relative')
            .style('float', 'left')
            .html(self._tooltip.yFormat(item.value))
        })

      return contentNode.node().outerHTML
    }
  })

  return {self, api}
}
