import React, { useCallback } from 'react'
import clsx from 'clsx'
import { useDropzone } from 'react-dropzone'
import { makeStyles } from '@material-ui/styles'
import { colors, Typography } from '@material-ui/core'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import bytesToSize from 'utils/bytesToSize'

const useStyles = makeStyles(theme => ({
  root: {},
  dropZone: {
    border: `1px dashed ${theme.palette.divider}`,
    padding: theme.spacing(6),
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
    width: 130,
  },
  info: {
    marginTop: theme.spacing(1),
  },
  list: {
    maxHeight: 320,
  },
  actions: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
}))

const FilesDropzone = props => {
  const { handleUpload, enqueueSnackbar } = props
  const classes = useStyles()
  const onDropRejected = useCallback(rejectedFiles => {
    const [file] = rejectedFiles
    enqueueSnackbar(`${file.name} (${bytesToSize(file.size)}) di tipo ${file.type} non accettato!`, { variant: 'error' })
  }, [enqueueSnackbar])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: '.csv',
    multiple: false,
    onDrop: handleUpload,
    onDropRejected,
  })
  
  return (
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
      <div>
        <Typography
          gutterBottom
          variant="h3"
        >
          Scegli il file
        </Typography>
        <Typography
          className={classes.info}
          color="textSecondary"
          variant="body1"
        >
          Trascinalo qui o clicca per selezionarlo dalle cartelle.
        </Typography>
      </div>
    </div>
  )
}

export default compose(
  withSnackbar
)(FilesDropzone)

