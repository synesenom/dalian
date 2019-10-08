const TooltipDemoWidget = (name, parent) => {
    let { self, api } = dalian.core.compose(
        dalian.components.Widget('demo', name, parent, 'div'),
        dalian.components.Mouse,
        dalian.components.Tooltip
    );

    // Tooltip content
    self._tooltip.createContent = () => {
        return `<div style="padding:5px">Just a tooltip.</div>`
    };

    // Define mouse events
    self._widget.container
        .on('mouseover', () => self._mouse.mouseover(self._widget.container))
        .on('mouseleave', () => self._mouse.mouseleave(self._widget.container))

    return api;
};
