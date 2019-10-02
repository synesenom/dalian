let state = {
  _i: {}
};

function addControls(widget, states) {
  // Add states
  state = Object.assign(state, states);

  // Add buttons
  Object.keys(state).forEach(key => {
    if (key !== '_i') {
      d3.select('.buttons').append('div')
          .attr('id', key)
          .attr('class', 'button')
          .text(key)
          .on('click', () => {
            toggle(key, widget);
          });
    }
  });
}

function toggle (key, widget) {
  // Update or create index
  if (typeof state._i[key] === 'undefined') {
    state._i[key] = 1
  } else {
    state._i[key] = 1 - state._i[key];
  }

  d3.select(`#${key}`).classed('on', state._i[key] === 1);

  // Update line chart
  let value = state[key][state._i[key]]
  if (Array.isArray(value)) {
    widget[key](...state[key][state._i[key]]);
  } else {
    widget[key](state[key][state._i[key]]);
  }
  widget.render(700);
}
