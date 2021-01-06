import { reqAuthGet, reqAuthPost } from '../auth'

const express = require('express')
const router = express.Router()
require('express-async-errors')

router.get('/', function (req, res) {
  res.redirect('/')
})

router.get('/reserved', reqAuthGet, function (req, res) {
  res.send('reserved')
})

router.get('/reserved', reqAuthPost, function (req, res) {
  res.send('reserved')
})

export default  router


