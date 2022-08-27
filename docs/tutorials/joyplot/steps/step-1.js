(async () => {
  // Fetch data.
  const raw = await fetch('https://gist.githubusercontent.com/synesenom/0c2e98a34b548d9fcb9fdf0f76dc79ff/raw/psr_b1919_p21.csv')
    .then(response => response.text())
  const data = raw.split('\n')
    // Each line is a single plot with the indices as X values.
    .map((d, i) => ({
      name: `line${Math.floor(i / 10)}${i % 10}`,
      values: d.split(',')
        .map(parseFloat)
        .map((y, x) => ({
          x,
          y: 0.3 * y - i + 100
        }))
    }))

  // Add chart without any axes shown.
  dalian.AreaChart('lines', '#chart-step-1')
    .data(data)
    .width(parseFloat(d3.select('#chart-step-1').style('width')))
    .height(parseFloat(d3.select('#chart-step-1').style('padding-bottom')))
    .margins(50)
    .color.palette('#f5f5f5')
    .lineColor('#000')
    .opacity(1)
    .leftAxis.hideAxisLine(true)
    .leftAxis.values([])
    .bottomAxis.hideAxisLine(true)
    .bottomAxis.values([])
    .render()
})()
