const express = require('express')
const path = require('path')
const router = express.Router()
const info = require(path.resolve('package.json'))
const config = require('config')
const { NAMESPACE } = config.get('apollo_express')
import { couchbase } from '@adapter/io'

router.get('/', async function (req, res) {
  res.locals.title = 'LIBRI MATRICOLA APOLLO SERVER'
  res.locals.nodejs = process.version
  res.locals.info = info
  const { ok, results: couchbaseVersion } = await couchbase.getVersion()
  if (ok) {
    res.locals.couchbaseVersion = couchbaseVersion
  }
  res.locals.namespace = NAMESPACE
  res.render('index')
})

export default router
