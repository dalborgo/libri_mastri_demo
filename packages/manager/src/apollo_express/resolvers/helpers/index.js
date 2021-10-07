import { cDate, cFunctions, numeric, validation } from '@adapter/common'
import { email, ioFiles } from '@adapter/io'
import { Policy } from '../../models'
import { MAX_POLICY_NUMBER } from '../queries'
import padStart from 'lodash/padStart'
import path_ from 'path'
import fs from 'fs'
import { chain, deburr, find, isEmpty, isPlainObject, snakeCase, uniqBy } from 'lodash'
import config from 'config'
import { getConfirmOffer, getConfirmProposal, getNewChanges, getNewOffer, getNewPolicy, getNewProposal } from './mails'
import mkdirp from 'mkdirp'
import { CustomValidationError } from '../../errors'
import { USED_POLICY_NUMBERS } from './utils'

const { QUBO_EMAILS = [] } = config.get('email')
const { ORIGIN = [] } = config.get('apollo_express')

/*eslint-disable sort-keys*/
export const CSV_HEADER_MAP = {
  TARGA: 'licensePlate',
  'CODICE PRODOTTO': 'productCode',
  'TIPO VEICOLO': 'vehicleType',
  'Q.LI/KW/POSTI': 'weight',
  'data immatricolazione': 'registrationDate',
  marca: 'brand',
  modello: 'model',
  'VALORE ASSICURATO': 'value',
  CRISTALLI: 'hasGlass',
  TRAINO: 'hasTowing',
  'p.iva societa di leasing': 'leasingCompany',
  'scadenza leasing': 'leasingExpiry',
  'p.iva proprietario/locatario': 'owner',
}
export const CSV_ADDED_HEADER_MAP = {
  TARGA: 'licensePlate',
  'DATA DA': 'startDate',
  'ORA DA': 'startHour',
  'DATA A': 'finishDate',
  'CODICE PRODOTTO': 'productCode',
  'TIPO VEICOLO': 'vehicleType',
  'Q.LI/KW/POSTI': 'weight',
  'data immatricolazione': 'registrationDate',
  marca: 'brand',
  modello: 'model',
  'VALORE ASSICURATO': 'value',
  CRISTALLI: 'hasGlass',
  TRAINO: 'hasTowing',
  'p.iva societa di leasing': 'leasingCompany',
  'scadenza leasing': 'leasingExpiry',
  'p.iva proprietario/locatario': 'owner',
}
/*eslint-enable sort-keys*/
export const columnNameMap = isPolicy => header => header.map(column => {
  if (isPolicy) {
    return CSV_ADDED_HEADER_MAP[column] || column
  } else {
    return CSV_HEADER_MAP[column] || column
  }
})
const manageBool = val => (['si', 'SI', 'sì'].includes(val)) ? 'SI' : 'NO'

export function getDiffPolicy (new_, old) {
  const excludedFields = ['id', '__typename', '_type', 'producer', 'subAgent', '_createdAt', '_updatedAt', 'state', 'meta', 'number', '_code', 'signer', 'attachments', 'createdBy']
  const restNew = chain(new_).omit(excludedFields).omitBy(isEmpty).value()
  const restOld = chain(old).omit(excludedFields).omitBy(isEmpty).value()
  const d1 = cFunctions.difference(restNew, restOld)
  //const d2 = cFunctions.difference(restOld, restNew)
  console.log('differencesObj:', JSON.stringify(d1, null, 2))
  const differences = []
  for (let key in d1) {
    if (Array.isArray(d1[key])) {
      const resArr = uniqBy(d1[key], isEmpty)
      if (resArr.length > 1 || !isEmpty(resArr[0])) {
        differences.push({ log: key })
      }
    } else if (isPlainObject(d1[key])) {
      differences.push({ log: key })
    } else {
      differences.push({ log: key, after: d1[key], before: restOld[key] })
    }
  }
  console.log('differences:', differences)
  return differences
}

