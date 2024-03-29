import config from 'config'
import { getPoliciesConditions, getPolicyConditions } from './conditions'

const { BUCKET_DEFAULT } = config.get('couchbase')
export const POLICIES_QUERY_ = 'SELECT '
                               + 'p._code id, '
                               + 'p.state, '
                               + 'p.`number`, '
                               + 'p._createdAt, '
                               + 'OBJECT_CONCAT({"username":c.username}, {"id":c.username}, {"role":c.`role`}) createdBy, '
                               + 'CASE WHEN u IS NOT NULL THEN '
                               + 'OBJECT_CONCAT({"username":u.username}, {"id":u.username}) '
                               + 'ELSE missing '
                               + 'END producer '
                               + 'FROM ' + BUCKET_DEFAULT + ' p '
                               + 'LEFT JOIN ' + BUCKET_DEFAULT + ' u '
                               + 'ON KEYS CONCAT("USER|", p.producer) '
                               + 'LEFT JOIN ' + BUCKET_DEFAULT + ' c '
                               + 'ON KEYS CONCAT("USER|", p.createdBy) '
                               + 'WHERE p._type = "MB_POLICY" '
                               + 'ORDER BY p._createdAt desc'

export const MAX_POLICY_NUMBER = 'SELECT RAW '
                                 + 'IFNULL(MAX(meta.sequence), 0) '
                                 + 'FROM ' + BUCKET_DEFAULT + ' '
                                 + 'WHERE _type = "MB_POLICY" '
                                 + 'AND meta.year = $1 '
                                 + 'AND meta.`offset` = $2'

export function getPoliciesQuery (userRole, userId, onlyDoc = false) {
  const conditions = getPoliciesConditions(userRole, userId, onlyDoc)
  const query = 'SELECT '
                + 'ARRAY_AGG(DISTINCT p)[0]._code as id, '
                + 'ARRAY_AGG(DISTINCT p)[0]._createdAt as _createdAt, '
                + 'ARRAY_AGG(DISTINCT p)[0].initDate as initDate, '
                + 'ARRAY_AGG(DISTINCT p)[0].midDate as midDate, '
                + 'ARRAY_AGG(DISTINCT p)[0].state, '
                + '{ARRAY_AGG(DISTINCT p)[0].meta.modified, ARRAY_AGG(DISTINCT p)[0].meta.toDoc} as meta, '
                + 'ARRAY_AGG(DISTINCT p)[0].top, '
                + 'ARRAY_AGG(DISTINCT p)[0].`number`, '
                + 'ARRAY_AGG(CASE WHEN ch IS NOT NULL THEN {"id":ch._code} ELSE missing END) children, '
                + 'ARRAY_AGG(OBJECT_CONCAT({"username":c.username}, {"id":c.username}, {"role":c.`role`}))[0] createdBy, '
                + 'OBJECT_CONCAT({"surname": ARRAY_AGG(DISTINCT p)[0].signer.surname},{"id": ARRAY_AGG(DISTINCT p)[0].signer.id}) signer, '
                + 'ARRAY_AGG(CASE WHEN u IS NOT NULL THEN '
                + 'OBJECT_CONCAT({"username":u.username}, {"id":u.username}) '
                + 'ELSE missing END)[0] producer, '
                + 'ARRAY_AGG(CASE WHEN g IS NOT NULL THEN '
                + 'OBJECT_CONCAT( {"role": g.`role`, "username": g.username}, {"id":g.username}) '
                + 'ELSE missing END)[0] subAgent '
                + 'FROM ' + BUCKET_DEFAULT + ' p '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' ch '
                + 'ON KEY CONCAT("MB_POLICY|", ch.top) FOR p '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' u '
                + 'ON KEYS CONCAT("USER|", p.producer) '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' g '
                + 'ON KEYS CONCAT("USER|", p.subAgent) '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' c '
                + 'ON KEYS CONCAT("USER|", p.createdBy) '
                + conditions
                + 'AND p._type = "MB_POLICY" '
                + 'AND p.top is missing '
                //+ 'AND meta(ch).id LIKE "MB_POLICY%" '
                + 'GROUP BY meta(p).id '
                + 'ORDER BY _createdAt desc'
  return query
}

export function getPolicyQuery (id, userRole, userId) {
  const conditions = getPolicyConditions(userRole, userId)
  const query = 'SELECT '
                + 'p.*, '
                + 'to_string(meta(p).cas) as _cas, '
                + 'OBJECT_CONCAT(c, {"id":c.username}) as createdBy, '
                + 'OBJECT_CONCAT(u, {"id":u.username}) as producer, '
                + 'OBJECT_CONCAT(g, {"id":g.username}) as subAgent '
                + 'FROM ' + BUCKET_DEFAULT + ' p USE KEYS "MB_POLICY|' + id + '" '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' c ON KEYS CONCAT("USER|", p.createdBy) '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' u ON KEYS CONCAT("USER|", p.producer) '
                + 'LEFT JOIN ' + BUCKET_DEFAULT + ' g ON KEYS CONCAT("USER|", p.subAgent) '
                + conditions
  return query
}
