import { select } from 'd3'
import styles from '../../utils/styles'
import BaseTooltip from './tooltip'

/**
 * Component implementing the element tooltip feature. The element tooltip is a pre-formatted tooltip that takes a
 * data point and displays it in the tooltip with a colored left border. Can be used in widgets where the tooltip
 * displays info for a specific element in the widget (hence the name), such as bar widgets or pie widgets. It inherits
 * all methods from the [Tooltip]{@link ../components/tooltip.html} component. The tooltip consists of the name of the
 * current element (which can be formatted using [titleFormat]{@link ../components/tooltip.html#titleFormat}) and the
 * available coordinates of the element (X, Y or both). The coordinate values can be formatted using the corresponding
 * [xFormat]{@link ../components/tooltip.html#xFormat} and [yFormat]{@link ../components/tooltip.html#yFormat} methods.
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
      let contentNode = styles(select(document.createElement('div')), {
        'border-radius': '2px',
        padding: '10px',
        'font-family': 'inherit',
        'border-left': content.stripe ? 'solid 4px ' + content.stripe : null
      })

      // Add title
      styles(contentNode.append('div'), {
        position: 'relative',
        width: 'calc(100% - 10px)',
        'line-height': '11px',
        margin: '2px',
        'margin-bottom': '10px'
      }).text(self._tooltip.titleFormat(content.title))

      // Add content
      content.content.data.forEach(item => {
          let entry = styles(contentNode.append('div'), {
            position: 'relative',
            height: '10px',
            margin: '2px',
            'padding-right': '10px',
            'line-height': '11px'
          })
          styles(entry.append('div'), {
            position: 'relative',
            float: 'left',
            'margin-right': '10px'
          }).text(item.name + ':')
          styles(entry.append('span'), {
            position: 'relative',
            float: 'left'
          }).html(self._tooltip.rowFormat(item.value))
        })

      return contentNode.node().outerHTML
    }
  })

  return {self, api}
}
