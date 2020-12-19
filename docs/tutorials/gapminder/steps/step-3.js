(async() => {
  // Load data and continents.
  const data = await d3.json('data.json')
  const continents = await d3.json('continents.json')

  // Add static chart.
  const chart = dalian.BubbleChart('chart-step-3', '#chart-step-3')
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
    .width(parseFloat(d3.select('#chart-step-3').style('width')))
    .height(parseFloat(d3.select('#chart-step-3').style('padding-bottom')))
    .margins(50)

    // Set a nice color palette from https://personal.sron.nl/~pault/ and assign colors by continent.
    .color.palette({
      'Africa': '#4477aa',
      'Asia': '#66ccee',
      'Europe': '#228833',
      'North America': '#ccbb44',
      'Oceania': '#ee6677',
      'South America': '#aa3377'
    })
    .color.on(d => continents[d.name])

    // Initialize axes.
    .leftAxis.label('Life expectancy')
    .bottomAxis.label('GDP per capita')
    .bottomAxis.format(x => {
      if (x < 3) {
        return `$${Math.round(Math.pow(10, x))}`
      }  else {
        return `$${Math.round(Math.pow(10, x - 3))}k`
      }
    })
    .render()
})()
