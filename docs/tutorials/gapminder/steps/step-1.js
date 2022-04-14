(async () => {
  // Load data.
  const data = await d3.json('data.json')

  // Add static chart.
  const chart = dalian.BubbleChart('chart-step-1', '#chart-step-1')
    // Bind data.
    .data(data[1950])

    // Read dimensions from the container.
    .width(parseFloat(d3.select('#chart-step-1').style('width')))
    .height(parseFloat(d3.select('#chart-step-1').style('padding-bottom')))
    .margins(50)

    // Initialize axes.
    .leftAxis.label('Life expectancy')
    .bottomAxis.label('GDP per capita')
    .render()
})()
