(async () => {
  // Fetch data.
  const raw = await fetch('https://gist.githubusercontent.com/synesenom/38f6ac1567aab8dba68b0dbf476d8a71/raw/monthly-temperature-anomaly.csv')
    .then(response => response.text())
  const data = raw.split('\n')
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
  const scatter = dalian.ScatterPlot('monthly-step-2', '#chart-step-2')
    .data([{
      name: 'monthly',
      values: data
    }])
    .width(parseFloat(d3.select('#chart-step-2').style('width')))
    .height(parseFloat(d3.select('#chart-step-2').style('padding-bottom')))
    .margins(50)
    .color.palette('#789')
    .opacity(0.1)
    .size(4)
    .leftAxis.label('Anomaly [%]')
    .bottomAxis.label('Time [year]')
    .render()

  // Calculate trend.
  const trend = d3.nest()
    .key(d => d.x)
    .rollup(v => d3.mean(v, d => d.y))
    .entries(data)
    .map(d => Object.assign(d.value, {
      x: +d.key,
      y: d.value
    }))

  // Add trend.
  const line = dalian.LineChart('trend-step-2', '#chart-step-2')
    .data([{
      name: 'trend',
      values: trend
    }])
    .width(parseFloat(d3.select('#chart-step-2').style('width')))
    .height(parseFloat(d3.select('#chart-step-2').style('padding-bottom')))
    .margins(50)
    .color.palette('firebrick')
    .render()
})()
