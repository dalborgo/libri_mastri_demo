import Q from 'q'
import fs from 'fs'
import Docxtemplater from 'docxtemplater'
import log from '@adapter/common/src/winston'
import pdftk from 'node-pdftk'
import PizZip from 'pizzip'
import toPdf from 'office-to-pdf'
import path from 'path'

async function fillDocxTemplate (templatePath, data, undefString = ' ') {
  try {
    const nullGetter = part => part.module ? '' : undefString
    const template = await Q.ninvoke(fs, 'readFile', templatePath)
    const zip = new PizZip(template)
    const results = new Docxtemplater(zip, { linebreaks: true, nullGetter })
      .setData(data)
      .render()
      .getZip()
      .generate({ type: 'nodebuffer' })
    return { ok: true, results }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

async function docxToPdf (buffer) {
  try {
    const results = await toPdf(buffer)
    return { ok: true, results }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

/**
 *source:{
 * A: buffer,
 * B: buffer,
 * ...
 * }
 */
async function mergePdf (source) {
  try {
    const results = await pdftk.input(source)
    return { ok: true, results }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

const saveStreamFile = (stream, destination) => {
  return new Promise(resolve => {
    let filesize = 0
    stream.on('data', async chunk => {
      try {
        filesize += chunk.length
        await Q.nfcall(fs.appendFile, destination, chunk)
      } catch (err) {
        log.error(err)
        return resolve(-1)
      }
    })
    stream.once('end', () => {
      return resolve(filesize)
    })
    stream.on('error', error => {
      log.error(error)
      return resolve(-1)
    })
  })
}
const saveAndCreateDir = async (folder, fileName, buffer) => {
  try {
    const toSavePath = path.resolve(folder)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    await Q.nfcall(fs.writeFile, path.resolve(toSavePath, fileName), buffer)
    return { ok: true }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export default {
  docxToPdf,
  fillDocxTemplate,
  mergePdf,
  saveAndCreateDir,
  saveStreamFile,
}
