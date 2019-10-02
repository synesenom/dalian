const FontDemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.components.Widget('demo', name, parent, 'div'),
        dalian.components.Font,
        dalian.components.Placeholder
    )

    return api
};
