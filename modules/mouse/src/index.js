export default (_self, _api) => {
  // Set default values
  let self = _self || {}
  self.mouse = {
    enter: undefined,
    leave: undefined,
    click: undefined
  }

  // Public API
  let api = _api || {}
  api.mouseover = callback => {
    self.mouse.enter = callback
    return api
  }

  api.mouseleave = callback => {
    self.mouse.leave = callback
    return api
  }

  api.click = callback => {
    self.mouse.click = callback
    return api
  }

  return { self, api }
}
