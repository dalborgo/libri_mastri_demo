import React, { memo, useMemo, useState } from 'react'
import { IconButton, Input, Menu, MenuItem, Select } from '@material-ui/core'
import { DataTypeProvider } from '@devexpress/dx-react-grid'
import Icon from '@mdi/react'
import {
  mdiCheck,
  mdiCloseCircleOutline,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiFilePdf,
  mdiPencilMinusOutline,
  mdiPencilOutline,
  mdiPencilPlusOutline,
  mdiPlaylistCheck,
  mdiPlus,
  mdiTableOfContents,
} from '@mdi/js'
import { makeStyles } from '@material-ui/styles'
import ListItemIcon from '@material-ui/core/ListItemIcon'

export const BooleanEditor = ({ value, onValueChange }) => {
  if (value === ' SI ') {value = 'SI'}
  return (
    <div style={{ marginTop: 2 }}>
      <Select
        fullWidth
        input={<Input/>}
        onChange={
          event => {
            onValueChange(event.target.value)
          }
        }
        style={{ textAlign: 'center' }}
        value={value || 'NO'}
      >
        <MenuItem value="SI">
          SI
        </MenuItem>
        <MenuItem value="NO">
          NO
        </MenuItem>
      </Select>
    </div>
  )
}
export const TitleComponent = ({ children: columnTitle }) => (
  <>
    {['Menu'].includes(columnTitle) ? null : columnTitle}
  </>
)

const MenuFormatterDisabled = () => {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <IconButton disabled style={{ padding: 8 }}>
        <Icon path={mdiDotsVertical} size={1}/>
      </IconButton>
    </div>
  )
}

