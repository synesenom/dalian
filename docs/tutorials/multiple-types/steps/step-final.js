(async () => {
  // Fetch our data.
  const raw = await fetch('https://gist.githubusercontent.com/synesenom/38f6ac1567aab8dba68b0dbf476d8a71/raw/monthly-temperature-anomaly.csv')
    .then(response => response.text())
  const values = raw.split('\n')
    .map(d => {
      // For this guide's purpose, let's extract the year and anomaly
      // value only.
      const cols = d.split(',')
      return {
        x: +cols[0],
        y: +cols[2]
      }
    })

  // Add scatter plot.
  const scatter = dalian.ScatterPlot('chart-step-final', '#chart-step-final')
    .data([{
      name: 'monthly',
      values
    }])

    // Read dimensions from the container.
    .width(parseFloat(d3.select('#chart-step-final').style('width')))
    .height(parseFloat(d3.select('#chart-step-final').style('padding-bottom')))
    .margins(50)

    // Set color to grayish, add some opacity and set dot size.
    .color.palette('LightSlateGrey')
    .opacity(0.1)
    .size(4)

    // Set up axes.
    .leftAxis.label('Time [year]')
    .bottomAxis.label('Anomaly [%]')

    .render()

  // STEP 2

  // Calculate yearly average. We are using d3.nest to quickly aggregate yearly values.
  const trend = d3.nest()
    .key(d => d.x)
    .rollup(v => d3.mean(v, d => d.y))
    .entries(values)
    .map(d => Object.assign(d.value, {
      x: +d.key,
      y: d.value
    }))

  // STEP 3
  // Add trend.
  const line = dalian.LineChart('chart-step-final-trend', '#chart-step-final')
    .data([{
      name: 'trend',
      values: trend
    }])

    // Read dimensions from the container.
    .width(parseFloat(d3.select('#chart-step-final').style('width')))
    .height(parseFloat(d3.select('#chart-step-final').style('padding-bottom')))
    .margins(50)

    // Set color to grayish, add some opacity and set dot size.
    .color.palette('firebrick')

    // Set up axes.
    .leftAxis.label('Time [year]')
    .bottomAxis.label('Anomaly [%]')

    .smoothing(true)
    .render()

  // STEP 4
  const range = d3.extent(trend, d => d.y)
  scatter.yRange.min(range[0])
    .yRange.max(range[1])
    .yRange.compressMin(0.1)
    .yRange.compressMax(0.1)
    .render()
  line.yRange.min(range[0])
    .yRange.max(range[1])
    .yRange.compressMin(0.1)
    .yRange.compressMax(0.1)
    .render()

  // STEP 5
  line.leftAxis.hideAxisLine(true)
    .leftAxis.hideTicks(true)
    .leftAxis.label('')
    .bottomAxis.hideAxisLine(true)
    .bottomAxis.hideTicks(true)
    .bottomAxis.label('')
    .render()
  scatter.tooltip.on(true)
    .render()

  // STEP 6
})()
