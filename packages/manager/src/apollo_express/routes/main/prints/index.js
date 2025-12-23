import path from 'path'
import { ioFiles } from '@adapter/io'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { Gs, User } from '../../../models'
import { axiosGraphqlQuery, axiosLocalhostInstance } from '../../../resolvers/helpers/axios'
import archiver from 'archiver'
import get from 'lodash/get'
import find from 'lodash/find'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import sortBy from 'lodash/sortBy'
import reduce from 'lodash/reduce'
import { COLLISION_TEXT, elaborateMap, MAP_GUARANTEES, REG_TEXT, TEXT_KASKO } from './maps'
import fs from 'fs'
import Q from 'q'
import { calculateSequenceNumber, calculateSequenceNumberMilanese } from '../../../resolvers/helpers'

const MASTER_NUMBER = '40313690000001'
const INFORTUNI_NUMBER = '40313612000002'

async function getVL (vehicles, vehicleTypes, productDefinitions, signer, cosigners) {
  const leasingSet = {}
  return reduce(vehicles, async (prev, vehicle) => {
    const prev_ = await prev
    const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
    const prodKey = cFunctions.camelDeburr(vehicle.productCode + vehicleCode)
    const product = productDefinitions[prodKey] || {}
    let { prize, taxable } = cFunctions.getPrizeLine(product, vehicle)
    let realSigner = signer || {}, leasingSurname = ''
    if (vehicle.owner && signer.id !== vehicle.owner) {
      realSigner = find(cosigners, { id: vehicle.owner }) || {}
    }
    if (!leasingSet[vehicle.leasingCompany]) {
      if (vehicle.leasingCompany) {
        const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
        const { results } = await axiosGraphqlQuery(query, { id: vehicle.leasingCompany })
        if (results && results.registry_guest) {
          leasingSet[vehicle.leasingCompany] = results.registry_guest
          leasingSurname = leasingSet[vehicle.leasingCompany].surname
        }
      }
    } else {
      leasingSurname = leasingSet[vehicle.leasingCompany].surname || ''
    }
    /*eslint-disable sort-keys*/
    if (['DELETED', 'DELETED_CONFIRMED', 'ACTIVE'].includes(vehicle.state)) {
      prev_.push({
        tar: vehicle.licensePlate,
        vt: vehicle.vehicleType,
        sol: leasingSurname,
        scl: vehicle.leasingExpiry && cDate.mom(vehicle.leasingExpiry, null, 'DD/MM/YYYY') || '',
        cop: product.coverageType,
        valore: numeric.printDecimal(vehicle.value / 1000),
        pL: numeric.printDecimal(prize / 1000),
        pN: numeric.printDecimal(taxable / 1000),
        cVat: vehicle.vatIncluded,
        cri: vehicle.hasGlass,
        mCri: numeric.printDecimal(product.glassCap / 1000),
        tr: vehicle.hasTowing,
        sco: numeric.printDecimal(product.overdraft / 1000),
        fr: numeric.printDecimal(product.excess / 1000),
        pro: `${realSigner.name ? `${realSigner.name} ` : ''}${realSigner.surname}` || '',
      })
    }
    /*eslint-enable sort-keys*/
    return prev_
  }, Promise.resolve([]))
}

async function getVLReg (vehicles, vehicleTypes, productDefinitions, signer, cosigners) {
  const leasingSet = {}
  return reduce(vehicles, async (prev, vehicle) => {
    const prev_ = await prev
    const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
    const prodKey = cFunctions.camelDeburr(vehicle.productCode + vehicleCode)
    const product = productDefinitions[prodKey] || {}
    let realSigner = signer || {}, leasingSurname = ''
    if (vehicle.owner && signer.id !== vehicle.owner) {
      realSigner = find(cosigners, { id: vehicle.owner }) || {}
    }
    if (!leasingSet[vehicle.leasingCompany]) {
      if (vehicle.leasingCompany) {
        const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
        const { results } = await axiosGraphqlQuery(query, { id: vehicle.leasingCompany })
        if (results && results.registry_guest) {
          leasingSet[vehicle.leasingCompany] = results.registry_guest
          leasingSurname = leasingSet[vehicle.leasingCompany].surname
        }
      }
    } else {
      leasingSurname = leasingSet[vehicle.leasingCompany].surname || ''
    }
    /*eslint-disable sort-keys*/
    prev_.push({
      tar: vehicle.licensePlate,
      from: vehicle.startDate && cDate.mom(vehicle.startDate, null, 'DD/MM/YYYY') || '',
      to: vehicle.finishDate && cDate.mom(vehicle.finishDate, null, 'DD/MM/YYYY') || '',
      gg: vehicle.days,
      vt: vehicle.vehicleType,
      sol: leasingSurname,
      scl: vehicle.leasingExpiry && cDate.mom(vehicle.leasingExpiry, null, 'DD/MM/YYYY') || '',
      cop: product.coverageType,
      valore: numeric.printDecimal(vehicle.value),
      //pL: numeric.printDecimal(prize / 1000),
      pN: numeric.printDecimal(vehicle.prize),
      cVat: vehicle.vatIncluded,
      cri: vehicle.hasGlass,
      mCri: numeric.printDecimal(product.glassCap / 1000),
      tr: vehicle.hasTowing,
      sco: numeric.printDecimal(product.overdraft / 1000),
      fr: numeric.printDecimal(product.excess / 1000),
      pro: realSigner.surname || '',
      pay: numeric.printDecimal(vehicle.payment),
    })
    /*eslint-enable sort-keys*/
    return prev_
  }, Promise.resolve([]))
}

