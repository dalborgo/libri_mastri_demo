import { describe, it } from 'mocha'
import { expect } from 'chai'
import { mysql } from '../src'
import { formatters } from '../src/helpers'

describe('mysql: executeQuery get response', function () {
  it('returns results array', async function () {
    const res = await mysql.executeQuery('SELECT COUNT(*) from articolo')
    expect(res).to.have.property('results')
  })
})
describe('mysql: executeQuery wrong table', function () {
  it('returns ok property set false when the query is wrong', async function () {
    try { const res = await mysql.executeQuery('SELECT COUNT(*) from articolo2')} catch (err) {
      expect(err).to.have.property('ok')
      expect(err.ok).to.be.false
    }
  })
})
describe('mysql: executeQuery query undefined', function () {
  it('returns ok property to false when the query is wrong', async function () {
    try { const res = await mysql.executeQuery('')} catch (err) {
      expect(err).to.have.property('ok')
      expect(err.ok).to.be.false
    }
  })
})
describe('mysql: replaceInto right string output', function () {
  it('input array is converted to right string output', function () {
    const arr = [{
      id: 1,
      descr: 'A',
    }, {
      id: 2,
      descr: 'B',
    }]
    const res = formatters.replaceInto(arr, 'prova')
    expect(res).to.equal('REPLACE INTO prova SET id = 1, descr = \'A\';REPLACE INTO prova SET id = 2, descr = \'B\'')
  })
})
