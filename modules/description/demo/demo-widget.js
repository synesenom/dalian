const DescriptionDemoWidget = (name, parent) => {
    let { self, api } = utils.compose(
        dalian.Widget('demo', name, parent, 'div'),
        Description
    )

    return api
};
