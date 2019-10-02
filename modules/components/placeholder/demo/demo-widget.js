const PlaceholderDemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.Widget('demo', name, parent, 'div'),
        dalian.Placeholder
    )

    return api
};
