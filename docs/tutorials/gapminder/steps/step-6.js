(async() => {
  // Load data and continents.
  const data = await d3.json('data.json')
  const continents = await d3.json('continents.json')

  // Map continents to list of countries.
  const countries = Object.entries(continents).reduce((map, d) => {
    if (!map.has(d[1])) {
      map.set(d[1], [])
    }
    map.get(d[1]).push(d[0])
    return map
  }, new Map())

  // Add static chart.
  const chart = dalian.BubbleChart('chart-step-6', '#chart-step-6')
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
    .width(parseFloat(d3.select('#chart-step-6').style('width')))
    .height(0.9 * parseFloat(d3.select('#chart-step-6').style('padding-bottom')))
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

    // Set fixed ranges.
    .xRange.min(Math.log10(300))
    .xRange.max(Math.log10(2e5))
    .yRange.min(15)
    .yRange.max(90)

    .radius(2.5e-8 * data[1950].find(d => d.name === 'China').value.size)
    .render()

  // Add slider.
  dalian.Slider('slider-step-6', '#chart-step-6')
    // Adjusting slider position and size.
    .y(0.8 * parseFloat(d3.select('#chart-step-6').style('padding-bottom')))
    .width(parseFloat(d3.select('#chart-step-6').style('width')))
    .height(0.2 * parseFloat(d3.select('#chart-step-6').style('padding-bottom')))
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
      })))
        .radius(2.5e-8 * data[year].find(d => d.name === 'China').value.size)
        .render(100)
    })
    .render()

  // Add legend.
  const legend = dalian.Legend('legend-step-6', '#chart-step-6')
    .width(200)
    .height(100)
    .font.size(10)
    .entries(['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'])
    .color.palette({
      'Africa': '#4477aa',
      'Asia': '#66ccee',
      'Europe': '#228833',
      'North America': '#ccbb44',
      'Oceania': '#ee6677',
      'South America': '#aa3377'
    })

    // Highlight continents on hover.
    .mouse.over(d => {
      legend.highlight(d, 100)
      chart.highlight(countries.get(d), 100)
    })
    .mouse.leave(() => {
      legend.highlight(null, 100)
      chart.highlight(null, 100)
    })

    // Insert in the chart.
    .insert(chart, {
      x: parseFloat(d3.select('#chart-step-6').style('width')) - 200,
      y: parseFloat(d3.select('#chart-step-6').style('padding-bottom')) - 240
    })
    .render()
})()
