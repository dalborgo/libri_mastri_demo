import palette from '../palette'
import typography from '../typography'

export default {
  root: {
    ...typography.body1,
    borderBottom: `1px solid ${palette.divider}`,
    paddingBottom: 5,
    paddingTop: 5,
  },
}
