let states = {
  // Widget
  x: [0, 100],
  y: [0, 100],
  width: [300, 400],
  height: [200, 300],
  margins: [40, 60],
  // Chart
  data: [[{
    name: 'apples',
    values: Array.from({ length: 20 }, (d, i) => ({
      x: i,
      y: 10 * (Math.exp(i / 10) / 10 + 0.3),
      lo: 1,
      hi: 1
    }))
  }, {
    name: 'oranges',
    values: Array.from({ length: 20 }, (d, i) => ({
      x: i,
      y: 10 * (Math.sin(i * 200 + 0.6) / 8 + 0.6),
      lo: 1,
      hi: 0.5
    }))
  }], [{
    name: 'apples',
    values: Array.from({ length: 30 }, (d, i) => ({
      x: i,
      y: 10 * (Math.cos(i / 10) / 2 + 0.5)
    }))
  }, {
    name: 'oranges',
    values: Array.from({ length: 30 }, (d, i) => ({
      x: i,
      y: 10 * (Math.sin(i / 5 + 0.6) / 8 + 0.6),
      lo: 3,
      hi: 4
    }))
  }, {
    name: 'pears',
    values: Array.from({ length: 30 }, (d, i) => ({
      x: i,
      y: 10 * (Math.cosh(i / 10 + 0.6) / 10 + 0.2),
      lo: 1,
      hi: 2
    }))
  }]],
  // Colors
  colors: [undefined, {
    apples: 'yellowgreen',
    oranges: 'orange',
    pears: 'grey'
  }],
  // Description
  description: [undefined, 'This chart shows data on some fruit'],
  // Font
  fontSize: [12, 14],
  fontColor: ['black', 'royalblue'],
  // Line style
  lineStyle: ['solid', {
    apples: 'dashed',
    oranges: 'dotted'
  }],
  // Mouse
  mouseover: [undefined, k => lineChart.highlight(k.name)],
  mouseleave: [undefined, () => lineChart.highlight(null, 700)],
  // Placeholder
  placeholder: [undefined, 'Data is not available.'],
  // Smoothing
  smoothing: [false, true],
  // Tooltip
  tooltip: [false, true],
  tooltipXFormat: [undefined, x => `Day ${x}`],
  tooltipYFormat: [undefined, x => x.toFixed(2)],
  // Trend marker
  xLabel: ['days', 'weeks'],
  yLabel: ['price [USD]', 'quantity'],
  xTickFormat: [undefined, x => `week ${x}`],
  yTickFormat: [undefined, x => x.toFixed(2)]
};

let lineChart = dalian.widgets.LineChart('myDemo', '#widget')
  .margins(states.margins[0])
  .data(states.data[0])
  .xLabel(states.xLabel[0])
  .yLabel(states.yLabel[0])
  .render();

addControls(lineChart, states);

special('addMarker', () => {
  lineChart.addMarker('marker', 'apples', 5, 15, 'This is a trend-marker', 700)
})

special('removeMarker', () => {
  lineChart.removeMarker('marker')
})