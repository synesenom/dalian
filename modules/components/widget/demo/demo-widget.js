const DemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.components.Widget('demo', name, parent, 'div')
    )

    return api
};
