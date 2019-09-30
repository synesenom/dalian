export default (_self, _api) => {
    // Set default values
    let self = _self || {}
    self.font = {
        size: '14px',
        color: 'black'
    }

    // Public API
    let api = _api || {}
    api.fontSize = (size = 14) => {
        self.font.size = size + 'px'
        return api
    }

    api.fontColor = (color) => {
        self.font.color = color
        return api
    }

    return { self, api }
}
