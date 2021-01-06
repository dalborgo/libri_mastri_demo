export const getPriority = (cache, userRole) => {
  const priority = 0
  const roles = cache.extract()['$ROOT_QUERY.roles']
  const rolObj = roles.enumValues

  try {
    for (let i = 0; i < rolObj.length; i++) {
      const id = rolObj[i].id
      const role = cache.extract()[id].name
      if (userRole === role) {
        return i
      }
    }
  } catch (err) {
    return priority
  }
}
