import { select } from 'd3'
import styles from '../../utils/styles'
import Tooltip from './tooltip'


/**
 * Component implementing the point tooltip feature. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in widgets where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line widgets or heat maps.
 * It inherits all methods from the [Tooltip]{@link ../components/tooltip.html} component. The tooltip consists of the
 * X coordinate of the current data point(s) (which can be formatted using
 * [xFormat]{@link ../components/tooltip.html#xFormat}) and the list of Y coordinates for the plots (formatted using
 * [yFormat]{@link ../components/tooltip.html#yFormat}).
 *
 * @function PointTooltip
 */
export default (self, api) => {
  // Inherit from base tooltip
  let base = Tooltip(self, api)

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
        display: 'table',
        padding: '10px'
      })

      // Add title
      styles(contentNode.append('div'), {
        display: 'table-row',
        position: 'relative'
      }).text(self._tooltip.xFormat(content.title))

      // Add content
      content.content.data.forEach((plot, i) => {
        let wrapper = styles(contentNode.append('div'), {
          display: 'table-row',
          position: 'relative'
        })
        let entry = styles(wrapper.append('div'), {
          display: 'inline-block',
          position: 'relative',
          height: parseFloat(self._font.size) + 'px',
          'margin-top': (i === 0 ? 6 : 3) + 'px'
        })
        let box = styles(entry.append('div'), {
          display: 'flex',
          position: 'relative',
          'justify-content': 'center',
          'align-items': 'center',
          height: parseFloat(self._font.size) + 'px'
        })
        styles(box.append('div'), {
          display: 'inline-block',
          position: 'relative',
          float: 'left',
          width: 0.8 * parseFloat(self._font.size) + 'px',
          height: 0.8 * parseFloat(self._font.size) + 'px',
          'margin-right': '10px',
          'border-radius': '2px',
          background: plot.background
        })
        styles(box.append('div'), {
          display: 'table-cell',
          position: 'relative',
          'max-width': '120px',
          float: 'left',
          'line-height': self._font.size
        }).html(self._tooltip.yFormat(plot.value, plot.name))
      })

      return contentNode.node().outerHTML
    }
  })

  return {self, api}
}
