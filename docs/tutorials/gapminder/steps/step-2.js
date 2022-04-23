(async () => {
  // Load data.
  const data = await d3.json('data.json')

  // Add static chart.
  const chart = dalian.BubbleChart('chart-step-2', '#chart-step-2')
    // Bind data.
    .data(data[1950].map(d => ({
      name: d.name,
      value: {
        x: Math.log10(d.value.x),
        y: d.value.y,
        size: d.value.size
      }
    })))

    // Read dimensions from the container.
    .width(parseFloat(d3.select('#chart-step-2').style('width')))
    .height(parseFloat(d3.select('#chart-step-2').style('padding-bottom')))
    .margins(50)

    // Initialize axes.
    .leftAxis.label('Life expectancy')
    .bottomAxis.label('GDP per capita')
    .bottomAxis.format(x => {
      if (x < 3) {
        return `$${Math.round(Math.pow(10, x))}`
      } else {
        return `$${Math.round(Math.pow(10, x - 3))}k`
      }
    })
    .render()
})()
