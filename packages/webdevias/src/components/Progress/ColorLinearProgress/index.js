import { withStyles } from '@material-ui/core/styles'
import { LinearProgress } from '@material-ui/core'

const ColorLinearProgress = withStyles({
  colorPrimary: {
    backgroundColor: 'red',
  },
  bar1Indeterminate: {
    backgroundColor: 'black',
  },
  bar2Indeterminate: {
    backgroundColor: 'yellow',
  },
})(LinearProgress)

export default ColorLinearProgress
