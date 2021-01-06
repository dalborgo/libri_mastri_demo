import React, { memo } from 'react'
import { Card, CardContent } from '@material-ui/core'
import FilesDropzone from 'components/FilesDropzone'

const PolicyVehiclesUpload = props => {
  const { handleUpload } = props
  return (
    <div style={{ height: 600 }}>
      <Card>
        <CardContent>
          <FilesDropzone handleUpload={handleUpload}/>
        </CardContent>
      </Card>
    </div>

  )
}

export default memo(PolicyVehiclesUpload)