export async function createAttachments (files, dir) {
  const attachments = []
  for (let file of files) {
    if (file instanceof Promise) {
      const { filename, mimetype, createReadStream } = await file
      const completePath = path_.resolve(`src/apollo_express/crypt/${dir}/`)
      const dirExists = fs.existsSync(completePath)
      !dirExists && await mkdirp(completePath)
      const destination = path_.join(completePath, filename)
      const filesize = await ioFiles.saveStreamFile(createReadStream(), destination)
      if (filesize !== -1) {
        attachments.push({
          dir,
          name: filename,
          size: filesize,
          type: mimetype,
        })
      }
    } else {
      // eslint-disable-next-line no-unused-vars
      const { __typename, ...rest } = file
      attachments.push(rest)
    }
  }
  return attachments
}

function calculate (meta, forceError = false) {
  const combine = (meta.year || '') + '' + meta.serie
  if (forceError && USED_POLICY_NUMBERS.includes(combine)) {
    throw new CustomValidationError('Numero documento non assegnabile!', 'NUMBER_DOCUMENT_NOT_ASSIGNABLE')
  }
  if (USED_POLICY_NUMBERS.includes(combine)) {
    meta.sequence++
    meta.serie++
    calculate(meta)
  }
}

export async function calculateSequenceNumber (meta_, state, tag) {
  let meta, number, _code
  let { offset = 0, fromDoc, version } = meta_
  switch (state.code) {
    case 'ACCEPTED':
    case 'TO_AGENT':
    case 'TO_QUBO': {
      if (version === undefined) {
        let testedTagWithYear, testedTag
        if (!tag.includes('(CL. ')) { //se clonata non genero il numero
          const regexWithYear = /(\d{4})\/(\d+)-?(\d+)?/
          const regex = /(\d+)-?(\d+)?/
          testedTagWithYear = regexWithYear.exec(tag)
          testedTag = regex.exec(tag)
        }
        if (state.code === 'ACCEPTED' && testedTagWithYear) { //manual generated number
          const version = testedTagWithYear[3]
          const serie = testedTagWithYear[2]
          const sequence = parseInt(serie.slice(1))
          meta = {
            fromDoc,
            modified: false,
            offset: String(parseInt(serie, 10) - sequence),
            sequence,
            version: 0, //ok zero
            year: testedTagWithYear[1],
          }
          number = testedTagWithYear[0]
          meta.serie = parseInt(serie, 10)
          _code = `${meta.year}_${padStart(meta.serie, meta.offset.length, '0')}${version ? `-${version}` : ''}`
          break
        } else if (state.code === 'ACCEPTED' && testedTag) { //manual generated number
          const version = testedTag[2]
          const serie = testedTag[1]
          const sequence = parseInt(serie.slice(1))
          meta = {
            fromDoc,
            modified: false,
            offset: String(parseInt(serie, 10) - sequence),
            sequence,
            version: 0, //ok zero
            year: '',
          }
          number = testedTag[0]
          meta.serie = parseInt(serie, 10)
          calculate(meta, true)
          _code = `${padStart(meta.serie, meta.offset.length, '0')}${version ? `-${version}` : ''}`
          break
        } else {
          meta = {
            fromDoc,
            modified: false,
            offset,
            version: 0,
            year: cDate.mom(null, null, 'YYYY'),
          }
          const [maxNumber] = await Policy.getByQuery(MAX_POLICY_NUMBER, [meta.year, meta.offset])
          meta.sequence = maxNumber + 1
          meta.serie = parseInt(offset, 10) + meta.sequence
          calculate(meta)
          number = `${meta.year}/${padStart(meta.serie, offset.length, '0')}`
          _code = `${meta.year}_${padStart(meta.serie, offset.length, '0')}`
          break
        }
      }
    }
    // eslint-disable-next-line no-fallthrough
    case 'REST_AGENT':
    case 'REST_QUBO': {
      meta = meta_
      meta.modified = ['REST_AGENT', 'REST_QUBO'].includes(state.code)
      meta.version++
      number = `${meta.year}/${padStart(meta.serie, offset.length, '0')}${meta.version ? `-${meta.version}` : ''}`
      _code = `${meta.year}_${padStart(meta.serie, offset.length, '0')}${meta.version ? `-${meta.version}` : ''}`
      break
    }
    default: {
      number = `Bozza${tag ? ` (${tag})` : ''}`
      calculate({ serie: tag }, true)
      _code = `${cDate.mom(null, null, 'YYYYMMDDHHmmssSSS')}${tag ? `_${snakeCase(deburr(tag))}` : ''}`
    }
  }
  return { number, meta, _code }
}