// globalGlass per non scrivere gli art per i non glass
function getGuaranteeList (groupedPd, vehicleTypesByKey, hideRate, coverageTypesByKey, empty = ' ', target) {
  const globalGlass = target ? target.hasGlass : null
  const globalTowing = target ? target.hasTowing : null
  
  let hasKnote = false
  const guaranteeList = reduce(groupedPd, (prev, products, key) => {
    const littleKey = (key.split(' '))[0]
    if (MAP_GUARANTEES[littleKey]) {
      for (let prod of products) {
        // eslint-disable-next-line no-unused-vars
        const { rate, ...rest } = MAP_GUARANTEES[littleKey] //omit rate in policy
        let currentMAP = { ...MAP_GUARANTEES[littleKey] }
        let conditions = coverageTypesByKey[key].conditions.join(', ')
        if (prod.vehicleType !== 'AUTOCARRO') {
          conditions = conditions.replace(COLLISION_TEXT, '')
        }
        if (conditions.includes('collisione')) {
          hasKnote |= true
        }
        if (hideRate || !prod.rate) {currentMAP = rest}
        const hasGlass = prod.glass ? '"Cristalli"' : ''
        const hasTowing = prod.towing ? hasGlass ? ' "Traino"' : '"Traino"' : ''
        const obj = {
          bind: `${hasGlass}${hasTowing}`,
          code: prod.productCode ? `(${prod.productCode})` : '',
          conditions,
          display: coverageTypesByKey[key].display,
          excess: numeric.printDecimal(prod.excess / 1000),
          min: numeric.printDecimal(prod.minimum / 1000),
          overdraft: numeric.printDecimal(prod.overdraft / 1000),
          type: get(vehicleTypesByKey[prod.vehicleType], 'display') || '',
        }
        if (!hideRate) {obj.rate = numeric.printDecimal(prod.rate / 100)} //pro mille
        if (target) {
          currentMAP.hasExtensions = (globalGlass === 'SI' && prod.glass) || (globalTowing === 'SI' && prod.towing)
          currentMAP.glass = (globalGlass === 'SI' && prod.glass) ? numeric.printDecimal(prod.glass / 1000) : ''
          currentMAP.glassCap = prod.glassCap ? numeric.printDecimal(prod.glassCap / 1000) : empty
          currentMAP.towing = (globalTowing === 'SI' && prod.towing) ? numeric.printDecimal(prod.towing / 1000) : ''
        } else {
          currentMAP.hasExtensions = prod.glass || prod.towing
          currentMAP.glass = prod.glass ? numeric.printDecimal(prod.glass / 1000) : ''
          currentMAP.glassCap = prod.glassCap ? numeric.printDecimal(prod.glassCap / 1000) : empty
          currentMAP.towing = prod.towing ? numeric.printDecimal(prod.towing / 1000) : ''
        }
        currentMAP.st = prod.statements
        if (prod.statements) {
          currentMAP.noSt = false
        } else if (globalGlass === 'NO') {
          currentMAP.noSt = false
        } else {
          currentMAP.noSt = true
        }
        //currentMAP.noSt = !prod.statements
        currentMAP.index = vehicleTypesByKey[prod.vehicleType].index + coverageTypesByKey[key].index
        if (prod.conditions) {
          currentMAP.overdraft = '\n' + prod.conditions
        }
        if (!prod.minimum) {
          delete currentMAP.min
        }
        prev.push(elaborateMap(obj, currentMAP))
      }
    }
    return prev
  }, [])
  return { guaranteeList: sortBy(guaranteeList, 'index'), hasKnote }
}

const getCompanyFile = (name, company) => {
  const folderName = company === 'ASSICURATRICE MILANESE SPA' ? 'mil' : 'tua'
  return { folderName, fileName: `${name}_${folderName}` }
}

