import React, { memo, useCallback } from 'react'
import clsx from 'clsx'
import { useDropzone } from 'react-dropzone'
import { makeStyles } from '@material-ui/styles'
import {
  colors,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core'
import Delete from '@material-ui/icons/Delete'
import bytesToSize from 'utils/bytesToSize'
import { cFunctions } from '@adapter/common'
import { manageFile } from 'utils/axios'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import { ME } from 'queries/users'
import { useApolloClient } from '@apollo/react-hooks'
import FileSaver from 'file-saver'
import { envConfig } from 'init'
import { getFileIcon } from 'helpers'
import find from 'lodash/find'

const useStyles = makeStyles(theme => ({
  root: {},
  dropZone: {
    border: `1px dashed ${theme.palette.divider}`,
    padding: theme.spacing(2),
    outline: 'none',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: colors.grey[50],
      opacity: 0.5,
      cursor: 'pointer',
    },
  },
  dragActive: {
    backgroundColor: colors.grey[50],
    opacity: 0.5,
  },
  image: {
    width: 80,
  },
  info: {
    marginTop: theme.spacing(1),
  },
  list: {},
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginRight: theme.spacing(1.5),
  },
}))

const RowAttachmentsComponent = props => {
  let { dispatch, attachments: files = [], enqueueSnackbar, licensePlate, state, vehicles } = props
  files = files || []
  const classes = useStyles()
  const client = useApolloClient()
  const maxSize = parseInt(envConfig.MAX_UPLOAD_MB, 10) * 1_048_576 || 20_971_520
  const { me } = client.readQuery({ query: ME })
  const handleDrop = useCallback(acceptedFiles => {
    const duplicatedFree = []
    for (let file of acceptedFiles) {
      const found = find(files, { name: file.name })
      if (found) {
        enqueueSnackbar(`Impossibile caricare il file "${file.name}" perché già presente!`, { variant: 'error' })
      } else {
        duplicatedFree.push(file)
      }
    }
    const newVehicles = [...vehicles]
    const found = find(vehicles, { licensePlate, state })
    found.attachments = [...files].concat(duplicatedFree)
    duplicatedFree.length && dispatch({ type: 'setVehicles', vehicles: newVehicles })
  }, [dispatch, enqueueSnackbar, files, licensePlate, state, vehicles])
  const onDropRejected = useCallback(rejectedFiles => {
    let message
    for (let file of rejectedFiles) {
      if (file.size > maxSize) {
        message = `File "${file.name}" (${bytesToSize(file.size)}) supera la dimensione massima di ${bytesToSize(maxSize)}!`
      } else {
        message = `File "${file.name}" (${bytesToSize(file.size)}) di tipo "${file.type}" non accettato!`
      }
    }
    enqueueSnackbar(message, { variant: 'error' })
  }, [enqueueSnackbar, maxSize])
  
  const handleRemoveLine = event => {
    const name = event.currentTarget.name
    const index = Number(name.split('_')[1])
    const filteredItems = cFunctions.removeAtIndex(files, index)
    const newVehicles = [...vehicles]
    const found = find(vehicles, { licensePlate, state })
    found.attachments = filteredItems
    dispatch({ type: 'setVehicles', vehicles: newVehicles })
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxSize, // in bytes
    onDrop: handleDrop,
    onDropRejected,
  })
  
  return (
    <Grid container spacing={2}>
      {
        state !== 'ADDED_CONFIRMED' &&
        <Grid item md={1} xs={1}>
          <div
            className={
              clsx({
                [classes.dropZone]: true,
                [classes.dragActive]: isDragActive,
              })
            }
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <div>
              <img
                alt="Select file"
                className={classes.image}
                src="/images/undraw_add_file2_gvbb.svg"
              />
            </div>
          </div>
        </Grid>
      }
      {
        files.length > 0 && (
          <Grid item xs={2}>
            <Grid container direction="column">
              <Grid item>
                <List className={classes.list} dense>
                  {
                    files.map((file, i) => (
                      <ListItem
                        button
                        divider={i < files.length - 1}
                        key={`${file.name}_${i}`}
                        onClick={
                          async () => {
                            const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
                            const isBlobFile = file instanceof File
                            if (isBlobFile) {
                              if (forceDownloadPdf) {
                                FileSaver.saveAs(file)
                              } else {
                                const exportUrl = URL.createObjectURL(file)
                                window.open(exportUrl, '_blank')
                                URL.revokeObjectURL(exportUrl)
                              }
                            } else {
                              const { ok, message, err } = await manageFile(
                                'files/get_attachments',
                                file.name,
                                file.type,
                                { filePath: `${file.dir}/${file.name}` },
                                { toDownload: forceDownloadPdf }
                              )
                              if (!ok) {
                                const { code } = err
                                let displayError = message
                                if (code === 'ENOENT') {
                                  displayError = `File "${file.name}" non presente!`
                                }
                                enqueueSnackbar(displayError, { variant: 'error' })
                              }
                            }
                          }
                        }
                      >
                        <ListItemIcon>
                          {getFileIcon(file.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          primaryTypographyProps={{ variant: 'h5' }}
                          secondary={bytesToSize(file.size)}
                        />
                        {
                          state !== 'ADDED_CONFIRMED' &&
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              name={`buttonDelete_${i}`}
                              onClick={handleRemoveLine}
                            >
                              <Delete/>
                            </IconButton>
                          </ListItemSecondaryAction>
                        }
                      </ListItem>
                    ))
                  }
                </List>
              </Grid>
              <Grid item/>
            </Grid>
          </Grid>
        )
      }
      {/*<Grid item md={2} xs={1}>
        <Button name={`inclusion_${licensePlate}`} onClick={handlePrint}>Appendice di Inclusione</Button>
      </Grid>*/}
    </Grid>
  )
}

export default compose(
  memo,
  withSnackbar
)(RowAttachmentsComponent)