const checkDate = date => !validation.valDate(date, 'DD/MM/YYYY') && !validation.valDate(date, 'YYYY-MM-DD') && !validation.valDate(date, 'DD.MM.YYYY')

function parseDate (date) {
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    return cDate.mom(date, 'DD/MM/YYYY', 'YYYY-MM-DD')
  } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date)) {
    return cDate.mom(date, 'DD.MM.YYYY', 'YYYY-MM-DD')
  } else {
    return cDate.mom(date, 'YYYY-MM-DD', 'YYYY-MM-DD')
  }
}

export const checkRecord = (record, line, policy, vehicleTypes, endDate) => {
  const { vehicles, productDefinitions: pdsObj } = policy
  const { isPolicy } = policy.state || {}
  const errors = []
  if (!pdsObj[cFunctions.camelDeburr(record.productCode + cFunctions.getVehicleCode(record.vehicleType, record.weight, vehicleTypes))]) {
    errors.push({
      reason: `Codice prodotto "${record.productCode}" per ${record.vehicleType} non definito [${record.licensePlate}]`,
      line,
      column: 'CODICE PRODOTTO',
    })
  }
  if (record.vehicleType === 'RIMORCHIO' && manageBool(record.hasGlass) === 'SI') {
    errors.push({
      reason: `Cristalli a "SI" per tipo veicolo "Rimorchio" non ammesso [${record.licensePlate}]`,
      line,
      column: 'CRISTALLI',
    })
  }
  if (record.registrationDate && checkDate(record.registrationDate)) {
    errors.push({
      reason: `Data immatricolazione "${record.registrationDate}" non valida [${record.licensePlate}]`,
      line,
      column: 'data immatricolazione',
    })
  }
  if (record.leasingExpiry && checkDate(record.leasingExpiry)) {
    errors.push({
      reason: `Data scadenza leasing "${record.leasingExpiry}" non valida [${record.licensePlate}]`,
      line,
      column: 'scadenza leasing',
    })
  }
  if (record.finishDate && checkDate(record.finishDate)) {
    errors.push({
      reason: `Data a "${record.finishDate}" non valida [${record.licensePlate}]`,
      line,
      column: 'data a',
    })
  }
  if (record.startDate && checkDate(record.startDate)) {
    errors.push({
      reason: `Data da "${record.startDate}" non valida [${record.licensePlate}]`,
      line,
      column: 'data da',
    })
  }
  if (isPolicy) {
    const found = find(vehicles, inp => {
      return ['ADDED', 'ADDED_CONFIRMED', 'ACTIVE'].includes(inp.state) && inp.licensePlate === record.licensePlate
    })
    if (found) {
      errors.push({
        reason: `Targa inclusa ("${record.licensePlate}") già presente`,
        line,
        column: 'targa',
      })
      //record.licensePlate = `XXXXXX_${uuid()}`
      return { undefined, errors } //skip if errors of this type
    }
  }
  
  const leasingExpiry = record.leasingExpiry ? parseDate(record.leasingExpiry) : 'Invalid date'
  const registrationDate = record.registrationDate ? parseDate(record.registrationDate) : 'Invalid date'
  const startDate = record.startDate ? parseDate(record.startDate) : 'Invalid date'
  const finishDate = record.finishDate ? parseDate(record.finishDate) : 'Invalid date'
  const checkedRecord = {
    ...record,
    licensePlate: record.licensePlate.replace(/ /g, ''),
    finishDate: finishDate === 'Invalid date' ? isPolicy ? endDate : null : finishDate,
    hasGlass: manageBool(record.hasGlass),
    hasTowing: manageBool(record.hasTowing),
    leasingCompany: record.leasingCompany && record.leasingCompany.length < 11 ? padStart(record.leasingCompany, 11, '0') : record.leasingCompany,
    leasingExpiry: leasingExpiry === 'Invalid date' ? null : leasingExpiry,
    owner: record.owner && record.owner.length < 11 ? padStart(record.owner, 11, '0') : record.owner,
    registrationDate: registrationDate === 'Invalid date' ? null : registrationDate,
    startDate: startDate === 'Invalid date' ? isPolicy ? undefined : null : startDate,
    startHour: record.startHour ? cDate.roundTextTime(record.startHour) : undefined,
    state: isPolicy ? 'ADDED' : 'ACTIVE',
    value: numeric.toFloat(record.value),
  }
  return { checkedRecord, errors }
}

