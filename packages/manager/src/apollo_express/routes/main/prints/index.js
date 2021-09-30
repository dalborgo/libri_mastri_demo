import path from 'path'
import { ioFiles } from '@adapter/io'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { Gs, User } from '../../../models'
import { axiosGraphqlQuery } from '../../../resolvers/helpers/axios'
import get from 'lodash/get'
import find from 'lodash/find'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import sortBy from 'lodash/sortBy'
import reduce from 'lodash/reduce'
import { COLLISION_TEXT, elaborateMap, MAP_GUARANTEES, REG_TEXT, TEXT_KASKO } from './maps'
import fs from 'fs'
import Q from 'q'
import { calculateSequenceNumber } from '../../../resolvers/helpers'

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
        if (hideRate) {currentMAP = rest}
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

function addRouters (router) {
  router.post('/prints/print_proposal', async function (req, res) {
    const filePath = path.resolve('src/apollo_express/public/templates/modello_quotazione_qubo.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _createdAt,
      cosigners,
      initDate,
      midDate,
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
    const { number } = await calculateSequenceNumber(meta || {}, { code: 'ACCEPTED' }, number_) //accepted in caso di bozza per stampa
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
      validityDate: _createdAt && cDate.mom(_createdAt, null, 'DD/MM/YYYY', [30, 'd']),
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
    const filePath = path.resolve('src/apollo_express/public/templates/testo_ard_definitivo_2019_2020.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
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
    } = data
    const { isPolicy } = state || {}
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
      number,
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
    const filePath = path.resolve('src/apollo_express/public/templates/modello_appendice_inclusione.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      cosigners,
      number,
      productDefinitions,
      priceObj,
      signer,
      noPrize,
      toSave,
      vehicles,
    } = data
    //const target = find(vehicles, inp => ['ADDED', 'ADDED_CONFIRMED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileName = `inclusione_${_code}-${target.counter || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileName}`)
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
      const objCov = groupedPd[target.productCode]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode })
      const data = getGuaranteeList({ [target.productCode]: [found] }, vehicleTypesByKey, true, groupedCt, ' ', target)
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
      today,
      number,
      counter: target.counter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vType,
      sHour,
      sDate,
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
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileName, results)
      }
    }
  })
  router.post('/prints/print_application', async function (req, res) {
    const filePath = path.resolve('src/apollo_express/public/templates/modello_applicazione_stato_di_rischio.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
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
    //const target = find(vehicles, inp => ['ADDED', 'ADDED_CONFIRMED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    const today = cDate.mom(initDate, null, 'DD/MM/YYYY')
    const fileName = `applicazione_${_code}-${target.inPolicy || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileName}`)
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
      const objCov = groupedPd[target.productCode]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode })
      const data = getGuaranteeList({ [target.productCode]: [found] }, vehicleTypesByKey, true, groupedCt, ' ', target)
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
      today,
      number,
      counter: target.inPolicy,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vType,
      sHour,
      sDate,
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
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileName, results)
      }
    }
  })
  router.post('/prints/print_exclusion', async function (req, res) {
    const filePath = path.resolve('src/apollo_express/public/templates/modello_appendice_esclusione.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      cosigners,
      number,
      priceObj,
      endDate,
      signer,
      noPrize,
      toSave,
      vehicles,
    } = data
    //const target = find(vehicles, inp => ['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(inp.state) && inp.licensePlate === targetLicensePlate) || {}
    const [target] = vehicles
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileName = `esclusione_${_code}-${target.counter || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileName}`)
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
      today,
      number,
      counter: target.counter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      reason: target.exclusionType || 'VENDITA/DEMOLIZIONE',
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
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileName, results)
      }
    }
  })
  router.post('/prints/print_constraint', async function (req, res) {
    const filePath = path.resolve('src/apollo_express/public/templates/modello_appendice_vincolo.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
      cosigners,
      number,
      productDefinitions,
      signer,
      toSave,
      vehicles,
    } = data
    const [target] = vehicles
    const today = target.printDate ? cDate.mom(target.printDate, null, 'DD/MM/YYYY') : cDate.mom(null, null, 'DD/MM/YYYY')
    const fileName = `vincolo_${_code}-${target.constraintCounter || 'XXX'}.pdf`
    {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileName}`)
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
    if (target.productCode) {
      const objCov = groupedPd[target.productCode]
      const vehicleCode = cFunctions.getVehicleCode(target.vehicleType, target.weight, vehicleTypes)
      const found = find(objCov, { vehicleType: vehicleCode })
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
      today,
      number,
      counter: target.constraintCounter,
      pLongName: get(producer, 'longName'),
      lic: target.licensePlate,
      vType,
      sHour,
      sDate,
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
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, fileName, results)
      }
    }
  })
  
  router.post('/prints/print_regulation', async function (req, res) {
    const filePath = path.resolve('src/apollo_express/public/templates/modello_appendice_regolazione_premio.docx')
    const partial = {}, empty = ' '
    const data = req.body
    const {
      _code,
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
    const fileName = `regolazione_${_code}-${counter || ''}.pdf`
    if (isPolicy) {
      const savedFilePath = path.resolve(`src/apollo_express/crypt/${_code}/${fileName}`)
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
    const input = {
      number,
      counter,
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
      totInstalment: numeric.printDecimal(totInstalment),
      totTax: numeric.printDecimal(totInstalment - totTaxable),
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
        await ioFiles.saveAndCreateDir(`src/apollo_express/crypt/${_code}/`, `regolazione_${_code}.pdf`, results)
      }
    }
  })
}

export default {
  addRouters,
}
