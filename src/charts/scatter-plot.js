import Scale from '../components/scale'
import compose from '../core/compose'
import Chart from '../components/chart'
import LineStyle from '../components/line-style'
import PlotMarker from '../components/plot-marker'
import Smoothing from '../components/smoothing'
import PointTooltip from '../components/tooltip/point-tooltip'
import Highlight from '../components/highlight'
import TrendMarker from '../components/trend'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'

export default (name, parent) => {
  let scales = {
    x: Scale('band'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('line-chart', name, parent, 'svg'),
    PointTooltip,
    Highlight,
    (s, a) => LeftAxis(s, a,'y', scales.y),
    (s, a) => BottomAxis(s, a, 'x', scales.x)
  )

  // Private members
  let _ = {
    // Variables
    scales,

    // Methods
    update: duration => {}
  }

  // Overrides
  self._highlight.container = self._chart.plots
}
