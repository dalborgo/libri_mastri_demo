import * as React from 'react'
import * as PropTypes from 'prop-types'
import clsx from 'clsx'
import { withStyles } from '@material-ui/core/styles'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import { IconButton, TableCell } from '@material-ui/core'

const styles = theme => ({
  toggleCell: {
    textAlign: 'center',
    textOverflow: 'initial',
    paddingTop: 1,
    paddingBottom: 0,
    paddingLeft: theme.spacing(1),
  },
  toggleCellButton: {
    height: theme.spacing(5),
    width: theme.spacing(5),
  },
})

const TableDetailToggleCellBase = ({
  style,
  expanded,
  classes,
  onToggle,
  tableColumn,
  tableRow,
  row,
  className,
  ...restProps
}) => {
  const handleClick = event => {
    event.stopPropagation()
    onToggle()
  }
  if (row.children || row.state === 'ADDED' || (row.state === 'ADDED_CONFIRMED' && row?.attachments?.length)) {
    return (
      <TableCell
        className={clsx(classes.toggleCell, className)}
        style={style}
        {...restProps}
      >
        <IconButton
          className={classes.toggleCellButton}
          onClick={handleClick}
          title={row.children ? 'Pannello dello storico' : 'Allegati inclusione'}
        >
          {expanded ? <ExpandLess/> : <ExpandMore/>}
        </IconButton>
      </TableCell>
    )
  } else {
    return (
      <TableCell
        className={className}
        style={style}
        {...restProps}
      />
    )
  }
}

TableDetailToggleCellBase.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  expanded: PropTypes.bool,
  onToggle: PropTypes.func,
  row: PropTypes.object,
  style: PropTypes.object,
  tableColumn: PropTypes.object,
  tableRow: PropTypes.object,
}

TableDetailToggleCellBase.defaultProps = {
  style: null,
  expanded: false,
  onToggle: () => {},
  className: undefined,
  tableColumn: undefined,
  tableRow: undefined,
  row: undefined,
}

const TableDetailToggleCell = withStyles(styles, {
  name: 'TableDetailToggleCell',
})(TableDetailToggleCellBase)

export default TableDetailToggleCell
