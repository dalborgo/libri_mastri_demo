import React, { memo, useCallback, useEffect, useState } from 'react'
import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import { Cell, HeaderCell } from './cellFormatters'
import { DateTypeProvider, TextTypeProvider } from 'helpers/tableFormatters'
import { Button, IconButton, ListItemIcon, Menu, MenuItem, Paper, Tooltip } from '@material-ui/core'
import { checkRegulation } from 'utils/axios'
import {
  mdiFileCertificateOutline,
  mdiFilePdf,
  mdiFilePdfBox,
  mdiMenu,
  mdiTextBoxCheck,
  mdiTimerSandEmpty,
} from '@mdi/js'
import Icon from '@mdi/react'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries/users'
import moment from 'moment'

// eslint-disable-next-line react/display-name
const ActionMenu = memo(props => {
  const { row, handlePrint, setRegsChecked, regsChecked, regCounter } = props
  const [anchorEl, setAnchorEl] = React.useState(null)
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const isBefore = moment().isBefore(moment(row.endDate))
  const prevIsEmitted = regCounter === 1 || regsChecked?.[regCounter - 1]
  const hasConsolidate = props.priority === 4 && props.isRecalculateFraction === 'SI' && props.toCon
  const hasRegEmit = !regsChecked?.[regCounter] && !isBefore && prevIsEmitted
  return (
    <div>
      <Button
        aria-controls="action-menu"
        disabled={!(hasConsolidate || hasRegEmit)}
        disableFocusRipple
        onClick={handleClick}
        size="small"
      >
        <Icon path={mdiMenu} size={0.8}/>
      </Button>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={
          {
            horizontal: 'left',
            vertical: 'bottom',
          }
        }
        getContentAnchorEl={null}
        id="action-menu"
        keepMounted
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {
          hasConsolidate &&
          <MenuItem
            onClick={
              () => {
                props.consolidatePolicy('', row.startDate, row.endDate, row.hasRegulation, regCounter)
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiTextBoxCheck} size={1}/>
            </ListItemIcon>
            Consolida
          </MenuItem>
        }
        {
          hasRegEmit &&
          <MenuItem
            onClick={
              async () => {
                const value = await props.checkPolicy()
                if (!value) {
                  handlePrint('regulation', row.startDate, row.endDate, row.hasRegulation, props.regCounter, true)()// ok
                  setRegsChecked({ ...regsChecked, [regCounter]: true })
                  handleClose()
                }
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiFileCertificateOutline} size={1}/>
            </ListItemIcon>
            Emetti regolazione
          </MenuItem>
        }
      </Menu>
    </div>
  )
})

//const getRowId = row => row.startDate
const messages = { noData: 'Nessun risultato' }
const RegulationTable = props => {
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const { isPolicy, handlePrint, consolidatePolicy, fractions: rows, isRecalculateFraction, code, checkPolicy } = props
  const columns = [
    { name: 'startDate', title: 'Inizio' },
    { name: 'endDate', title: 'Fine' },
    { name: 'daysDiff', title: 'Giorni' },
    { name: 'hasRegulation', title: 'Ricalcola rate', getCellValue: row => row.hasRegulation },
  ]
  const tableColumnExtensions = [
    { columnName: 'startDate', align: 'center' },
    { columnName: 'endDate', align: 'center' },
    { columnName: 'daysDiff', align: 'center' },
    { columnName: 'hasRegulation', align: 'center' },
    { columnName: 'print', align: 'center' },
    { columnName: 'action', align: 'center' },
  ]
  const [dateColumns] = useState(['startDate', 'endDate'])
  const [textColumns] = useState(['daysDiff'])
  if (isPolicy) {
    columns.splice(4, 0, { name: 'print', title: 'Stampe' })
    columns.splice(5, 0, { name: 'action', title: 'Azione' })
  }
  const [regsChecked, setRegsChecked] = useState(null)
  useEffect(() => {
    async function fetchData () {
      const { ok, message, results } = await checkRegulation(
        'files/check_regulations',
        {
          code,
          count: rows.length,
        }
      )
      if (!ok) {console.error(message)}
      setRegsChecked(ok ? results : [])
    }
    
    fetchData().then()
  }, [code, rows.length])
  
  const CustomCell = useCallback(props => {
    const { column, row, tableRow } = props
    const regCounter = 1 + Number(tableRow.key.split('_')[1])
    //const diff = moment().diff(row.endDate)
    const toCon = moment(row.toCon).isSame(row.startDate) || (row.toCon === undefined && tableRow.rowId === 0)
    const toRec = (row.toCon && moment(row.toCon).isSameOrAfter(row.startDate)) || (row.toCon === undefined && tableRow.rowId === 0)
    if (column.name === 'print') {
      return (
        <Table.Cell
          {...props}
        >
          {
            (priority === 4) &&
            <Tooltip placement="top" title="Regolazione">
              <IconButton
                onClick={handlePrint('regulation', row.startDate, row.endDate, row.hasRegulation, regCounter)}
                style={{ padding: 3 }}
              >
                {
                  regsChecked === null ?
                    <Icon path={mdiTimerSandEmpty} size={1}/>
                    :
                    regsChecked[regCounter] ?
                      <Icon color="red" path={mdiFilePdfBox} size={1}/>
                      :
                      <Icon
                        path={mdiFilePdfBox}
                        size={1}
                      />
                }
              </IconButton>
            </Tooltip>
          }
          {
            (priority === 4 && isRecalculateFraction === 'SI' && regCounter > 1) &&//(priority === 4 && isRecalculateFraction === 'SI' && toRec) &&
            <Tooltip placement="top" title="Quietanza">
              <IconButton
                onClick={
                  handlePrint(
                    'receipt', 
                    rows[regCounter - 2].startDate, 
                    rows[regCounter - 2].endDate, 
                    rows[regCounter - 2].hasRegulation, 
                    regCounter - 1)
                }
                style={{ padding: 3 }}
              >
                <Icon path={mdiFilePdf} size={1}/>
              </IconButton>
            </Tooltip>
          }
        </Table.Cell>
      )
    }
    if (column.name === 'action') {
      return (
        <Table.Cell
          {...props}
        >
          <ActionMenu
            checkPolicy={checkPolicy}
            consolidatePolicy={consolidatePolicy}
            handlePrint={handlePrint}
            isRecalculateFraction={isRecalculateFraction}
            priority={priority}
            regCounter={regCounter}
            regsChecked={regsChecked}
            row={row}
            setRegsChecked={setRegsChecked}
            toCon={toCon}
          />
        </Table.Cell>
      )
    }
    return <Cell {...props}/>
  }, [priority, handlePrint, regsChecked, isRecalculateFraction, rows, checkPolicy, consolidatePolicy])
  /* const commandComponent = useCallback(props => {
     const { id } = props
     const CommandButton = commandComponents[id]
     return <CommandButton {...props} />
   }, [])*/
  // eslint-disable-next-line react/display-name
  /*const commitChanges = useCallback(({ changed }) => {
    let changedRows
    let hasChanged = false
    if (changed) {
      changedRows = rows.map(row => {
        if (!changed[row.startDate]) {return row}
        hasChanged |= true
        let updateRow = {
          ...row,
          ...changed[row.startDate],
        }
        return updateRow
      })
    }
    hasChanged && dispatch({ type: 'setRegFractions', regFractions: changedRows })
  }, [dispatch, rows])*/
  return (
    <Paper style={{ width: 800, marginBottom: 10 }}>
      <Grid
        columns={columns}
        rows={rows}
      >
        <DateTypeProvider
          for={dateColumns}
        />
        <TextTypeProvider
          for={textColumns}
        />
        <Table
          cellComponent={CustomCell}
          columnExtensions={tableColumnExtensions}
          messages={messages}
        />
        <TableHeaderRow cellComponent={HeaderCell}/>
      </Grid>
    </Paper>
  )
}

export default memo(RegulationTable)
