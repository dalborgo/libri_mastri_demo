import template from 'lodash/template'
import reduce from 'lodash/reduce'
import { cFunctions } from '@adapter/common'
import log from '@adapter/common/src/winston'
/*eslint-disable sort-keys*/
export const MAP_GUARANTEES = {
  SILVER: {
    title: template('Opzione 1: Protezione <%= type %> "<%= display %>"'),
    body: template('\n<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 100.000,00'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  GOLD: {
    title: template('Opzione 2: Protezione <%= type %> "<%= display %>"'),
    body: template('\n<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 150.000,00'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  PLATINUM: {
    title: template('Opzione 3: Protezione <%= type %> "<%= display %>"'),
    body: template('\n<%= conditions %>\nRICORSO TERZI DA INCENDIO Massimale EUR 200.000,00'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  RICORSO: {
    title: template('Protezione <%= type %> "<%= display %>"'),
    body: template(''),
    rate: template(''),
    overdraft: template(''),
    min: template(''),
  },
  NON: {
    title: template('Protezione <%= type %> <%= bind %>'),
    body: template(''),
    rate: template(''),
    overdraft: template(''),
    min: template(''),
  },
  CRISTALLI: {
    title: template('Protezione <%= type %> <%= bind %>'),
    body: template(''),
    rate: template(''),
    overdraft: template(''),
    min: template(''),
  },
  URTO: {
    title: template('Protezione <%= type %> "<%= display %>"'),
    body: template('\nURTO E CONSEGUENZA DELL’ URTO CONTRO ANIMALI SELVATICI'),
    urto: template('L’Impresa di Assicurazione per i veicoli per la quale la garanzia Urto e conseguenza dell’urto contro ' +
                   '\nAnimali Selvatici” è prestata e nel caso in cui non sia stata attivata la garanzia Kasko, ' +
                   '\nsi obbliga a rimborsare all’assicurato le spese necessarie ad elidere i danni subiti dal veicolo assicurato ' +
                   '\na seguito di urto, in luogo aperto alla circolazione, con animali selvatici (animali non soggetti al controllo ' +
                   '\ne/o vigilanza dell’uomo) fino al massimale riportato nella lista veicoli per anno a condizione che:'),
    endUrto: template('- L’assicurato richieda, immediatamente al verificarsi dell’impatto, l’intervento della Pubblica Autorità;'
                      + '\n- La Pubblica Autorità rilasci un proprio verbale di accertamento o, qualora non abbia potuto intervenire, un’attestazione di mancato intervento.'),
    rate: template(''),
    overdraft: template(''),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  DANNI: {
    title: template('Protezione <%= type %> "<%= display %>"'),
    body: template('\nDANNI ACCIDENTALI DURANTE ATTIVITA\''),
    urto: template('Clausola danni accidentali durante attività lavorative:'),
    endUrto: template('A parziale deroga dell’art. I. 3. Esclusioni si estende la copertura per i danni accidentali al veicolo assicurato, comprese le attrezzature e gli allestimenti su esso stabilmente montati, verificatisi durante le attività aziendali effettuate dal veicolo stesso, come ad esempio le operazioni di carico e scarico.'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  PACCHETTO: {
    title: template('Protezione <%= type %> "<%= display %>"'),
    body: template('\nPACCHETTO EVENTI'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
  },
  INFORTUNI: {
    title: template('Protezione <%= type %> "<%= display %>"'),
    body: template('\nINFORTUNI CONDUCENTE'),
    rate: template('\nTasso complessivo: <%= rate %> pro mille lordo'),
    overdraft: template('\nScoperto <%= overdraft %> % min. € <%= excess %>'),
    min: template('\nPremio annuo lordo minimo applicato € <%= min %>'),
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

