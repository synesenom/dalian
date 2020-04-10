import compose from '../core/compose'
import Widget from '../components/widget'
import Colors from '../components/color'
import Placeholder from '../components/placeholder'
import Mouse from '../components/mouse'
import extend from '../core/extend'

export default (name, parent) => {
  let { self, api } = compose(
    Widget(type, name, parent, elem),
    Colors,
    Placeholder,
    Mouse
  )

  // Private members
  let _ = {

  }

  // Extend update
  self._widget.update = extend(self._widget.update, _.update)

  // Public API
  api = Object.assign(api, {

  })

  return { self, api }
}