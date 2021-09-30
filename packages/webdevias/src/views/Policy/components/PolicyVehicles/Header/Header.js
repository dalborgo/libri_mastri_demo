import React, { memo } from 'react'
import { makeStyles, useTheme } from '@material-ui/styles'
import { Button, Grid, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip } from '@material-ui/core'
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab'
import Icon from '@mdi/react'
import {
  mdiCheckAll,
  mdiCloudDownloadOutline,
  mdiCloudUploadOutline,
  mdiMicrosoftExcel,
  mdiCurrencyEur,
  mdiMenu,
  mdiViewList,
} from '@mdi/js'

const useStyles = makeStyles(theme => ({
  root: {},
  whiteButton: {
    backgroundColor: theme.palette.white,
    color: theme.palette.grey[700],
  },
}))

// eslint-disable-next-line react/display-name
const ExportMenu = memo(({ priority, filtered, setFiltered, isPolicy, classes, handleExport, handleExportTotal, dispatch, setTaxableTotal, taxableTotal }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = () => {
    setAnchorEl(null)
  }
  
  return (
    <div>
      <Button
        aria-controls="export-menu"
        aria-haspopup="true"
        className={classes.whiteButton}
        disableFocusRipple
        onClick={handleClick}
        size="small"
        variant="outlined"
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
        id="export-menu"
        keepMounted
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {
          <MenuItem
            onClick={
              () => {
                handleExport()
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiCloudDownloadOutline} size={1}/>
            </ListItemIcon>
            {isPolicy ? 'Esporta csv inclusioni confermate' : 'Esporta csv veicoli'}
          </MenuItem>
        }
        {
          isPolicy &&
          <MenuItem
            onClick={
              () => {
                handleExportTotal()
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiMicrosoftExcel} size={1}/>
            </ListItemIcon>
            Esporta xlsx veicoli
          </MenuItem>
        }
        {
          <MenuItem
            onClick={
              () => {
                handleClose()
                setTimeout(() => {
                  setFiltered(!filtered)
                }, 20)
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiCurrencyEur} size={1}/>
            </ListItemIcon>
            {filtered ? 'NON FILTRARE' : 'FILTRARE'}
          </MenuItem>
        }
        {
          <MenuItem
            onClick={
              () => {
                handleClose()
                setTimeout(() => {
                  setTaxableTotal(!taxableTotal)
                }, 20)
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiCurrencyEur} size={1}/>
            </ListItemIcon>
            {taxableTotal ? 'Mostra importi lordi' : 'Mostra importi netti'}
          </MenuItem>
        }
        {
          (priority === 3 && isPolicy) &&
          <MenuItem
            onClick={
              () => {
                dispatch({ type: 'confirmAllInclExcl' })
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiCheckAll} size={1}/>
            </ListItemIcon>
            Conferma inclusioni ed esclusioni
          </MenuItem>
        }
      </Menu>
    </div>
  )
})

const Header = props => {
  const { handleModeChange, handleExport, handleExportTotal, mode, priority, isPolicy, dispatch, setTaxableTotal, taxableTotal, setFiltered, filtered } = props
  const classes = useStyles()
  const theme = useTheme()
  return (
    <Toolbar>
      <Grid
        alignItems="center"
        container
        spacing={3}
      >
        <Grid item xs={4}/>
        <Grid item xs={4}>
          <Grid container justify="center">
            <ToggleButtonGroup
              exclusive
              onChange={handleModeChange}
              size="small"
              value={mode}
            >
              <Tooltip enterDelay={1000} title="Lista Veicoli">
                <ToggleButton
                  style={
                    {
                      color: mode === 'list' ? theme.palette.primary.main : undefined,
                      backgroundColor: 'white',
                      cursor: mode === 'list' ? 'default' : 'pointer',
                    }
                  }
                  value="list"
                >
                  <Icon path={mdiViewList} size={1}/>
                </ToggleButton>
              </Tooltip>
              <Tooltip enterDelay={1000} title={isPolicy ? 'Upload Csv Inclusioni' : 'Upload Csv'}>
                <ToggleButton
                  style={
                    {
                      color: mode === 'upload' ? theme.palette.primary.main : undefined,
                      backgroundColor: 'white',
                      cursor: mode === 'upload' ? 'default' : 'pointer',
                    }
                  }
                  value="upload"
                >
                  <Icon path={mdiCloudUploadOutline} size={1}/>
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
        <Grid item xs={4}>
          <Grid container justify="flex-end">
            <ExportMenu
              classes={classes}
              dispatch={dispatch}
              filtered={filtered}
              handleExport={handleExport}
              handleExportTotal={handleExportTotal}
              isPolicy={isPolicy}
              priority={priority}
              setFiltered={setFiltered}
              setTaxableTotal={setTaxableTotal}
              taxableTotal={taxableTotal}
            />
          </Grid>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

export default memo(Header)
