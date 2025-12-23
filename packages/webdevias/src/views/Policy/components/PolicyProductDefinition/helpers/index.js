import { numeric } from '@adapter/common'
import uniq from 'lodash/uniq'
function createTag (vehicleType, coverageType, rate, overdraft, excess, glassCap, pds, index) {
  if (!(vehicleType && coverageType)) {return ''}
  if (index === 0) {return coverageType}
  for (let i = index - 1; i >= 0; i--) {
    if (pds[i].vehicleType === pds[index].vehicleType && pds[i].coverageType === pds[index].coverageType) {
      let count = 0,
        tag = `${coverageType}_T${rate}S${overdraft}F${numeric.toFloat(excess)}C${numeric.toFloat(glassCap)}`
      for (let j = i; j >= 0; j--) {
        if (numeric.toFloat(pds[j].rate) === numeric.toFloat(pds[index].rate) &&
            numeric.toFloat(pds[j].overdraft) === numeric.toFloat(pds[index].overdraft) &&
            numeric.toFloat(pds[j].excess) === numeric.toFloat(pds[index].excess)) {
          if (pds[j].productCode !== pds[j].coverageType && pds[j].vehicleType === pds[index].vehicleType) {count++}
          tag = `${coverageType}_T${rate}S${overdraft}F${numeric.toFloat(excess)}C${numeric.toFloat(glassCap)}${count ? `_${count}` : ''}`
        }
      }
      return tag.replace(',', '').replace('.', '')
    }
  }
  return coverageType
}

export function checkChangeRows (origPds) {
  const newPds = []
  for (let i = 0; i < origPds.length; i++) {
    const { vehicleType, coverageType, rate, overdraft, excess, glassCap } = origPds[i]
    newPds.push(createTag(vehicleType, coverageType, rate, overdraft, excess, glassCap, origPds, i))
  }
  const origCodes = origPds.map(row => row.productCode)
  const countOccurrences = (arr, value) => arr.filter(v => v === value).length
  
  const missingItems = []
  
  for (let item of uniq(origCodes)) {
    const countInArr1 = countOccurrences(origCodes, item)
    const countInArr2 = countOccurrences(newPds, item)
    const diff = countInArr1 - countInArr2
    if (diff > 0) {
      // Aggiungi l’elemento tante volte quanto manca
      for (let i = 0; i < diff; i++) {
        missingItems.push(item)
      }
    }
  }
  return missingItems
}

export function calculateRows (pds, setFieldValue) {
  for (let i = 0; i < pds.length; i++) {
    const { vehicleType, coverageType, rate, overdraft, excess, glassCap } = pds[i]
    setFieldValue(`productDefinitions.${i}.productCode`, createTag(vehicleType, coverageType, rate, overdraft, excess, glassCap, pds, i))
    if (coverageType === 'CRISTALLI') {
      setFieldValue(`productDefinitions.${i}.minimum`, '0,00')
      setFieldValue(`productDefinitions.${i}.excess`, '0,00')
      setFieldValue(`productDefinitions.${i}.overdraft`, '0,00')
      setFieldValue(`productDefinitions.${i}.towing`, '0,00')
      setFieldValue(`productDefinitions.${i}.rate`, '0,00')
    }
    if (vehicleType === 'RIMORCHIO') {
      setFieldValue(`productDefinitions.${i}.glassCap`, '0,00')
      setFieldValue(`productDefinitions.${i}.glass`, '0,00')
    }
  }
}

export function calculateRowsInLine (pds, index, setFieldValue) {
  const { vehicleType, coverageType, rate, overdraft, excess, glassCap } = pds[index]
  setFieldValue(`productDefinitions.${index}.productCode`, createTag(vehicleType, coverageType, rate, overdraft, excess, glassCap, pds, index))
}
