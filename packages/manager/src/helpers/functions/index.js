import find from 'lodash/find'

function mergeArrayWinFirstWithComparator (first, second, comparator, fields = []) {
  first = first.map(fr => {
    const found = find(second, comparator(fr))
    if (fields.length) {
      const whichFields = {}
      fields.forEach(field => {
        if (found && found[field]) {
          whichFields[field] = found[field]
        }
      })
      return { ...fr, ...whichFields } //only fields param
    } else {return { ...found, ...fr }} //only missing fields
  })
  second = second.filter(sec => {
    return !find(first, comparator(sec))
  })
  return [...first, ...second]
}

export default {
  mergeArrayWinFirstWithComparator,
}
