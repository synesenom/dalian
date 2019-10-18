exports.config = {
  root: '../../../../docs/demo',
  name: '@dalian/widget-line-chart',
  libs: [
      'd3.v5.min.js',
      'd3-interpolate-path.min.js',
      'demo.js'
  ],
  dalian: [
    '../../../core/dist/dalian.core.min.js',
    '../../../components/chart/dist/dalian.component-chart.min.js',
    '../dist/dalian.widget-line-chart.min.js'
  ],
  content: 'content.js',
  styles: [
    'style.css'
  ]
}
