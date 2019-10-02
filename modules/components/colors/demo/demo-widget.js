const ColorsDemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.components.Widget('demo', name, parent, 'div'),
        dalian.components.Colors
    )

    // Change colors over time
    const keys = [
        'color1',
        'color2',
        'color3',
        'color4',
        'color5',
        'color6',
    ]
    let i = 0
    setInterval(() => {
        self._widget.container
            .transition().duration(1000)
            .style('background-color', self._colors.mapping(keys[i]))
        i = (i + 1) % (keys.length)
    }, 1000)

    return api
};
