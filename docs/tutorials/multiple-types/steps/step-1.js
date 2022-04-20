(async () => {
  // Fetch data.
  const raw = await fetch('https://gist.githubusercontent.com/synesenom/38f6ac1567aab8dba68b0dbf476d8a71/raw/monthly-temperature-anomaly.csv')
    .then(response => response.text())
  const data = raw.split('\n')
    .map(d => {
      const cols = d.split(',')
      return {
        x: +cols[0],
        y: +cols[2]
      }
    })

  // Add scatter plot.
  const scatter = dalian.ScatterPlot('monthly-step-1', '#chart-step-1')
    .data([{
      name: 'monthly',
      values: data
    }])
    .width(parseFloat(d3.select('#chart-step-1').style('width')))
    .height(parseFloat(d3.select('#chart-step-1').style('padding-bottom')))
    .margins(50)
    .color.palette('#789')
    .opacity(0.1)
    .size(4)
    .leftAxis.label('Anomaly [%]')
    .bottomAxis.label('Time [year]')
    .render()
})()
