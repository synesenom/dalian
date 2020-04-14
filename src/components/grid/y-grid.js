import BaseGrid from './base-grid'

/**
 * Component implementing the horizontal grid feature. When this component is available for a widget, its API is exposed
 * via the {.yGrid} namespace. It inherits all methods from the [BaseGrid]{@link ../components/base-grid.html}.
 *
 * @function YGrid
 */
export default (self, api) => {
  let base = BaseGrid('y')(self, api)

  self = Object.assign(self || {}, {
    _yGrid: base.baseSelf
  })

  return { self, api: base.api }
}
