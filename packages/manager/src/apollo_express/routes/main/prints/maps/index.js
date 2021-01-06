import template from 'lodash/template'
import reduce from 'lodash/reduce'
import { cFunctions } from '@adapter/common'
import log from '@adapter/common/src/winston'
/*eslint-disable sort-keys*/
export const MAP_GUARANTEES = {
  SILVER: {
    title: template('Opzione 1: Protezione <%= type %> "<%= display %>"'), // <%= code %>
    body: template('<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 100.000,00'),
    rate: template('Tasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('Scoperto <%= overdraft %> % min. € <%= excess %>'),
  },
  GOLD: {
    title: template('Opzione 2: Protezione <%= type %> "<%= display %>"'), // <%= code %>
    body: template('<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 150.000,00'),
    rate: template('Tasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('Scoperto <%= overdraft %> % min. € <%= excess %>'),
  },
  PLATINUM: {
    title: template('Opzione 3: Protezione <%= type %> "<%= display %>"'), // <%= code %>
    body: template('<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 200.000,00'),
    rate: template('Tasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('Scoperto <%= overdraft %> % min. € <%= excess %>'),
  },
}
/*eslint-enable sort-keys*/

export function elaborateMap (obj, map) {
  return reduce(map, (prev, curr, key) => {
    const compiled = map[key]
    if (cFunctions.isFunc(compiled)) {
      try { prev[key] = compiled(obj)} catch (err) { log.warn(err.message) }
    } else {
      prev[key] = compiled
    }
    return prev
  }, {})
}

export const TEXT_KASKO = 'danni materiali al Veicolo conseguenti a collisione con uno o più veicoli identificati mediante targa. La garanzia Kasko solo Collisione si intendono estese anche agli accessori, optionals e apparecchi audio fonovisivi stabilmente fissati sul Veicolo, forniti e non forniti dalla casa costruttrice, purché evidenziati nella fattura di acquisto del Veicolo ed assicurati in eccesso al valore commerciale del Veicolo al momento della sottoscrizione della polizza.'
export const COLLISION_TEXT = ', Collisione veicoli agganciati (solo per veicoli pesanti)'
export const REG_TEXT = 'Il premio relativo alle rate intermedie sarà calcolato in base ai veicoli assicurati alla data della stessa.'

