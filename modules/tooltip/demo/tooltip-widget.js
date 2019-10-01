// import Widget from '../../widget/src/index'
// import Tooltip from '../src/index'

const TooltipWidget = (name, parent, _self, _api) => {
    let { self, api } = Widget('demo', name, parent, 'div', _self, _api)

    return Object.assign(
        api,
        Mouse(self, api),
        Tooltip(self, api)
    )
}
