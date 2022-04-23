(async () => {
  // Load data and continents.
  const data = await d3.json('data.json')
  const continents = await d3.json('continents.json')

  // Add static chart.
  const chart = dalian.BubbleChart('chart-step-5', '#chart-step-5')
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
    .width(parseFloat(d3.select('#chart-step-5').style('width')))
    .height(parseFloat(d3.select('#chart-step-5').style('padding-bottom')))
    .margins(50)

    // Set a nice color palette from https://personal.sron.nl/~pault/ and assign colors by continent.
    .color.palette({
      Africa: '#4477aa',
      Asia: '#66ccee',
      Europe: '#228833',
      'North America': '#ccbb44',
      Oceania: '#ee6677',
      'South America': '#aa3377'
    })
    .color.on(d => continents[d.name])

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

    // Add tooltip. Each entry is formatted differently.
    .tooltip.on(true)
    .tooltip.labelFormat(d => d === 'size' ? 'Population:' : d + ':')
    .tooltip.valueFormat((d, label) => {
      switch (label) {
        case 'GDP per capita':
          return `$${Math.round(Math.pow(10, d))}`
        case 'Life expectancy':
          return d.toFixed(1)
        case 'size':
          if (d < 1e3) {
            return d
          }
          if (d < 1e6) {
            return (d / 1e3).toFixed(1) + 'k'
          }
          if (d < 1e9) {
            return (d / 1e6).toFixed(1) + 'M'
          }
          return (d / 1e9).toFixed(1) + 'B'
        default:
          return d
      }
    })

    // Highlight bubble on hover.
    .mouse.over(d => chart.highlight(d.name))
    .mouse.leave(() => chart.highlight(null))
    .render()

  // Add slider.
  dalian.Slider('slider-step-5', '#chart-step-5')
    // Adjusting slider position and size.
    .y(0.9 * parseFloat(d3.select('#chart-step-5').style('padding-bottom')))
    .width(parseFloat(d3.select('#chart-step-5').style('width')))
    .height(0.2 * parseFloat(d3.select('#chart-step-5').style('padding-bottom')))
    .margins(50)
    .min(1950)
    .max(2019)
    .step(1)
    .callback(year => {
      // Update chart data.
      chart.data(data[year].map(d => ({
        name: d.name,
        value: {
          x: Math.log10(d.value.x),
          y: d.value.y,
          size: d.value.size
        }
      }))).render(100)
    })
    .render()
})()
