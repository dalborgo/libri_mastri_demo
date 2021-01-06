const escapeString = val => val.replace(/'/g, '\\\'')

function replaceInto (data, table, skip = []) {
  const arr = Array.isArray(data) ? data : [data]
  if (!table) {
    console.error('replaceInto: table undefined!')
    return null
  }
  if (!arr.length) {
    console.error('replaceInto: zero rows!')
    return null
  }
  let out = []
  arr.forEach(obj => {
    let str = `REPLACE INTO ${table} SET `
    let cmd = []
    for (let objKey in obj) {
      if(!skip.includes(objKey)) {
        const val = typeof obj[objKey] === 'string' ? `${objKey} = '${escapeString(obj[objKey])}'` : `${objKey} = ${obj[objKey]}`
        cmd.push(val)
      }
    }
    str += cmd.join(', ')
    out.push(str)
  })
  return out.join(';')
}

function objToQueryConditions (objs, firstAnd = true) {
  let output = firstAnd ? [''] : []
  for (let obj in objs) {
    output.push(`${obj} = '${objs[obj]}'`)
  }
  return output.join(' AND ')
}


export default {
  objToQueryConditions,
  replaceInto,
}
