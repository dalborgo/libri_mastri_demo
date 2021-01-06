import cFunctions from '../'

export const cursorPaginator = (data, after, dir = 'NEXT', first = 5) => {
  if (first < 0) {return []}
  const totalCount = data.length
  let sliced = []
  let start = 0
  if (after) {
    const cursor = cFunctions.fromBase64(after)
    start = data.findIndex(node => node.id === cursor)
    if (dir === 'NEXT') {
      sliced = start >= 0
        ? start === data.length - 1 // don't let us overflow
          ? []
          : data.slice(
            start + 1,
            Math.min(data.length, start + 1 + first)
          )
        : data.slice(0, first)
    } else {
      let nPage = Math.floor(start / first)
      nPage = Math.max(0, nPage - 1)
      const firstItem = Math.max(0, nPage * first)
      const lastItem = Math.min(data.length, firstItem + first)
      sliced = data.slice(
        firstItem,
        lastItem
      )
    }
  } else {
    sliced = data.slice(0, first)
  }
  let endCursor = undefined
  const edges = sliced.map(node => {
    endCursor = cFunctions.toBase64(node.id)
    return ({
      cursor: endCursor,
      node,
    })
  })
  let hasNextPage, hasPrevPage
  if (dir === 'NEXT' && after) {
    hasNextPage = start + first < totalCount - 1
    hasPrevPage = start > -1
  } else {
    hasNextPage = start < data.length && first < data.length
    hasPrevPage = start - first >= first
  }
  const pageInfo = endCursor !== undefined
    ? { endCursor, hasNextPage, hasPrevPage }
    : { hasNextPage, hasPrevPage }
  return {
    edges,
    pageInfo,
    totalCount,
  }
}

/**
 * @param data
 * @param after
 * @param dir
 * @param first
 * @param getCursor
 * @return
 * prevede che si ritorni un oggetto con un campo node e un campo cursor allo stesso livello
 * All'interno (di node) può avere un campo _cursor
 */
export const cursorPaginatorBoost = (data, after, dir = 'NEXT', first = 5, getCursor = () => null) => {
  if (first < 1) {return []}
  if (!after) {return data.slice(0, first)}
  const totalCount = data.length
  let endCursor = undefined
  const cursorIndex = data.findIndex(item => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    endCursor = item._cursor ? item._cursor : getCursor(item)
    // if there's still not a cursor, return false by default
    return endCursor ? after === endCursor : false
  })
  let edges = []
  if (dir === 'NEXT') {
    edges = cursorIndex >= 0
      ? cursorIndex === data.length - 1 // don't let us overflow
        ? []
        : data.slice(
          cursorIndex + 1,
          Math.min(data.length, cursorIndex + 1 + first)
        )
      : data.slice(0, first)
  } else {
    let nPage = Math.floor(cursorIndex / first)
    nPage = Math.max(0, nPage - 1)
    const firstItem = Math.max(0, nPage * first)
    const lastItem = Math.min(data.length, firstItem + first)
    edges = data.slice(
      firstItem,
      lastItem
    )
  }
  let hasNextPage, hasPrevPage
  if (dir === 'NEXT' && after) {
    hasNextPage = cursorIndex + first < totalCount - 1
    hasPrevPage = cursorIndex > -1
  } else {
    hasNextPage = cursorIndex < data.length && first < data.length
    hasPrevPage = cursorIndex - first >= first
  }
  const pageInfo = endCursor !== undefined
    ? { endCursor, hasNextPage, hasPrevPage }
    : { hasNextPage, hasPrevPage }
  return {
    edges,
    pageInfo,
    totalCount,
  }
}
