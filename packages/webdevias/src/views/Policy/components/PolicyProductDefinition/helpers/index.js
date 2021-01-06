import { numeric } from '@adapter/common'

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

export function calculateRows (pds, setFieldValue) {
  for (let i = 0; i < pds.length; i++) {
    const { vehicleType, coverageType, rate, overdraft, excess, glassCap } = pds[i]
    setFieldValue(`productDefinitions.${i}.productCode`, createTag(vehicleType, coverageType, rate, overdraft, excess, glassCap, pds, i))
  }
}

export function calculateRowsInLine (pds, index, setFieldValue) {
  const { vehicleType, coverageType, rate, overdraft, excess, glassCap } = pds[index]
  setFieldValue(`productDefinitions.${index}.productCode`, createTag(vehicleType, coverageType, rate, overdraft, excess, glassCap, pds, index))
}