export async function manageMail (state, producer = {}, code, userRole, signer) {
  const { code: stateCode, isPolicy } = state
  let { email: prodEmail } = producer //todo gestire filiale
  const signer_ = signer.surname ? `${signer.name ? signer.name + ' ' : ''}${signer.surname}` : ''
  let [primaryQuboEmail] = QUBO_EMAILS
  let [primaryOrigin] = ORIGIN
  if (!cFunctions.isProd()) { //per test in sviluppo
    prodEmail = 'dalborgo.m@asten.it'
    primaryQuboEmail = 'test@astenpos.it'
    primaryOrigin = 'http://109.168.42.51:5031'
  } else {
    prodEmail = 'valentina.santorum@qubo-italia.eu'
  }
  const number = code.replace('_', '/')
  if (stateCode === 'TO_AGENT') {
    const html = getNewOffer(number, primaryOrigin, code, signer_)
    return email.send(prodEmail, `Libri Matricola - Nuova Offerta n. ${number} - ${signer_}`, html, null, null, primaryQuboEmail)
  } else if (stateCode === 'TO_QUBO') {
    const html = getNewProposal(number, primaryOrigin, code, signer_)
    return email.send(!cFunctions.isProd() ? ['test@astenpos.it'] : QUBO_EMAILS, `Libri Matricola - Nuova Proposta n. ${number} - ${signer_}`, html, null, null, prodEmail)
  } else if (stateCode === 'ACCEPTED') {
    if (isPolicy) {
      const html = getNewPolicy(number, primaryOrigin, code, signer_)
      return email.send(prodEmail, `Libri Matricola - Emessa Polizza n. ${number} - ${signer_}`, html, null, null, primaryQuboEmail)
    } else {
      if (userRole === 'SUPER') {
        const html = getConfirmProposal(number, primaryOrigin, code, signer_)
        return email.send(prodEmail, `Libri Matricola - Confermata Proposta n. ${number} - ${signer_}`, html, null, null, primaryQuboEmail)
      } else {
        const html = getConfirmOffer(number, primaryOrigin, code, signer_)
        return email.send(!cFunctions.isProd() ? ['test@astenpos.it'] : QUBO_EMAILS, `Libri Matricola - Confermata Offerta n. ${number} - ${signer_}`, html, null, null, prodEmail)
      }
    }
  } else {
    return { ok: true }
  }
}

export async function manageMailEmitted (state, producer = {}, code, userRole, list = [], signer) {
  let { email: prodEmail } = producer //gestire filiale
  let [primaryQuboEmail] = QUBO_EMAILS
  let [primaryOrigin] = ORIGIN
  const signer_ = signer.surname ? `${signer.name ? signer.name + ' ' : ''}${signer.surname}` : ''
  if (!cFunctions.isProd()) { //per test in sviluppo
    prodEmail = 'dalborgo.m@asten.it'
    primaryOrigin = 'http://109.168.42.51:5031'
  } else {
    prodEmail = 'valentina.santorum@qubo-italia.eu'
  }
  const number = code.replace('_', '/')
  const formattedList = []
  for (let list_ of list) {
    const { licensePlate, state } = list_
    formattedList.push(`${licensePlate} ${state}`)
  }
  //la conferma deve andare ai clienti.
  const html = getNewChanges(number, primaryOrigin, code, formattedList.join('\n'), signer_)
  return email.send(!cFunctions.isProd() ? ['test@astenpos.it'] : QUBO_EMAILS, `Libri Matricola - Modifica stato di rischio - Polizza n. ${number} - ${signer_}`, html, null, null, primaryQuboEmail)
}


