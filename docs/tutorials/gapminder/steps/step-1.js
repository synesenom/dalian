(async () => {
  // Load data and continents.
  const {data, continents} = await fetch('https://gist.githubusercontent.com/synesenom/794bc8ad12b91f27d5934604361ff0b5/raw/dalian-tutorial-gapminder.json').then(response => response.json())

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
