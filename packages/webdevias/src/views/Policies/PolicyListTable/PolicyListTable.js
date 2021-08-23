import React, { useMemo } from 'react'
import { Paper } from '@material-ui/core'
import { IntegratedPaging, PagingState, RowDetailState } from '@devexpress/dx-react-grid'
import { Grid, PagingPanel, Table, TableHeaderRow, TableRowDetail } from '@devexpress/dx-react-grid-material-ui'
import { DateTypeProvider } from 'helpers/tableFormatters'
import Button from '@material-ui/core/Button'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles'
import { ME } from 'queries/users'
import { mdiContentCopy, mdiDelete, mdiDotsVertical, mdiUpdate } from '@mdi/js'
import { useApolloClient } from '@apollo/react-hooks'
import { getPolicyState } from 'helpers'
import TableDetailToggleCell from 'helpers/tableFormatters/TableDetailToggleCellBase'
import { HeaderDetailCell } from './cellFormatters'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Icon from '@mdi/react'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import { grey } from '@material-ui/core/colors'

const styles = theme => ({
  tableCell: {
    padding: theme.spacing(1),
    minWidth: 200,
  },
  actionButton: {
    margin: theme.spacing(0, 0.5),
  },
  pagingContainer: {
    padding: 0,
    height: 35,
    backgroundColor: '#fafafa',
  },
  paperMenu: {
    backgroundColor: theme.palette.grey[200],
  },
  actionDetailButton: {},
})
const getRowId = row => row.id
const columns = [
  { name: 'number', title: 'Numero' },
  { name: 'initDate', title: 'Data decorrenza' },
  { name: 'createdBy', title: 'Creata da', getCellValue: ({ createdBy }) => createdBy?.username },
  { name: 'producer', title: 'Intermediario', getCellValue: ({ producer }) => producer?.username },
  { name: 'subAgent', title: 'Filiale', getCellValue: ({ subAgent }) => subAgent?.username },
  { name: 'signer', title: 'Contraente', getCellValue: ({ signer }) => signer?.surname },
  { name: 'state', title: 'Stato' },
  { name: 'action', title: 'Azioni' },
]
const tableColumnExtensions = [
  { columnName: 'number', align: 'center' },
  { columnName: 'initDate', align: 'center' },
  { columnName: 'createdBy', align: 'center' },
  { columnName: 'producer', align: 'center' },
  { columnName: 'subAgent', align: 'center' },
  { columnName: 'signer', align: 'center' },
  { columnName: 'state', align: 'center' },
  { columnName: 'action', align: 'center', width: '20%' },
]

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: grey[200],
    },
  },
})
const messages = { noData: 'Nessun risultato' }
const dateColumns = ['initDate']

const detailColumns = [
  { name: 'id', title: 'Revisione' },
  { name: 'action', title: ' ' },
]
const tableDetailColumnExtensions = [
  { columnName: 'id', align: 'left', width: 120 },
  { columnName: 'action', align: 'left' },
]

const pagingMessages = {
  showAll: 'Mostra tutto',
  rowsPerPage: 'Righe per pagina',
  info: '{from}-{to} a {count}',
}

const pagingComponent = withStyles(styles)(({ classes, ...rest }) => {
  return (
    <PagingPanel.Container {...rest} className={classes.pagingContainer}/>
  )
})

const DetailCell = withStyles(styles)(props_ => {
  const { column, row: { id: policyId } } = props_
  const { classes, ...rest } = props_
  switch (column.name) {
    case 'action':
      return (
        <Table.Cell
          {...rest}
          className={classes.tableCell}
        >
          <Button
            className={classes.actionDetailButton}
            color="primary"
            component={RouterLink}
            size="small"
            to={`/policies/edit/${policyId}/all`}
            variant="outlined"
          >
            Apri
          </Button>
        </Table.Cell>
      )
    default:
      return (
        <Table.Cell
          {...rest}
          className={classes.tableCell}
        />
      )
  }
})

const GridDetailContainerBase = ({ row: { children } }) => {
  if (children) {
    return (
      <Paper>
        <Grid
          columns={detailColumns}
          rows={children}
        >
          <DateTypeProvider
            for={dateColumns}
          />
          <Table
            cellComponent={DetailCell}
            columnExtensions={tableDetailColumnExtensions}
          />
          <TableHeaderRow
            cellComponent={HeaderDetailCell}
          />
        </Grid>
      </Paper>
    )
  } else {
    return <span>History vuota!</span>
  }
}

