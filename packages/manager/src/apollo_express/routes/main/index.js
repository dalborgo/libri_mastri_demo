import { reqAuthGet, reqAuthPost } from '../auth'
import express from 'express'
import files from './files'
import prints from './prints'
import utils from './utils'

const router = express.Router()
require('express-async-errors')

files.addRouters(router)
prints.addRouters(router)
utils.addRouters(router)

router.get('/', function (req, res) {
  res.redirect('/')
})

router.post('/test', function (req, res) {
  res.send({ ok: true })
})

router.get('/reserved', reqAuthGet, function (req, res) {
  res.send('reserved')
})

router.get('/reserved', reqAuthPost, function (req, res) {
  res.send('reserved')
})

export default router


