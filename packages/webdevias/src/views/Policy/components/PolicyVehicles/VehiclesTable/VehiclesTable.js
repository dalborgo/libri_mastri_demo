import {
  EditingState,
  IntegratedFiltering,
  IntegratedSummary,
  RowDetailState,
  SearchState,
  SummaryState,
} from '@devexpress/dx-react-grid'
import { Getter, Plugin } from '@devexpress/dx-react-core'
import {
  Grid,
  SearchPanel,
  TableColumnVisibility,
  TableEditColumn,
  TableEditRow,
  TableFixedColumns,
  TableHeaderRow,
  TableRowDetail,
  TableSummaryRow,
  Toolbar,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui'
import { Container, Paper } from '@material-ui/core'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { calculatePaymentTable, calculatePaymentTable2, calculatePrizeTable, getPolicyEndDate } from 'helpers'
import {
  DateTypeProvider,
  NumberTypeProvider,
  SearchInput,
  TextTypeProvider,
  TimeTextTypeProvider,
} from 'helpers/tableFormatters'
import { BooleanTypeProvider, commandComponents, MenuTypeProvider, TitleComponent } from './customFormatters'
import { Cell, FastBaseCell, LookupEditCell, RootToolbar } from './cellFormatters'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import uuid from 'uuid/v1'
import { controlRow } from './validation'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { useParams } from 'react-router-dom'
import { AutoSizer } from 'react-virtualized'
import find from 'lodash/find'
import TableDetailToggleCell from 'helpers/tableFormatters/TableDetailToggleCellBase'
import RowAttachmentsComponent from './RowAttachmentsComponent'

function getVehicleId ({ licensePlate, state, counter }) {
  return licensePlate && state ? `${licensePlate}#${state}#${counter}` : uuid()
}

const getRowId = getVehicleId
const Root = props => <Grid.Root {...props} style={{ height: '100%' }}/>
const VirtuaComponent = props => (
  <VirtualTable.Container {...props} className="scrollbar" id="vehicleTable"/>
)

const summaryCalculator = (type, rows, getValue) => {
  switch (type) {
    case 'tot_value':
      return rows.reduce((acc, curr) => acc + numeric.toFloat(curr.value), 0)
    case 'euro_sum':
      return IntegratedSummary.defaultCalculator('sum', rows, getValue)
    default:
      return IntegratedSummary.defaultCalculator(type, rows, getValue)
  }
}

const pluginDependencies = [{ name: 'TableEditRow' }]

const tableColumnsComputed = ({ tableBodyRows, addedRows }) => {
  const addedRowsCount = addedRows.length
  if (!addedRows.length) { return tableBodyRows }
  const nextTableBodyRows = tableBodyRows.slice(addedRowsCount)
  nextTableBodyRows.push(...tableBodyRows.slice(0, addedRowsCount).reverse())
  return nextTableBodyRows
}

const AddedRow = () => {
  return (
    <Plugin name="AddedRow" pluginDependencies={pluginDependencies}>
      <Getter computed={tableColumnsComputed} name="tableBodyRows"/>
    </Plugin>
  )
}

const getSearchFilter = hiddenColumnNames => hiddenColumnNames
  .map(columnName => ({
    columnName,
    predicate: () => false,
  }))
const messages = { noData: 'Nessun risultato' }
const messagesSummary = { count: 'Tot', sum: 'T', euro_sum: '€', tot_value: '€' }
const messagesPlaceholder = {
  searchPlaceholder: 'Cerca...',
}

const NoDataComponent = ({ getMessage, ...rest }) => (
  <VirtualTable.Cell
    {...rest}
    style={{ display: 'table-column' }}
  />
)

const VehiclesTable = props => {
  const {
    policy: { vehicles },
    policy,
    tablePd,
    dispatch,
    filtered,
    enqueueSnackbar,
    vehicleTypes,
    handlePrint,
    priority,
    taxableTotal,
    formRefHeader,
  } = props
  const rows = vehicles.filter(veh => {
    return !veh.escludi
  })
  const { tab } = useParams()
  const isPolicy = policy?.state?.isPolicy
  const updatePrize = useCallback(row => {
    return calculatePrizeTable(tablePd, policy, row, taxableTotal)
  }, [tablePd, policy, taxableTotal])
  const updatePayment = useCallback(row => {
    const { values: header } = formRefHeader.current || {}
    const isRecalculateFraction = header?.isRecalculateFraction || policy.isRecalculateFraction
    if (isRecalculateFraction === 'SI') {
      return calculatePaymentTable2(tablePd, policy, row, taxableTotal)
    } else {
      return calculatePaymentTable(tablePd, policy, row, taxableTotal)
    }
  }, [formRefHeader, policy, tablePd, taxableTotal])
  const extractError = useCallback(row => row.licensePlate && row.licensePlate.startsWith('XXXXXX') ? row.licensePlate.match('XXXXXX')[0] : row.licensePlate, [])
  const pdsObj = useMemo(() => {
    const { values: valuesTPd } = tablePd || {}
    return valuesTPd ? valuesTPd.productDefinitions : policy.productDefinitions
  }, [policy.productDefinitions, tablePd])
  const [exclusionTypeList] = useState(() => cFunctions.getExclusionTypeList())
  const productList = useMemo(() => {
    const init = vehicleTypes.reduce((prev, curr) => {
      prev[curr.id] = []
      return prev
    }, {})
    return pdsObj.reduce((prev, curr) => {
      curr.vehicleType && prev[curr.vehicleType].push(curr.productCode)
      return prev
    }, init)
  }, [pdsObj, vehicleTypes])
  const productListFlat = useMemo(() => {
    return pdsObj.reduce((prev, curr) => {
      curr.productCode && prev.push(curr.productCode)
      return prev
    }, [])
  }, [pdsObj])
  const vehicleList = useMemo(() => {
    const list = vehicleTypes.reduce((prev, curr) => {
      if (!curr.priority || curr.priority === priority) {
        prev.push(curr.key)
      }
      return prev
    }, [])
    return [...new Set(list)]
  }, [priority, vehicleTypes])
  const defaultVehicleCode = vehicleTypes[0].id
  const getProdCode = useCallback(row => {
    const list = productList[cFunctions.getVehicleCode(row.vehicleType, row.weight, vehicleTypes) || defaultVehicleCode]
    const product = row.productCode ? list.indexOf(row.productCode) > -1 ? row.productCode : list[0] : list[0]
    return product
  }, [defaultVehicleCode, productList, vehicleTypes])
  const formatBool = useCallback((row, column) => {
    const prop = column.replace('has', '').toLowerCase()
    const productCode = getProdCode(row)
    if (row[column] && row[column] !== 'NO') {
      const found = find(pdsObj, { productCode, vehicleType: row.vehicleType })
      if (found && numeric.toFloat(found?.[prop]) === 0) {
        return ' SI '
      } else {
        return 'SI'
      }
    } else {
      return 'NO'
    }
  }, [getProdCode, pdsObj])
  const getPdsData = useCallback((row, column) => {
    const productCode = getProdCode(row)
    const found = find(pdsObj, { productCode }) //vehicleType: row.vehicleType per ora facoltativo
    return found?.[column]
  }, [getProdCode, pdsObj])
  const vtRef = useRef(null)
  const columns = useMemo(() => {
    const columns = [
      { name: 'licensePlate', title: 'Targa', getCellValue: extractError },
      {
        name: 'productCode',
        title: 'Codice Prodotto',
        getCellValue: getProdCode,
      },
      { name: 'vehicleType', title: 'Tipo Veicolo' },
      {
        name: 'weight',
        title: 'Q.li/Kw/Posti',
      },
      { name: 'registrationDate', title: 'Data Imm.' },
      { name: 'brand', title: 'Marca' },
      { name: 'model', title: 'Modello' },
      {
        name: 'coverageType',
        title: 'Tipo Copertura',
        getCellValue: getPdsData,
      },
      { name: 'value', title: '€ Valore' },
      { name: 'hasGlass', title: 'Cristalli', getCellValue: formatBool },
      { name: 'hasTowing', title: 'Traino', getCellValue: formatBool },
      { name: 'leasingCompany', title: 'Società di Leasing' },
      { name: 'leasingExpiry', title: 'Scadenza Leasing' },
      { name: 'owner', title: 'Proprietario/Locatario' },
      {
        name: 'prize',
        title: taxableTotal ? '€ Premio Annuo Netto' : '€ Premio Annuo Lordo',
        getCellValue: updatePrize,
      },
    ]
    if (isPolicy) {
      columns.splice(0, 0, { name: 'state', title: 'Menu' })
      columns.splice(2, 0, { name: 'startDate', title: 'Data da' })
      columns.splice(3, 0, { name: 'startHour', title: 'Ora da' })
      columns.splice(4, 0, { name: 'finishDate', title: 'Data a' })
      columns.splice(5, 0, { name: 'exclusionType', title: 'Motivazione' })
      columns.splice(columns.length, 0, {
        name: 'payment',
        title: taxableTotal ? '€ Rateo Netto' : '€ Rateo Lordo',
        getCellValue: updatePayment,
      })
    }
    return columns
  }, [extractError, formatBool, getPdsData, getProdCode, isPolicy, taxableTotal, updatePayment, updatePrize])
  const [filteringColumnExtensions] = useState(
    getSearchFilter(['value', 'registrationDate', 'hasTowing', 'hasGlass', 'weight', 'prize', 'payment'])
  )
  
  const [numberColumns] = useState(['value', 'prize', 'weight', 'payment'])
  const [booleanColumns] = useState(['hasGlass', 'hasTowing'])
  const [textColumns] = useState(['licensePlate'])
  const [leftColumns] = useState(['state', 'licensePlate', 'startDate', 'startHour', 'finishDate', TableEditColumn.COLUMN_TYPE, TableRowDetail.COLUMN_TYPE])
  const [rightColumns] = useState(['prize', 'payment'])
  const [dateColumns] = useState(['registrationDate', 'leasingExpiry', 'finishDate', 'startDate'])
  const [hourColumns] = useState(['startHour'])
  const [menuColumns] = useState(['state'])
  const [tableColumnExtensions] = useState([
    { columnName: 'licensePlate', align: 'center' },
    { columnName: 'state', editingEnabled: false, width: 40 },
    { columnName: 'startDate', align: 'center', width: 120 },
    { columnName: 'startHour', align: 'center', width: 80 },
    { columnName: 'finishDate', align: 'center', width: 120 },
    { columnName: 'exclusionType', align: 'center' },
    { columnName: 'vehicleType', align: 'center' },
    { columnName: 'weight', align: 'right' },
    { columnName: 'registrationDate', align: 'center', width: 120 },
    { columnName: 'brand', align: 'center' },
    { columnName: 'model', align: 'center' },
    { columnName: 'productCode', align: 'center' },
    { columnName: 'coverageType', align: 'center', editingEnabled: false },
    { columnName: 'value', align: 'right' },
    { columnName: 'hasGlass', align: 'center' },
    { columnName: 'hasTowing', align: 'center' },
    { columnName: 'leasingExpiry', align: 'center', width: 120 },
    { columnName: 'prize', align: 'right', editingEnabled: false, width: 160 },
    { columnName: 'payment', align: 'right', editingEnabled: false, width: 140 },
  ])
  const [totalSummaryItems] = useState([
    { columnName: 'licensePlate', type: 'count' },
    { columnName: 'prize', type: 'euro_sum' },
    { columnName: 'value', type: 'tot_value' },
  ])
  const [defaultHiddenColumnNames] = useState(() => {
    //return priority === 3 ? [] : ['prize']
    //console.log('manage depending the priority', priority)
    return []
  })
  const scrollToRow = useCallback((rowId) => {
    vtRef.current.scrollToRow(rowId)
  }, [vtRef])
  
  const commitChanges = useCallback(({ added, changed, deleted }) => {
    let changedRows
    let hasChanged = false
    const defCommon = {
      state: isPolicy ? 'ADDED' : 'ACTIVE',
      finishDate: isPolicy ? cFunctions.calcPolicyEndDate(policy.initDate, policy.midDate) : undefined,
      vehicleType: 'AUTO',
      hasTowing: 'NO',
      hasGlass: 'NO',
      value: 0,
    }
    if (added) {
      hasChanged |= true
      const toAdded = added.reduce((prev, curr) => {
        const default_ = {
          ...defCommon,
          productCode: productList[cFunctions.getVehicleCode(curr.vehicleType, curr.weight, vehicleTypes) || defaultVehicleCode][0],
        }
        const newCurr = Object.assign(default_, curr)
        const abortError = controlRow(newCurr, rows, null, productList, enqueueSnackbar, policy)
        !abortError && prev.push(newCurr)
        return prev
      }, [])
      changedRows = [...rows, ...toAdded]
    }
    if (changed) {
      changedRows = rows.map(row => {
        const id = getVehicleId(row)
        if (!changed[id]) {return row}
        hasChanged |= true
        const rowKey = Object.keys(changed[id])[0]
        if (rowKey === 'value') {
          changed[id].value = numeric.toFloat(changed[id].value)
        }
        let updateRow
        const registrationDate = changed[id]['registrationDate']
        const leasingExpiry = changed[id]['leasingExpiry']
        let effRegistrationDate = 'registrationDate' in changed[id] ? registrationDate : row.registrationDate
        if (effRegistrationDate?.isValid) {
          effRegistrationDate = effRegistrationDate.isValid() ? effRegistrationDate : row.registrationDate
        }
        let effLeasingExpiry = 'leasingExpiry' in changed[id] ? leasingExpiry : row.leasingExpiry
        if (effLeasingExpiry?.isValid) {
          effLeasingExpiry = effLeasingExpiry.isValid() ? effLeasingExpiry : row.leasingExpiry
        }
        if (isPolicy) {
          const startDate = changed[id]['startDate']
          const finishDate = changed[id]['finishDate']
          const exclusionType = changed[id]['exclusionType'] || exclusionTypeList[0]
          let effStartDate = 'startDate' in changed[id] ? startDate : row.startDate
          if (effStartDate?.isValid) {
            effStartDate = effStartDate.isValid() ? effStartDate : row.startDate
          }
          let effFinishDate = 'finishDate' in changed[id] ? finishDate : row.finishDate
          if (effFinishDate?.isValid) {
            effFinishDate = effFinishDate.isValid() ? effFinishDate : row.finishDate
          }
          if (['ACTIVE', 'DELETED'].includes(row.state)) {
            updateRow = {
              ...row,
              exclusionType: effFinishDate ? exclusionType : undefined,
              startDate: effFinishDate ? policy.initDate : '',
              finishDate: effFinishDate,
              state: effFinishDate ? 'DELETED' : 'ACTIVE',
              registrationDate: effRegistrationDate,
              leasingExpiry: effLeasingExpiry,
            }
          } else if (['ADDED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(row.state)) {
            updateRow = {
              ...row,
              startDate: effStartDate,
              finishDate: effFinishDate,
              state: effStartDate || effFinishDate ? 'DELETED_FROM_INCLUDED' : 'ADDED_CONFIRMED',
              registrationDate: effRegistrationDate,
              leasingExpiry: effLeasingExpiry,
            }
          } else {
            updateRow = {
              ...row,
              ...changed[id],
              startDate: effStartDate,
              finishDate: ['ADDED'].includes(row.state) ? cFunctions.calcPolicyEndDate(policy.initDate, policy.midDate) : effFinishDate,
              registrationDate: effRegistrationDate,
              leasingExpiry: effLeasingExpiry,
            }
          }
        } else {
          updateRow = {
            ...row,
            ...changed[id],
            registrationDate: effRegistrationDate,
            leasingExpiry: effLeasingExpiry,
          }
        }
        const vehicleCode = cFunctions.getVehicleCode(updateRow.vehicleType, updateRow.weight, vehicleTypes) || defaultVehicleCode
        updateRow.productCode = productList[vehicleCode].indexOf(updateRow.productCode) > -1 ? updateRow.productCode : productList[vehicleCode][0]
        const abortError = controlRow(updateRow, rows, rowKey, pdsObj, enqueueSnackbar, policy)
        return abortError ? row : updateRow
      })
    }
    if (deleted) {
      hasChanged |= true
      if (isPolicy) {
        const deletedSet = new Set(deleted)
        changedRows = rows.reduce((prev, row) => {
          if (deletedSet.has(getVehicleId(row))) {
            return prev
          } else {
            prev.push(row)
            return prev
          }
        }, [])
      } else {
        const deletedSet = new Set(deleted)
        changedRows = rows.filter(row => {
          return !deletedSet.has(getVehicleId(row))
        })
      }
    }
    hasChanged && dispatch({ type: 'setVehicles', vehicles: changedRows })
    //if (added) {scrollToRow(startingAddedId)}
  }, [defaultVehicleCode, dispatch, enqueueSnackbar, exclusionTypeList, isPolicy, pdsObj, policy, productList, rows, vehicleTypes])
  const commandWithScroll = useCallback(props => {
    const { id, onExecute } = props
    let CommandButton = commandComponents[id]
    if (id === 'add') {
      if (isPolicy) {CommandButton = commandComponents['include']}
      return (
        <CommandButton
          {...props}
          onExecute={
            async () => {
              scrollToRow(VirtualTable.BOTTOM_POSITION)
              await onExecute()
              setTimeout(() => {
                try {
                  const [firstInput] = document.getElementById('vehicleTable').getElementsByClassName('MuiInputBase-input')
                  firstInput.focus()
                } catch (err) {}
              }, 20)
            }
          }
        />
      )
    }
    return <CommandButton {...props} />
  }, [isPolicy, scrollToRow])
  // eslint-disable-next-line react/display-name
  const EditCell = useCallback(props => {
    const { column } = props
    const shortEdit = isPolicy && ['DELETED', 'ACTIVE', 'DELETED_FROM_INCLUDED', 'ADDED_CONFIRMED'].includes(props.row.state)
    const shortEditInfo = !['ACTIVE', 'DELETED'].includes(props.row.state)
    if (column.name === 'vehicleType') {
      return <LookupEditCell {...props} hide={shortEdit} values={vehicleList}/>
    }
    if (column.name === 'productCode') {
      const list = [...new Set(productListFlat)]
      return <LookupEditCell {...props} hide={shortEdit} values={list}/>
    }
    if (column.name === 'exclusionType') {
      return <LookupEditCell {...props} hide={shortEditInfo} values={exclusionTypeList}/>
    }
    if (column.name === 'licensePlate' && shortEdit) {
      return <FastBaseCell {...props}/>
    }
    if (column.name === 'startHour' && !shortEditInfo) {
      return <FastBaseCell {...props}/>
    }
    if (column.name === 'state' && !shortEditInfo) {
      return <FastBaseCell {...props} empty/>
    }
    if (!['startDate', 'finishDate'].includes(column.name) && shortEdit) {
      return <TableEditRow.Cell {...props} style={{ visibility: 'hidden' }}/>
    }
    if (column.name === 'startDate' && ['DELETED', 'ACTIVE'].includes(props.row.state)) {
      return <FastBaseCell {...props} defaultValue={cDate.mom(policy.initDate, null, 'DD/MM/YYYY')}/>
    }
    if (column.name === 'startDate' && ['ADDED_CONFIRMED'].includes(props.row.state)) {
      return <FastBaseCell {...props} defaultValue={cDate.mom(props.value, null, 'DD/MM/YYYY')}/>
    }
    if (column.name === 'finishDate' && (['ADDED'].includes(props.row.state) || (!props.row.state && isPolicy))) {
      return <FastBaseCell {...props} defaultValue={getPolicyEndDate(policy.initDate, policy.minDate)}/>
    }
    return <TableEditRow.Cell {...props}/>
  }, [exclusionTypeList, isPolicy, policy.initDate, policy.minDate, productListFlat, vehicleList])
  
  const OptimizedGridDetailContainerBase = useCallback(({ row }) => {
    const { licensePlate, state, attachments } = row
    if (state !== 'ACTIVE') {
      return (
        <Container
          style={
            {
              display: 'inline-block',
              left: 0,
              position: 'sticky',
            }
          }
        >
          <RowAttachmentsComponent
            attachments={attachments || []}
            dispatch={dispatch}
            licensePlate={licensePlate}
            state={state}
            vehicles={rows}
          />
        </Container>
      )
    } else {
      return null
    }
  }, [dispatch, rows])
  
  const CellEditComponent = useCallback(props => (
    <TableEditColumn.Cell {...props}>
      {
        React.Children.toArray(props.children)
          .reduce((prev, curr) => {
            if (!isPolicy) {
              prev.push(curr)
              return prev
            }
            if (curr.props.id === 'edit') {
              if (props.tableRow.row.state === 'ADDED') {
                prev.push([commandWithScroll({ ...curr.props, id: 'includeEdit', key: curr.props.id }), curr[1]])
              } else if (['DELETED_CONFIRMED', 'ADDED_CONFIRMED'].includes(props.tableRow.row.state)) {
                if (['ADDED_CONFIRMED'].includes(props.tableRow.row.state)) {
                  prev.push(commandWithScroll({ ...curr.props, id: 'exclude', key: curr.props.id }))
                }
                return prev
              } else {
                prev.push(commandWithScroll({ ...curr.props, id: 'exclude', key: curr.props.id }))
              }
            } else if (curr.props.id === 'delete') {
              if (props.tableRow.row.state === 'ADDED') {
                prev.push(curr)
              }
            } else {
              prev.push(curr)
            }
            return prev
          }, [])
      }
    </TableEditColumn.Cell>
  ), [commandWithScroll, isPolicy])
  return (
    <AutoSizer>
      {
        ({ width }) => (
          <Paper
            style={
              {
                height: tab === 'all' ? window.innerHeight - 485 : window.innerHeight - 290,
                width,
                marginBottom: 20,
              }
            }
          >
            <Grid
              columns={columns}
              getRowId={getRowId}
              rootComponent={Root}
              rows={rows}
            >
              <SearchState/>
              <RowDetailState/>
              <IntegratedFiltering
                columnExtensions={filteringColumnExtensions}
              />
              <EditingState
                columnExtensions={tableColumnExtensions}
                onCommitChanges={commitChanges}
              />
              <BooleanTypeProvider
                for={booleanColumns}
              />
              <MenuTypeProvider
                dispatch={dispatch}
                for={menuColumns}
                handlePrint={handlePrint}
                priority={priority}
              />
              <NumberTypeProvider
                for={numberColumns}
              />
              <TextTypeProvider
                for={textColumns}
              />
              <DateTypeProvider
                for={dateColumns}
              />
              <TimeTextTypeProvider
                for={hourColumns}
              />
              <SummaryState
                totalItems={totalSummaryItems}
              />
              <IntegratedSummary
                calculator={summaryCalculator}
              />
              <VirtualTable
                cellComponent={Cell}
                columnExtensions={tableColumnExtensions}
                containerComponent={VirtuaComponent}
                height="auto"
                messages={messages}
                noDataCellComponent={NoDataComponent}
                ref={vtRef}
              />
              <TableColumnVisibility
                defaultHiddenColumnNames={defaultHiddenColumnNames}
              />
              <TableHeaderRow titleComponent={TitleComponent}/>
              <TableEditRow cellComponent={EditCell}/>
              <AddedRow/>
              <TableEditColumn
                cellComponent={CellEditComponent}
                commandComponent={commandWithScroll}
                showAddCommand
                showDeleteCommand
                showEditCommand
                width={100}
              />
              <TableRowDetail
                contentComponent={OptimizedGridDetailContainerBase}
                toggleCellComponent={TableDetailToggleCell}
                toggleColumnWidth={isPolicy ? 40 : 0}
              />
              <TableSummaryRow
                messages={messagesSummary}
              />
              <TableFixedColumns
                leftColumns={leftColumns}
                rightColumns={rightColumns}
              />
              <Toolbar
                rootComponent={RootToolbar}
              />
              <SearchPanel
                inputComponent={SearchInput}
                messages={messagesPlaceholder}
              />
            </Grid>
          </Paper>
        )
      }
    </AutoSizer>
  )
}

export default compose(
  memo,
  withSnackbar
)(VehiclesTable)