const RowMenu = props => {
  const { onDelete, onClone, onUpdate, allowDelete, policyId, classes } = props
  const [anchorEl, setAnchorEl] = React.useState(null)
  const { pathname } = useLocation()
  const isQuotation = pathname === '/policies/doclist'
  const handleClick = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <>
      <ThemeProvider theme={theme}>
        <Button
          aria-controls={`row-menu-${policyId}`}
          aria-haspopup="true"
          className={classes.actionButton}
          color="secondary"
          onClick={handleClick}
          size="small"
          style={{ paddingTop: 3, paddingBottom: 2 }}
          variant="contained"
        >
          <Icon path={mdiDotsVertical} size={1}/>
        </Button>
      </ThemeProvider>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={
          {
            horizontal: 'right',
            vertical: 'top',
          }
        }
        classes={
          {
            paper: classes.paperMenu,
          }
        }
        disableAutoFocusItem
        getContentAnchorEl={null}
        id={`row-menu-${policyId}`}
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {!isQuotation &&
         <MenuItem
           onClick={
             () => {
               onUpdate()
               handleClose()
             }
           }
         >
           <ListItemIcon>
             <Icon path={mdiUpdate} size={1}/>
           </ListItemIcon>
           Rinnova
         </MenuItem>
        }
        <MenuItem
          onClick={
            () => {
              onClone()
              handleClose()
            }
          }
        >
          <ListItemIcon>
            <Icon path={mdiContentCopy} size={1}/>
          </ListItemIcon>
          Clona
        </MenuItem>
        {
          allowDelete &&
          <MenuItem onClick={onDelete} style={{ color: 'red' }}>
            <ListItemIcon>
              <Icon color="red" path={mdiDelete} size={1}/>
            </ListItemIcon>
            Elimina
          </MenuItem>
        }
      </Menu>
    </>
  )
}

const PolicyListTable = props => {
  const { deletePolicy, clonePolicy, updatePolicy, rows } = props
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  /*const changeSelection = useMemo(() => selection_ => {
    const lastSelected = selection_.find(selected => selection.indexOf(selected) === -1)
    if (lastSelected !== undefined) {
      setSelection([lastSelected])
    } else {
      setSelection([])
    }
  }, [selection, setSelection])*/
  const Cell = useMemo(() => withStyles(styles)(props_ => {
    const { column, row: { __typename, state, id: policyId, top, meta, number } } = props_
    const { classes, ...rest } = props_
    const allowDelete = (!top && !meta?.toDoc && !state?.isPolicy && priority === 3) || state?.code === 'DRAFT' || meta?.modified === true
    switch (column.name) {
      case 'state':
        return (
          <Table.Cell
            {...rest}
            className={classes.tableCell}
          >
            {getPolicyState(state, meta, top, priority)}
          </Table.Cell>
        )
      case 'action':
        return (
          <Table.Cell
            {...rest}
            className={classes.tableCell}
          >
            {/* <ThemeProvider theme={theme}>
              <Button
                className={classes.actionButton}
                color="secondary"
                onClick={deletePolicy(policyId, __typename)}
                size="small"
                style={
                  {{
                    visibility: allowDelete ? 'visible' : 'hidden',
                  }
                }
                variant="contained"
              >
                Elimina
              </Button>
            </ThemeProvider>*/}
            <RowMenu
              allowDelete={allowDelete}
              classes={classes}
              onClone={clonePolicy(policyId)}
              onDelete={deletePolicy(policyId, number, __typename)}
              onUpdate={updatePolicy(policyId)}
              policyId={policyId}
            />
            <Button
              className={classes.actionButton}
              color="primary"
              component={RouterLink}
              size="small"
              to={state?.isPolicy ? `/policies/editpolicy/${policyId}/all` : `/policies/edit/${policyId}/all`}
              variant="contained"
            >
              Apri
            </Button>
          </Table.Cell>
        )
      default:
        return (
          <Table.Cell
            {...rest}
            className={classes.tableCell}
          />
        )
    }
  }), [clonePolicy, deletePolicy, priority, updatePolicy])
  return (
    <Paper>
      <Grid
        columns={columns}
        getRowId={getRowId}
        rows={rows}
      >
        <PagingState
          defaultCurrentPage={0}
          pageSize={15}
        />
        <RowDetailState/>
        <DateTypeProvider
          for={dateColumns}
        />
        {/*<SelectionState
          onSelectionChange={changeSelection}
          selection={selection}
        />*/}
        <IntegratedPaging/>
        <Table
          cellComponent={Cell}
          columnExtensions={tableColumnExtensions}
          messages={messages}
        />
        <TableHeaderRow/>
        {/* <TableSelection
          highlightRow
          selectByRowClick
          showSelectionColumn={false}
        />*/}
        <TableRowDetail
          contentComponent={GridDetailContainerBase}
          toggleCellComponent={TableDetailToggleCell}
          toggleColumnWidth={0}
        />
        <PagingPanel
          containerComponent={pagingComponent}
          messages={pagingMessages}
        />
      </Grid>
    </Paper>
  )
}

export default PolicyListTable
