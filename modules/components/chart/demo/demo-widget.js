const ChartDemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.components.Chart('chart', name, parent, 'div')
    )

    return api
};