const useStyles = makeStyles(() => ({
  menuItem: {
    width: '100%',
  },
}))
// eslint-disable-next-line react/display-name
export const MenuTypeProvider = memo(props => {
  const MenuFormatter = ({ value: state, row }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
      setAnchorEl(null)
    }
    const classes = useStyles()
    const isInclusion = useMemo(() => ['ADDED', 'ADDED_CONFIRMED'].includes(state), [state])
    if ((state === 'ACTIVE' && !row.inPolicy && !row.constraintCounter) || (props.priority !== 3 && ['ADDED', 'DELETED', 'DELETED_FROM_INCLUDED'].includes(state))) {
      return null
    } else {
      return (
        <>
          <div style={{ color: '#263238' }}>
            <IconButton
              aria-controls={`menu${row.licensePlate}${state}`}
              aria-haspopup="true"
              color="primary"
              disableRipple
              onClick={handleClick}
              style={{ padding: 8 }}
              title={`Menu ${isInclusion ? 'Inclusione' : 'Esclusione'}`}
            >
              {
                ['ADDED_CONFIRMED', 'DELETED_CONFIRMED'].includes(state) ?
                  <Icon path={mdiPlaylistCheck} size={1}/>
                  :
                  <Icon path={mdiTableOfContents} size={1}/>
              }
            </IconButton>
          </div>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={
              {
                horizontal: 'right',
                vertical: 'top',
              }
            }
            disableAutoFocusItem
            id={`menu${row.licensePlate}${state}`}
            onClose={handleClose}
            open={Boolean(anchorEl)}
            transitionDuration={0}
          >
            {
              (row.inPolicy) &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                name={`application|${row.licensePlate}|${row.state}|${row.inPolicy || ''}`}
                onClick={
                  event => {
                    props.handlePrint(event)
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdf} size={1}/>
                </ListItemIcon>
                Applicazione
              </MenuItem>
            }
            {
              (row.inPolicy) &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                name={`application|${row.licensePlate}|${row.state}|${row.inPolicy || ''}|void`}
                onClick={
                  event => {
                    props.handlePrint(event)
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdf} size={1}/>
                </ListItemIcon>
                Applicazione senza premi
              </MenuItem>
            }
            {
              state !== 'ACTIVE' &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                name={`${isInclusion ? 'inclusion|' : 'exclusion|'}${row.licensePlate}|${row.state}|${row.counter || ''}`}
                onClick={
                  event => {
                    props.handlePrint(event)
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdf} size={1}/>
                </ListItemIcon>
                Appendice d'{isInclusion ? 'inclusione' : 'esclusione'}
              </MenuItem>
            }
            {
              state !== 'ACTIVE' &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                name={`${isInclusion ? 'inclusion|' : 'exclusion|'}${row.licensePlate}|${row.state}|${row.counter || ''}|void`}
                onClick={
                  event => {
                    props.handlePrint(event)
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdf} size={1}/>
                </ListItemIcon>
                Appendice d'{isInclusion ? 'inclusione senza premi' : 'esclusione senza premi'}
              </MenuItem>
            }
            {
              ((['ADDED', 'ADDED_CONFIRMED'].includes(state) || row.constraintCounter) && row.leasingCompany) &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                name={`constraint|${row.licensePlate}|${row.state}|${row.constraintCounter || ''}`}
                onClick={
                  event => {
                    props.handlePrint(event)
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdf} size={1}/>
                </ListItemIcon>
                Appendice di vincolo
              </MenuItem>
            }
            {
              ['ADDED', 'DELETED', 'DELETED_FROM_INCLUDED'].includes(state) &&
              <MenuItem
                className={classes.menuItem}
                component={'button'}
                onClick={
                  async () => {
                    const value = await props.checkPolicy()
                    console.log('value:', value)
                    if(!value) {
                      await props.dispatch({
                        licensePlate: row.licensePlate,
                        newState: isInclusion ? 'ADDED_CONFIRMED' : 'DELETED_CONFIRMED',
                        state: row.state,
                        type: 'setVehicleStateByIndex',
                      })
                      document.getElementById('headerButton').click()
                    }
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiCheck} size={1}/>
                </ListItemIcon>
                Conferma
              </MenuItem>
            }
          </Menu>
        </>
      )
    }
  }
  return (
    <DataTypeProvider
      editorComponent={MenuFormatterDisabled}
      formatterComponent={MenuFormatter}
      {...props}
    />
  )
})

export const BooleanTypeProvider = props => (
  <DataTypeProvider
    editorComponent={BooleanEditor}
    {...props}
  />
)

//<editor-fold desc="EDITOR BUTTONS">
const EditButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Modifica">
    <Icon path={mdiPencilOutline} size={1}/>
  </IconButton>
)

const IncludeEditButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Modifica">
    <Icon path={mdiPencilPlusOutline} size={1}/>
  </IconButton>
)

const AddButton = ({ onExecute }) => (
  <div style={{ textAlign: 'center' }}>
    <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Aggiungi">
      <Icon path={mdiPlus} size={1.2}/>
    </IconButton>
  </div>
)

const IncludeButton = ({ onExecute }) => (
  <div style={{ textAlign: 'center' }}>
    <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Includi">
      <Icon path={mdiPlus} size={1.2}/>
    </IconButton>
  </div>
)

const DeleteButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Elimina">
    <Icon path={mdiDeleteOutline} size={1}/>
  </IconButton>
)

const ExcludeButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Escludi">
    <Icon path={mdiPencilMinusOutline} size={1}/>
  </IconButton>
)

const CommitButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Salva">
    <Icon path={mdiContentSaveOutline} size={1}/>
  </IconButton>
)

const CancelButton = ({ onExecute }) => (
  <IconButton color="primary" onClick={onExecute} style={{ padding: 8 }} tabIndex="-1" title="Annulla">
    <Icon path={mdiCloseCircleOutline} size={1}/>
  </IconButton>
)

export const commandComponents = {
  add: AddButton,
  edit: EditButton,
  exclude: ExcludeButton,
  include: IncludeButton,
  includeEdit: IncludeEditButton,
  delete: DeleteButton,
  commit: CommitButton,
  cancel: CancelButton,
}
//</editor-fold>
