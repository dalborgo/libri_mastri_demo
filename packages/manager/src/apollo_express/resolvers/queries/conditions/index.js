export function getPolicyConditions (userRole, userId) {
  let conditions
  if (userRole === 'SUPER') {
    conditions = 'WHERE '
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_AGENT" AND p.meta.modified = false)) '
                 + 'OR (p.state.code NOT IN ["REST_AGENT", "DRAFT"] ) '
  } else if (userRole === 'SUB_AGENT') {
    conditions = 'WHERE '
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_QUBO" AND p.meta.modified = false)) '
                 + 'OR (p.state.code NOT IN ["REST_QUBO", "DRAFT"] ) '
                 + 'AND (p.subAgent = "' + userId + '") '
  } else {
    conditions = 'WHERE '
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_QUBO" AND p.meta.modified = false)) '
                 + 'OR (p.state.code NOT IN ["REST_QUBO", "DRAFT"] ) '
                 + 'AND (p.producer = "' + userId + '") '
  }
  return conditions
}

export function getPoliciesConditions (userRole, userId, onlyDoc) {
  let conditions
  const firstCondition = onlyDoc ? 'p.state.isPolicy is missing' : 'p.state.isPolicy'
  if (userRole === 'SUPER') {
    conditions = 'WHERE ' + firstCondition + ' AND ('
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_AGENT" AND p.meta.modified = false AND p.top is missing)) '
                 + 'OR (p.state.code NOT IN ["REST_AGENT", "DRAFT"] )) '
  } else if (userRole === 'SUB_AGENT') {
    conditions = 'WHERE ' + firstCondition + ' AND ('
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_QUBO" AND p.meta.modified = false AND p.top is missing)) '
                 + 'OR (p.state.code NOT IN ["REST_QUBO", "DRAFT"] ) '
                 + 'AND (p.subAgent = "' + userId + '")) '
  } else {
    conditions = 'WHERE ' + firstCondition + ' AND ('
                 + '((p.state.code = "DRAFT" AND (p.createdBy = "' + userId + '")) '
                 + 'OR (p.state.code = "REST_QUBO" AND p.meta.modified = false AND p.top is missing)) '
                 + 'OR (p.state.code NOT IN ["REST_QUBO", "DRAFT"] ) '
                 + 'AND (p.producer = "' + userId + '")) '
  }
  return conditions
}
