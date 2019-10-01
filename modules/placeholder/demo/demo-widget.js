const PlaceholderDemoWidget = (name, parent) => {
    let { self, api } = utils.compose(
        dalian.Widget('demo', name, parent, 'div'),
        Placeholder
    )

    return api
};
