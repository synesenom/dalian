const TooltipDemoWidget = (name, parent) => {
    let { self, api } = utils.compose(
        dalian.Widget('demo', name, parent, 'div'),
        dalian.Mouse,
        dalian.Tooltip
    )

    // Define mouse events
    self._widget.container
        .on('mouseover', () => self._mouse.mouseover(self._widget.container))
        .on('mouseleave', () => self._mouse.mouseleave(self._widget.container));

    return api
};
