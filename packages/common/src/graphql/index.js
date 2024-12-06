import { filter } from 'graphql-anywhere'

function getValues (selections, init, skip) {
  return selections.reduce((prev, curr) => {
    if (curr.kind === 'Field') {
      if (!skip.includes(curr.name.value)) {
        prev.push(curr.name.value)
      }
    }
    if (curr.kind === 'InlineFragment') {
      prev = getValues(curr.selectionSet.selections, prev, skip)
    }
    return prev
  }, init)
}

function extractFieldsFromFragment (fragment, skip = []) {
  skip = Array.isArray(skip) ? skip : [skip]
  const { definitions: [first] } = fragment
  return getValues(first.selectionSet.selections, [], skip)
}
//usa tutti i valori del fragment sovrascrivendoli con l'obj
function formInitialByFragment (fragment, obj = {}, skip = []) {
  const fields = extractFieldsFromFragment(fragment, skip)
  return fields.reduce((prev, curr) => {
    if(typeof obj[curr] === 'string') {
      prev[curr] = obj[curr] ? obj[curr].trim() : ''
    } else {
      prev[curr] = obj[curr]
    }
    return prev
  }, {})
}

//usa solo i valori dell'oggetto passato e non il resto del fragment
function exclusiveFormInitialByFragment (fragment, obj = {}, skip = []) {
  const fields = { ...filter(fragment, obj) }
  for (let key in fields) {
    if (!skip.includes(key)) {
      fields[key] = fields[key] ? fields[key].trim() : ''
    }
  }
  return fields
}

export default {
  exclusiveFormInitialByFragment,
  extractFieldsFromFragment,
  formInitialByFragment,
}