function addRouters (router) {
  router.post('/prints/print_proposal', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _createdAt,
      company,
      cosigners,
      initDate,
      midDate,
      endDate,
      number: number_,
      meta,
      isRecalculateFraction,
      paymentFract,
      payFractions = [],
      regFractions = [],
      productDefinitions,
      signer,
      specialArrangements,
      vehicles,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_quotazione_qubo', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    //const filePath = path.resolve('src/apollo_express/public/templates/modello_quotazione_qubo.docx')
    console.log('company:', company)
    let number
    if (company === 'ASSICURATRICE MILANESE SPA') {
      const { number: num } = await calculateSequenceNumberMilanese(meta || {}, { code: 'ACCEPTED' }, number_) //accepted in caso di bozza per stampa
      number = num
    } else {
      const { number: num } = await calculateSequenceNumber(meta || {}, { code: 'ACCEPTED' }, number_) //accepted in caso di bozza per stampa
      number = num
    }
    const { activities, vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const vehicleTypesByKey = keyBy(vehicleTypes, 'id')
    const coverageTypesByKey = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const { guaranteeList, hasKnote } = getGuaranteeList(groupedPd, vehicleTypesByKey, false, coverageTypesByKey)
    const producer = await User.findById(data.producer) || {}
    const cosList = cosigners.map(cosigner => {
      return {
        name: `${get(cosigner, 'name')} ${get(cosigner, 'surname') || ''}`,
      }
    })
    const foundActivity = find(activities, { id: signer.activity })
    const activity = foundActivity ? foundActivity.display : ''
    const vL = await getVL(vehicles, vehicleTypes, productDefinitions, signer, cosigners)
    let totTax = 0, totTaxable = 0
    const regList = regFractions.map((fract, index) => {
      const startRegDate = fract.startDate && cDate.mom(fract.startDate, null, 'DD/MM/YYYY')
      const endRegDate = fract.endDate && cDate.mom(fract.endDate, null, 'DD/MM/YYYY')
      return {
        date: `${startRegDate} - ${endRegDate}${index < regFractions.length - 1 ? '\n' : ''}`,
      }
    })
    /*eslint-disable sort-keys*/
    const input = {
      number,
      today: cDate.mom(null, null, 'DD/MM/YYYY'),
      pLongName: get(producer, 'longName'),
      pAddr: producer.address,
      pAddrNumb: producer.addressNumber,
      pZip: producer.zip,
      pCity: producer.city,
      pState: producer.state,
      pEmail: producer.email,
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F. ' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      cosList,
      kaskoNote: TEXT_KASKO,
      hasKnote,
      pfr: payFractions.map((fraction, index) => {
        const isMid = index === 0 && midDate
        if (!isMid) {
          totTax += numeric.round(fraction.tax)
          totTaxable += numeric.round(fraction.taxable)
        }
        return {
          instalment: numeric.printDecimal(fraction.instalment),
          tax: numeric.printDecimal(fraction.tax),
          taxable: numeric.printDecimal(fraction.taxable),
          date: cDate.mom(fraction.date, null, 'DD/MM/YYYY'),
        }
      }),
      totInstalment: numeric.printDecimal(totTax + totTaxable),
      totTax: numeric.printDecimal(totTax),
      totTaxable: numeric.printDecimal(totTaxable),
      sActivity: activity,
      regList,
      hasReg: isRecalculateFraction === 'SI',
      regText: REG_TEXT,
      specialArrangements: specialArrangements || '',
      payFract: cFunctions.getFractName(paymentFract),
      initDate: initDate && cDate.mom(initDate, null, 'DD/MM/YYYY'),
      endDate,
      validityDate: cDate.mom(null, null, 'DD/MM/YYYY', [30, 'd']),
      guaranteeList,
      vL,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      res.send(results)
    }
  })
  
  router.post('/prints/print_policy', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      number,
      initDate,
      isRecalculateFraction,
      endDate,
      midDate,
      toSave,
      paymentFract,
      payFractions = [],
      regFractions = [],
      productDefinitions,
      specialArrangements,
      signer,
      state,
      vehicles,
      numPolizzaCompagnia,
    } = data
    const { folderName, fileName } = getCompanyFile('testo_ard_definitivo', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    //const filePath = path.resolve('src/apollo_express/public/templates/testo_ard_definitivo_2019_2020.docx')
    const { isPolicy } = state || {}
    const isMatrix = Boolean(numPolizzaCompagnia || !isPolicy)
    if (isPolicy) {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${_code}.pdf`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const cosList = cosigners.map((cosigner, index) => {
      const name = get(cosigner, 'name')
      const sur = get(cosigner, 'surname')
      const addr = get(cosigner, 'address')
      const addrNumb = get(cosigner, 'address_number')
      const zip = get(cosigner, 'zip')
      const city = get(cosigner, 'city')
      const state = get(cosigner, 'state')
      const id = get(cosigner, 'id') || empty
      return {
        addr,
        addrNumb,
        city,
        first: index === 0,
        id: `${get(cosigner, 'name') ? 'C.F.' : 'P.IVA '} ${id}${index !== cosigners.length - 1 ? '' : ''}`,
        name: `${name ? `${name}` : ''}`,
        state,
        sur: `${name ? ' ' + sur : sur}`,
        zip,
      }
    })
    const regList = regFractions.map((fract, index) => {
      const startRegDate = fract.startDate && cDate.mom(fract.startDate, null, 'DD/MM/YYYY')
      const endRegDate = fract.endDate && cDate.mom(fract.endDate, null, 'DD/MM/YYYY')
      return {
        date: `${startRegDate} - ${endRegDate}${index < regFractions.length - 1 ? '\n' : ''}`,
      }
    })
    let newNumber
    const [target] = Object.values(productDefinitions) || {}
    if (target && target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    
    const { vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const vehicleTypesByKey = keyBy(vehicleTypes, 'id')
    const coverageTypesByKey = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const { guaranteeList, hasKnote } = getGuaranteeList(groupedPd, vehicleTypesByKey, true, coverageTypesByKey)
    const producer = await User.findById(data.producer) || {}
    /*eslint-disable sort-keys*/
    let totTax = 0, totTaxable = 0
    const vL = await getVL(vehicles, vehicleTypes, productDefinitions, signer, cosigners)
    const input = {
      master: newNumber || MASTER_NUMBER,
      number,
      isPolicy,
      isMatrix,
      notIsMatrix: !isMatrix,
      numPolizzaCompagnia: numPolizzaCompagnia || 'da assegnare',
      today: cDate.mom(null, null, 'DD/MM/YYYY'),
      pLongName: get(producer, 'longName'),
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      id: get(signer, 'id') || empty,
      payFract: cFunctions.getFractName(paymentFract),
      initDate: initDate && cDate.mom(initDate, null, 'DD/MM/YYYY'),
      hasCosig: !!cosList.length,
      cosList,
      regList,
      endDate,
      kaskoNote: TEXT_KASKO,
      hasKnote,
      hasReg: isRecalculateFraction === 'SI',
      regText: REG_TEXT,
      guaranteeList,
      specialArrangements: specialArrangements || '',
      pfr: payFractions.map((fraction, index) => {
        const isMid = index === 0 && midDate
        if (!isMid) {
          totTax += numeric.round(fraction.tax)
          totTaxable += numeric.round(fraction.taxable)
        }
        return {
          instalment: numeric.printDecimal(fraction.instalment),
          tax: numeric.printDecimal(fraction.tax),
          taxable: numeric.printDecimal(fraction.taxable),
          date: cDate.mom(fraction.date, null, 'DD/MM/YYYY'),
        }
      }),
      totInstalment: numeric.printDecimal(totTax + totTaxable),
      totTax: numeric.printDecimal(totTax),
      totTaxable: numeric.printDecimal(totTaxable),
      vL,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, `${_code}.pdf`, results)
      }
    }
  })
  
  router.post('/prints/print_inclusion', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      number,
      productDefinitions,
      priceObj,
      signer,
      noPrize,
      toSave,
      vehicles,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_appendice_inclusione', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    //const target = find(vehicles, inp => ['ADDED', 'ADDED_CONFIRMED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    let newNumber
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileNamePdf = `inclusione_${noPrize ? 'senza_premi_' : ''}${_code}-${target.licensePlate}-${target.counter || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const { vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const vehicleTypesByKey = keyBy(vehicleTypes, 'id')
    const groupedCt = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const producer = await User.findById(data.producer) || {}
    let sHour, sDate, targetLeasing = {}, coverageType, gars = [], guaranteeList = [], hasKnote
    if (target.productCode) {
      const mainP = target.productCode.split('_')[0]
      const objCov = groupedPd[mainP]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode, productCode: target.productCode })
      const data = getGuaranteeList({ [mainP]: [found] }, vehicleTypesByKey, true, groupedCt, ' ', target)
      guaranteeList = data.guaranteeList
      hasKnote = data.hasKnote
      if (objCov) {
        coverageType = found.coverageType
      }
      if (coverageType) {
        gars = (groupedCt[coverageType]).conditions.join(' – ')
        if (target.hasGlass === 'SI') {
          gars += ' – Cristalli'
        }
        if (target.hasTowing === 'SI') {
          gars += ' – Traino'
        }
      }
    }
    if (target.startDate) {
      sHour = target.startHour || '24:00'
      sDate = cDate.mom(target.startDate, null, 'DD/MM/YYYY')
    }
    let realSigner = signer || {}
    if (target.owner && signer.id !== target.owner) {
      realSigner = find(cosigners, { id: target.owner }) || {}
    }
    const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
    const { results } = await axiosGraphqlQuery(query, { id: target.leasingCompany })
    if (results && results.registry_guest) {
      targetLeasing = results.registry_guest
    }
    const {
      id: lVat,
      surname: lSur,
      address: lAdd,
      address_number: lAn,
      zip: lZip,
      city: lCity,
      state: lState,
    } = targetLeasing
    const vType = `${target.brand || ''}${target.model ? ` ${target.model}` : ''} ${target.vehicleType}`
    /*eslint-disable sort-keys*/
    const input = {
      master: newNumber || MASTER_NUMBER,
      today,
      number,
      counter: target.counter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vType,
      sHour,
      sDate,
      vat: target.vatIncluded === 'SI',
      noVat: target.vatIncluded === 'NO',
      sign: toSave,
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      value: numeric.printDecimal(target.value / 1000),
      rName: get(realSigner, 'name') ? get(realSigner, 'name') + ' ' : '',
      rSur: get(realSigner, 'surname'),
      rAddr: get(realSigner, 'address'),
      rAddrNumb: get(realSigner, 'address_number'),
      rZip: get(realSigner, 'zip'),
      rCity: get(realSigner, 'city'),
      rState: get(realSigner, 'state'),
      rId: `${get(realSigner, 'name') ? 'C.F.' : get(realSigner, 'id') ? 'P.IVA ' : ''} ${get(realSigner, 'id') || empty}`,
      endDate: target.finishDate && cDate.mom(target.finishDate, null, 'DD/MM/YYYY'),
      lExp: target.leasingExpiry && cDate.mom(target.leasingExpiry, null, 'DD/MM/YYYY'),
      prize: !noPrize,
      lVat,
      lAdd,
      lCity,
      lAn,
      lSur,
      lState,
      lZip,
      gars,
      prOrTaxable: numeric.printDecimal(get(priceObj.datePrize, 'taxable')),
      prOrTax: numeric.printDecimal(get(priceObj.datePrize, 'tax')),
      prOrInst: numeric.printDecimal(get(priceObj.datePrize, 'instalment')),
      prDateTaxable: numeric.printDecimal(get(priceObj.paymentPrize, 'taxable')),
      prDateTax: numeric.printDecimal(get(priceObj.paymentPrize, 'tax')),
      prDateInst: numeric.printDecimal(get(priceObj.paymentPrize, 'instalment')),
      prDateFinishDate: get(priceObj.datePrize, 'finishDate') && cDate.mom(priceObj.datePrize.finishDate, null, 'DD/MM/YYYY'),
      guaranteeList,
      kaskoNote: TEXT_KASKO,
      hasKnote,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
  
  router.post('/prints/application_zip_senza_premi', async function (req, res) {
    const vehicles = req.body
    let counter = 1
    const [first] = vehicles
    const zipFileName = `applicazioni_senza_premi_${first._code}.zip`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${first._code}/${zipFileName}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const zip = archiver('zip', {})
    const toSavePath = path.resolve(`src/apollo_express/crypt/${first._code}/`)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    const output = fs.createWriteStream(path.resolve(toSavePath, zipFileName))
    zip.pipe(res)
    zip.pipe(output)
    for (let vehicle of vehicles) {
      const [firstVehicle] = vehicle.vehicles
      const buffer = await axiosLocalhostInstance('prints/print_application', {
        data: { ...vehicle, noPrize: true },
        method: 'POST',
        responseType: 'arraybuffer',
      })
      zip.append(buffer.data, { name: `applicazione_senza_premio_${first._code}-${firstVehicle.licensePlate}-${counter++}.pdf` })
    }
    await zip.finalize()
  })
  router.post('/prints/application_zip_con_premi', async function (req, res) {
    const vehicles = req.body
    let counter = 1
    const [first] = vehicles
    const zipFileName = `applicazioni_con_premi_${first._code}.zip`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${first._code}/${zipFileName}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const zip = archiver('zip', {})
    const toSavePath = path.resolve(`src/apollo_express/crypt/${first._code}/`)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    const output = fs.createWriteStream(path.resolve(toSavePath, zipFileName))
    zip.pipe(res)
    zip.pipe(output)
    for (let vehicle of vehicles) {
      const [firstVehicle] = vehicle.vehicles
      const buffer = await axiosLocalhostInstance('prints/print_application', {
        data: { ...vehicle, noPrize: false },
        method: 'POST',
        responseType: 'arraybuffer',
      })
      zip.append(buffer.data, { name: `applicazione_con_premio_${first._code}-${firstVehicle.licensePlate}-${counter++}.pdf` })
    }
    await zip.finalize()
  })
  router.post('/prints/application_zip_di_vincolo', async function (req, res) {
    const vehicles = req.body
    let counter = 1
    const [first] = vehicles
    const zipFileName = `applicazioni_di_vincolo_${first._code}.zip`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${first._code}/${zipFileName}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const zip = archiver('zip', {})
    const toSavePath = path.resolve(`src/apollo_express/crypt/${first._code}/`)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    const output = fs.createWriteStream(path.resolve(toSavePath, zipFileName))
    zip.pipe(res)
    zip.pipe(output)
    for (let vehicle of vehicles) {
      const [firstVehicle] = vehicle.vehicles
      const buffer = await axiosLocalhostInstance('prints/print_constraint', {
        data: { ...vehicle },
        method: 'POST',
        responseType: 'arraybuffer',
      })
      zip.append(buffer.data, { name: `applicazione_di_vincolo_${first._code}-${firstVehicle.licensePlate}-${counter++}.pdf` })
    }
    await zip.finalize()
  })
  router.post('/prints/application_zip_inclusioni', async function (req, res) {
    const vehicles = req.body
    const [first] = vehicles
    const zipFileName = `inclusioni_${first._code}.zip`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${first._code}/${zipFileName}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const zip = archiver('zip', {})
    const toSavePath = path.resolve(`src/apollo_express/crypt/${first._code}/`)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    const output = fs.createWriteStream(path.resolve(toSavePath, zipFileName))
    zip.pipe(res)
    zip.pipe(output)
    for (let vehicle of vehicles) {
      const [firstVehicle] = vehicle.vehicles
      const buffer = await axiosLocalhostInstance('prints/print_inclusion', {
        data: { ...vehicle },
        method: 'POST',
        responseType: 'arraybuffer',
      })
      zip.append(buffer.data, { name: `inclusione_${first._code}-${firstVehicle.licensePlate}-${firstVehicle.counter}.pdf` })
    }
    await zip.finalize()
  })
  router.post('/prints/application_zip_vincoli', async function (req, res) {
    const vehicles = req.body
    const [first] = vehicles
    const zipFileName = `vincoli_${first._code}.zip`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${first._code}/${zipFileName}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const zip = archiver('zip', {})
    const toSavePath = path.resolve(`src/apollo_express/crypt/${first._code}/`)
    const dirExists = fs.existsSync(toSavePath)
    !dirExists && await Q.nfcall(fs.mkdir, toSavePath)
    const output = fs.createWriteStream(path.resolve(toSavePath, zipFileName))
    zip.pipe(res)
    zip.pipe(output)
    for (let vehicle of vehicles) {
      const [firstVehicle] = vehicle.vehicles
      const buffer = await axiosLocalhostInstance('prints/print_constraint', {
        data: { ...vehicle },
        method: 'POST',
        responseType: 'arraybuffer',
      })
      zip.append(buffer.data, { name: `vincolo_${first._code}-${firstVehicle.licensePlate}-${firstVehicle.constraintCounter}.pdf` })
    }
    await zip.finalize()
  })
  
  router.post('/prints/print_application', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      initDate,
      midDate,
      number,
      productDefinitions,
      priceObj,
      signer,
      noPrize,
      toSave,
      vehicles,
    } = data
    let newNumber
    const { folderName, fileName } = getCompanyFile('modello_applicazione_stato_di_rischio', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    //const target = find(vehicles, inp => ['ADDED', 'ADDED_CONFIRMED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    const today = cDate.mom(null, null, 'DD/MM/YYYY')
    const fileNamePdf = `applicazione_${noPrize ? 'senza_premi_' : ''}${_code}-${target.inPolicy || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const { vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const vehicleTypesByKey = keyBy(vehicleTypes, 'id')
    const groupedCt = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const producer = await User.findById(data.producer) || {}
    let sHour, sDate, targetLeasing = {}, coverageType, gars = [], guaranteeList = [], hasKnote
    if (target.productCode) {
      const mainP = target.productCode.split('_')[0]
      const objCov = groupedPd[mainP]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode, productCode: target.productCode })
      const data = getGuaranteeList({ [mainP]: [found] }, vehicleTypesByKey, true, groupedCt, ' ', target)
      guaranteeList = data.guaranteeList
      hasKnote = data.hasKnote
      if (objCov) {
        coverageType = found.coverageType
      }
      if (coverageType) {
        gars = (groupedCt[coverageType]).conditions.join(' – ')
        if (target.hasGlass === 'SI') {
          gars += ' – Cristalli'
        }
        if (target.hasTowing === 'SI') {
          gars += ' – Traino'
        }
      }
    }
    sHour = '24:00'
    sDate = cDate.mom(initDate, null, 'DD/MM/YYYY')
    let realSigner = signer || {}
    if (target.owner && signer.id !== target.owner) {
      realSigner = find(cosigners, { id: target.owner }) || {}
    }
    const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
    const { results } = await axiosGraphqlQuery(query, { id: target.leasingCompany })
    if (results && results.registry_guest) {
      targetLeasing = results.registry_guest
    }
    const {
      id: lVat,
      surname: lSur,
      address: lAdd,
      address_number: lAn,
      zip: lZip,
      city: lCity,
      state: lState,
    } = targetLeasing
    const vType = `${target.brand || ''}${target.model ? ` ${target.model}` : ''} ${target.vehicleType}`
    /*eslint-disable sort-keys*/
    const input = {
      master: newNumber || MASTER_NUMBER,
      today,
      number,
      counter: target.inPolicy,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vType,
      sHour,
      sDate,
      vat: target.vatIncluded === 'SI',
      noVat: target.vatIncluded === 'NO',
      sign: toSave,
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      value: numeric.printDecimal(target.value / 1000),
      rName: get(realSigner, 'name') ? get(realSigner, 'name') + ' ' : '',
      rSur: get(realSigner, 'surname'),
      rAddr: get(realSigner, 'address'),
      rAddrNumb: get(realSigner, 'address_number'),
      rZip: get(realSigner, 'zip'),
      rCity: get(realSigner, 'city'),
      rState: get(realSigner, 'state'),
      rId: `${get(realSigner, 'name') ? 'C.F.' : get(realSigner, 'id') ? 'P.IVA ' : ''} ${get(realSigner, 'id') || empty}`,
      endDate: cDate.mom(cFunctions.calcPolicyEndDate(initDate, midDate), null, 'DD/MM/YYYY'),
      lExp: target.leasingExpiry && cDate.mom(target.leasingExpiry, null, 'DD/MM/YYYY'),
      prize: !noPrize,
      lVat,
      lAdd,
      lCity,
      lAn,
      lSur,
      lState,
      lZip,
      gars,
      prOrTaxable: numeric.printDecimal(get(priceObj.datePrize, 'taxable')),
      prOrTax: numeric.printDecimal(get(priceObj.datePrize, 'tax')),
      prOrInst: numeric.printDecimal(get(priceObj.datePrize, 'instalment')),
      prDateTaxable: numeric.printDecimal(get(priceObj.paymentPrize, 'taxable')),
      prDateTax: numeric.printDecimal(get(priceObj.paymentPrize, 'tax')),
      prDateInst: numeric.printDecimal(get(priceObj.paymentPrize, 'instalment')),
      prDateFinishDate: get(priceObj.datePrize, 'finishDate') && cDate.mom(priceObj.datePrize.finishDate, null, 'DD/MM/YYYY'),
      guaranteeList,
      kaskoNote: TEXT_KASKO,
      hasKnote,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
  router.post('/prints/print_exclusion', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      number,
      priceObj,
      endDate,
      signer,
      noPrize,
      toSave,
      vehicles,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_appendice_esclusione', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    //const target = find(vehicles, inp => ['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileNamePdf = `esclusione_${noPrize ? 'senza_premi_' : ''}${_code}-${target.licensePlate}-${target.counter || 'XXX'}.pdf`
    let newNumber
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const producer = await User.findById(data.producer) || {}
    let sHour, sDate
    if (target.startDate) {
      sHour = target.startHour || '24:00'
      sDate = cDate.mom(target.startDate, null, 'DD/MM/YYYY')
    }
    let realSigner = signer || {}
    if (target.owner && signer.id !== target.owner) {
      realSigner = find(cosigners, { id: target.owner }) || {}
    }
    const vType = `${target.brand || ''}${target.model ? ` ${target.model}` : ''} ${target.vehicleType}`
    /*eslint-disable sort-keys*/
    const input = {
      master: newNumber || MASTER_NUMBER,
      today,
      number,
      counter: target.counter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      reason: target.exclusionType || 'VENDITA/DEMOLIZIONE',
      vat: target.vatIncluded === 'SI',
      noVat: target.vatIncluded === 'NO',
      sign: toSave,
      vType,
      sHour,
      sDate,
      prize: !noPrize,
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      value: numeric.printDecimal(target.value / 1000),
      rName: get(realSigner, 'name') ? get(realSigner, 'name') + ' ' : '',
      rSur: get(realSigner, 'surname'),
      rAddr: get(realSigner, 'address'),
      rAddrNumb: get(realSigner, 'address_number'),
      rZip: get(realSigner, 'zip'),
      rCity: get(realSigner, 'city'),
      rState: get(realSigner, 'state'),
      rId: `${get(realSigner, 'name') ? 'C.F.' : get(realSigner, 'id') ? 'P.IVA ' : ''} ${get(realSigner, 'id') || empty}`,
      endDate: target.finishDate && cDate.mom(target.finishDate, null, 'DD/MM/YYYY'),
      prEndDate: endDate,
      prDateInst: numeric.printDecimal(get(priceObj.paymentPrize, 'taxable')),
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
  router.post('/prints/print_constraint', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      number,
      endDate,
      initDate,
      productDefinitions,
      signer,
      toSave,
      vehicles,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_appendice_vincolo', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    const [target] = vehicles
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileNamePdf = `vincolo_${_code}-${target.licensePlate}-${target.constraintCounter || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const { vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const groupedCt = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const producer = await User.findById(data.producer) || {}
    let sHour, sDate, targetLeasing = {}, coverageType, gars = []
    let newNumber
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    if (target.productCode) {
      const mainP = target.productCode.split('_')[0]
      const objCov = groupedPd[mainP]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode, productCode: target.productCode })
      if (objCov) {
        coverageType = found.coverageType
      }
      if (coverageType) {
        gars = (groupedCt[coverageType]).conditions.join(' – ')
        if (target.hasGlass === 'SI') {
          gars += ' – Cristalli'
        }
        if (target.hasTowing === 'SI') {
          gars += ' – Traino'
        }
      }
    }
    if (target.startDate) {
      sHour = target.startHour || '24:00'
      sDate = cDate.mom(target.startDate, null, 'DD/MM/YYYY')
    }
    let realSigner = signer || {}
    if (target.owner && signer.id !== target.owner) {
      realSigner = find(cosigners, { id: target.owner }) || {}
    }
    const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
    const { results } = await axiosGraphqlQuery(query, { id: target.leasingCompany })
    if (results && results.registry_guest) {
      targetLeasing = results.registry_guest
    }
    const {
      id: lVat,
      surname: lSur,
      address: lAdd,
      address_number: lAn,
      zip: lZip,
      city: lCity,
      state: lState,
    } = targetLeasing
    const vType = `${target.brand || ''}${target.model ? ` ${target.model}` : ''} ${target.vehicleType}`
    /*eslint-disable sort-keys*/
    const input = {
      master: newNumber || MASTER_NUMBER,
      today,
      number,
      counter: target.constraintCounter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vat: target.vatIncluded === 'SI',
      noVat: target.vatIncluded === 'NO',
      sign: toSave,
      vType,
      sHour: sHour || '24:00',
      sDate: sDate || (initDate && cDate.mom(initDate, null, 'DD/MM/YYYY')),
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      value: numeric.printDecimal(target.value / 1000),
      rName: get(realSigner, 'name') ? get(realSigner, 'name') + ' ' : '',
      rSur: get(realSigner, 'surname'),
      rAddr: get(realSigner, 'address'),
      rAddrNumb: get(realSigner, 'address_number'),
      rZip: get(realSigner, 'zip'),
      rCity: get(realSigner, 'city'),
      rState: get(realSigner, 'state'),
      rId: `${get(realSigner, 'name') ? 'C.F.' : get(realSigner, 'id') ? 'P.IVA ' : ''} ${get(realSigner, 'id') || empty}`,
      endDate: (target.finishDate && cDate.mom(target.finishDate, null, 'DD/MM/YYYY') || endDate),
      lExp: target.leasingExpiry && cDate.mom(target.leasingExpiry, null, 'DD/MM/YYYY'),
      lVat,
      lAdd,
      lCity,
      lAn,
      lSur,
      lState,
      lZip,
      gars,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
  
  router.post('/prints/print_receipt', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      endDate,
      endRecDate,
      initDate,
      number,
      productDefinitions,
      signer,
      startRecDate,
      state: { isPolicy },
      toSave,
      totInstalment,
      totTaxable,
      resultVehiclesToPrint,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_appendice_quietanza', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    const fileNamePdf = `quietanza_${_code}-${startRecDate}.pdf`
    if (isPolicy) {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const { vehicleTypes } = await Gs.findById('general_settings')
    const producer = await User.findById(data.producer) || {}
    let newNumber
    const [target] = Object.values(productDefinitions) || {}
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    /*eslint-disable sort-keys*/
    const vL = await getVLReg(resultVehiclesToPrint, vehicleTypes, productDefinitions, signer, cosigners)
    const cosList = cosigners.map((cosigner, index) => {
      const name = get(cosigner, 'name')
      const sur = get(cosigner, 'surname')
      const addr = get(cosigner, 'address')
      const addrNumb = get(cosigner, 'address_number')
      const zip = get(cosigner, 'zip')
      const city = get(cosigner, 'city')
      const state = get(cosigner, 'state')
      const id = get(cosigner, 'id') || empty
      return {
        addr,
        addrNumb,
        city,
        first: index === 0,
        id: `${get(cosigner, 'name') ? 'C.F.' : 'P.IVA '} ${id}${index !== cosigners.length - 1 ? '' : ''}`,
        name: `${name ? `${name}` : ''}`,
        state,
        sur: `${name ? ' ' + sur : sur}`,
        zip,
      }
    })
    const numTotTax = totInstalment - totTaxable
    const input = {
      master: newNumber || MASTER_NUMBER,
      number,
      today: cDate.mom(null, null, 'DD/MM/YYYY'),
      sign: toSave,
      startRecDate: cDate.mom(startRecDate, null, 'DD/MM/YYYY'),
      endRecDate: cDate.mom(endRecDate, null, 'DD/MM/YYYY'),
      pLongName: get(producer, 'longName'),
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      initDate: initDate && cDate.mom(initDate, null, 'DD/MM/YYYY'),
      hasCosig: !!cosList.length,
      cosList,
      endDate,
      totInstalment: numeric.printDecimal(numTotTax > 0 ? totInstalment : totTaxable),
      totTax: numeric.printDecimal(numTotTax > 0 ? numTotTax : 0),
      totTaxable: numeric.printDecimal(totTaxable),
      vL,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
  
  router.post('/prints/print_regulation', async function (req, res) {
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      company,
      cosigners,
      counter,
      endDate,
      endRegDate,
      initDate,
      number,
      productDefinitions,
      signer,
      startRegDate,
      state: { isPolicy },
      toSave,
      totInstalment,
      totTaxable,
      vehicles,
    } = data
    const { folderName, fileName } = getCompanyFile('modello_appendice_regolazione_premio', company)
    const filePath = path.resolve(`src/apollo_express/public/templates/${folderName}/${fileName}.docx`)
    const fileNamePdf = `regolazione_${_code}-${counter || ''}.pdf`
    if (isPolicy) {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileNamePdf}`)
      const pathExists = fs.existsSync(savedFilePath)
      if (pathExists) {
        const data = await Q.nfcall(fs.readFile, savedFilePath)
        return res.send(data)
      }
    }
    const { vehicleTypes, coverageTypes } = await Gs.findById('general_settings')
    const vehicleTypesByKey = keyBy(vehicleTypes, 'id')
    const coverageTypesByKey = keyBy(coverageTypes, 'id')
    const groupedPd = groupBy(productDefinitions, 'coverageType')
    const { guaranteeList } = getGuaranteeList(groupedPd, vehicleTypesByKey, true, coverageTypesByKey)
    const producer = await User.findById(data.producer) || {}
    let newNumber
    const [target] = Object.values(productDefinitions)
    if (target.productCode === 'INFORTUNI CONDUCENTE') {newNumber = INFORTUNI_NUMBER}
    /*eslint-disable sort-keys*/
    const vL = await getVLReg(vehicles, vehicleTypes, productDefinitions, signer, cosigners)
    const cosList = cosigners.map((cosigner, index) => {
      const name = get(cosigner, 'name')
      const sur = get(cosigner, 'surname')
      const addr = get(cosigner, 'address')
      const addrNumb = get(cosigner, 'address_number')
      const zip = get(cosigner, 'zip')
      const city = get(cosigner, 'city')
      const state = get(cosigner, 'state')
      const id = get(cosigner, 'id') || empty
      return {
        addr,
        addrNumb,
        city,
        first: index === 0,
        id: `${get(cosigner, 'name') ? 'C.F.' : 'P.IVA '} ${id}${index !== cosigners.length - 1 ? '' : ''}`,
        name: `${name ? `${name}` : ''}`,
        state,
        sur: `${name ? ' ' + sur : sur}`,
        zip,
      }
    })
    const numTotTax = totInstalment - totTaxable
    const input = {
      master: newNumber || MASTER_NUMBER,
      number,
      counter,
      draft: !toSave,
      sign: toSave,
      today: cDate.mom(null, null, 'DD/MM/YYYY'),
      startRegDate: cDate.mom(startRegDate, null, 'DD/MM/YYYY'),
      endRegDate: cDate.mom(endRegDate, null, 'DD/MM/YYYY'),
      pLongName: get(producer, 'longName'),
      sName: get(signer, 'name') ? get(signer, 'name') + ' ' : '',
      sSur: get(signer, 'surname'),
      sAddr: get(signer, 'address'),
      sAddrNumb: get(signer, 'address_number'),
      sZip: get(signer, 'zip'),
      sCity: get(signer, 'city'),
      sState: get(signer, 'state'),
      sId: `${get(signer, 'name') ? 'C.F.' : get(signer, 'id') ? 'P.IVA ' : ''} ${get(signer, 'id') || empty}`,
      initDate: initDate && cDate.mom(initDate, null, 'DD/MM/YYYY'),
      hasCosig: !!cosList.length,
      cosList,
      endDate,
      guaranteeList,
      totInstalment: numeric.printDecimal(numTotTax > 0 ? totInstalment : totTaxable),
      totTax: numeric.printDecimal(numTotTax > 0 ? numTotTax : 0),
      totTaxable: numeric.printDecimal(totTaxable),
      vL,
    }
    /*eslint-enable sort-keys*/
    {
      const { ok, message, results } = await ioFiles.fillDocxTemplate(filePath, input)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.buffer = results
      partial.correct = ok
    }
    {
      const { ok, message, results } = await ioFiles.docxToPdf(partial.buffer)
      if (!ok) {return res.status(412).send({ ok, message })}
      partial.correct &= ok
      res.send(results)
      if (partial.correct && toSave) {
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileNamePdf, results)
      }
    }
  })
}

export default {
  addRouters,
}
