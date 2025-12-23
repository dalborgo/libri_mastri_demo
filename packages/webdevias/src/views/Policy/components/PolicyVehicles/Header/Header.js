import React, { memo } from 'react'
import { makeStyles, useTheme } from '@material-ui/styles'
import { Button, Divider, Grid, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip } from '@material-ui/core'
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab'
import Icon from '@mdi/react'
import {
  mdiCarMultiple,
  mdiCheckAll,
  mdiCloudDownloadOutline,
  mdiCloudUploadOutline,
  mdiCurrencyEur,
  mdiFolderZipOutline,
  mdiMenu,
  mdiMicrosoftExcel,
  mdiViewList,
} from '@mdi/js'
import { cDate } from '@adapter/common'

const useStyles = makeStyles(theme => ({
  root: {},
  whiteButton: {
    backgroundColor: theme.palette.white,
    color: theme.palette.grey[700],
  },
}))

// eslint-disable-next-line react/display-name
const ExportMenu = memo(({
  priority,
  handleSendGenias,
  filtered,
  setFiltered,
  isPolicy,
  classes,
  handleApplicationZip,
  handleExport,
  handleExportTotal,
  checkPolicy,
  dispatch,
  setTaxableTotal,
  resultRegFractions,
  taxableTotal,
}) => {
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
                handleApplicationZip('senza_premi')
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiFolderZipOutline} size={1}/>
            </ListItemIcon>
            Esporta applicazioni stato di rischio senza premi
          </MenuItem>
        }
        {
          <MenuItem
            onClick={
              () => {
                handleApplicationZip('con_premi')
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiFolderZipOutline} size={1}/>
            </ListItemIcon>
            Esporta applicazioni stato di rischio con premi
          </MenuItem>
        }
        {
          <MenuItem
            onClick={
              () => {
                handleApplicationZip('di_vincolo')
                handleClose()
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiFolderZipOutline} size={1}/>
            </ListItemIcon>
            Esporta applicazioni stato di rischio di vincolo
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
          (priority === 4 && isPolicy) &&
          <MenuItem
            onClick={
              async () => {
                const value = await checkPolicy()
                if(!value){
                  await handleSendGenias()
                  handleClose()
                 /* await dispatch({ type: 'confirmAllInclExcl' })
                  document.getElementById('headerButton').click()
                  */
                }
              }
            }
          >
            <ListItemIcon>
              <Icon path={mdiCheckAll} size={1}/>
            </ListItemIcon>
            Conferma inclusioni ed esclusioni
          </MenuItem>
        }
        {
          isPolicy && <Divider/>
        }
        {
          isPolicy &&
          <MenuItem
            onClick={
              () => {
                handleClose()
                setTimeout(() => {
                  setFiltered(false)
                }, 20)
              }
            }
            selected={!filtered}
          >
            <ListItemIcon>
              <Icon path={mdiCarMultiple} size={1}/>
            </ListItemIcon>
            TUTTI I DATI
          </MenuItem>
        }
        {
          isPolicy &&
          <MenuItem
            onClick={
              () => {
                handleClose()
                setTimeout(() => {
                  setFiltered(true)
                }, 20)
              }
            }
            selected={filtered === true}
          >
            <ListItemIcon>
              <Icon path={mdiCarMultiple} size={1}/>
            </ListItemIcon>
            SOLO STATO DI RISCHIO INIZIALE
          </MenuItem>
        }
        {
          isPolicy && resultRegFractions.map((fract, i) => {
            return (
              <MenuItem
                key={i}
                onClick={
                  () => {
                    handleClose()
                    setTimeout(() => {
                      setFiltered(fract.endDate)
                    }, 20)
                  }
                }
                selected={filtered === fract.endDate}
              >
                <ListItemIcon>
                  <Icon path={mdiCarMultiple} size={1}/>
                </ListItemIcon>
                Regolazione del {cDate.mom(fract.endDate, null, 'DD/MM/YYYY')}
              </MenuItem>
            )
          })
        }
      </Menu>
    </div>
  )
})

const Header = props => {
  const {
    handleSendGenias,
    handleModeChange,
    handleApplicationZip,
    handleExport,
    handleExportTotal,
    checkPolicy,
    mode,
    priority,
    isPolicy,
    dispatch,
    setTaxableTotal,
    taxableTotal,
    setFiltered,
    filtered,
    resultRegFractions,
  } = props
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
              checkPolicy={checkPolicy}
              handleSendGenias={handleSendGenias}
              classes={classes}
              dispatch={dispatch}
              filtered={filtered}
              handleApplicationZip={handleApplicationZip}
              handleExport={handleExport}
              handleExportTotal={handleExportTotal}
              isPolicy={isPolicy}
              priority={priority}
              resultRegFractions={resultRegFractions}
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
