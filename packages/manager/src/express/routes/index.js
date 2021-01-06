const express = require('express')
const path = require('path')
const router = express.Router()
const info = require(path.resolve('package.json'))
const config = require('config')
const { NAMESPACE } = config.get('express')

router.get('/', function (req, res) {
  res.locals.title = 'ADAPTER SERVER'
  res.locals.nodejs = process.version
  res.locals.info = info
  res.locals.namespace = NAMESPACE
  res.render('index')
})

export default router
