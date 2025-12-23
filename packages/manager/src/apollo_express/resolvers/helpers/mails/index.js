import path from 'path'
import { cDate, numeric } from '@adapter/common'

const host = path.resolve('src/apollo_express/public')

const getSignature = () => {
  return `<br/><br/>
<strong>Sottoscrizione Qubo</strong><br/>
<img alt="logo" src="${host}/logo_qubo_pic.png" /><br/>
<span style="font-size: 12px">
<font color="#6E7C73">
<strong>Qubo Insurance Solutions ® è un marchio registrato e di proprietà di Allianz 381 S.r.l.</strong><br/>
<strong>Tel/Cell:</strong> +39 0464036106<br/>
<strong>Email:</strong> <a style="color:#6E7C73; text-decoration:none;" href="mailto:sottoscrizione@qubo-italia.eu">sottoscrizione@qubo-italia.eu</a>
<strong>  &nbsp;Pec:</strong> <a style="color:#6E7C73; text-decoration:none;" href="mailto:qubo-italia@pec.it">qubo-italia@pec.it</a>
<strong>  &nbsp;Sito web:</strong> <a style="color:#6E7C73; text-decoration:none;" href="www.qubo-italia.eu">www.qubo-italia.eu</a><br/>
<strong>ALLIANZ 381 S.R.L. - Sede Legale ed Amministrativa:</strong> Via Aldo Moro 1, 38062 Arco (TN)<br/>
<strong>Partita Iva Gruppo Allianz:</strong> 01333250320 <strong>Codice Fiscale:</strong> 06804080965 <strong>Codice univoco fatturazione elettronica:</strong> 2R0V8IC<br/>
<strong>Iscritto al Rui nella Sezione A – Agenti al Nr. :</strong> A000350435<br/>
<strong>La società è sottoposta all’attività di direzione e coordinamento da parte della Società Allianz S.p.A.</strong><br/>
<strong>La società appartiene al gruppo Allianz, iscritto all’Albo dei Gruppi Assicurativi al n. 018</strong><br/>
<br/>
“Le informazioni contenute nella presente e-mail e nei documenti eventualmente allegati sono confidenziali. La loro diffusione, distribuzione e/o riproduzione da parte di terzi, senza autorizzazione del mittente è vietata. In caso di ricezione per errore, Vogliate immediatamente informare il mittente del messaggio e distruggere la e-mail.”<br/>
“This e-mail may contain confidential and/or privileged information. If you are not the intended recipient (or have received this e-mail in error) please notify the sender immediately and destroy this e-mail. Any unauthorised copying, disclousure or distribution of the material in this e-mail is strictly forbidden and could be a crime.”<br/>
<br/>
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding-right: 2px;font-size: 12px; font-weight: bold; color: #5c6458">
      Main Sponsor
    </td>
    <td>
      <img alt="logo" src="${host}/acb.png" style="height: 40px" />
    </td>
  </tr>
</table>
</font>
</span>
`
}

export function getNewOffer (number, primaryOrigin, code, signer, userId) {
  return `<pre>NUOVA OFFERTA: ${number}
CONTRAENTE: ${signer}

È stata caricata una nuova offerta nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

Operazione effettuata da: ${userId}
</pre>`
}

export function getNewProposal (number, primaryOrigin, code, signer, userId) {
  return `<pre>NUOVA PROPOSTA: ${number}
CONTRAENTE: ${signer}

È stata caricata una nuova proposta nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

Operazione effettuata da: ${userId}
</pre>`
}

export function getConfirmProposal (number, primaryOrigin, code, signer, userId) {
  return `<pre>PROPOSTA CONFERMATA: ${number}
CONTRAENTE: ${signer}

È stata confermata una proposta nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

Operazione effettuata da: ${userId}
</pre>`
}

export function getConfirmOffer (number, primaryOrigin, code, signer, userId) {
  return `<pre>OFFERTA CONFERMATA: ${number}
CONTRAENTE: ${signer}

È stata confermata un'offerta nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

Operazione effettuata da: ${userId}
</pre>`
}

export function getNewPolicy (number, primaryOrigin, code, signer, userId) {
  return `<pre>POLIZZA EMESSA: ${number}
CONTRAENTE: ${signer}

È stata emessa una nuova polizza nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

Operazione effettuata da: ${userId}
</pre>`
}

export function getNewChanges_old (number, primaryOrigin, code, list, signer, userId) {
  return `<pre>MODIFICA STATO DI RISCHIO - POLIZZA: ${number}
CONTRAENTE: ${signer}

Ci sono modifiche allo stato di rischio nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

${list}

Operazione effettuata da: ${userId}
</pre>`
}

const getState = state => {
  switch (state) {
    case 'ADDED':
    case 'ADDED_CONFIRMED':
      return 'inclusione'
    case 'DELETED':
    case 'DELETED_CONFIRMED':
      return 'esclusione'
    default:
      return 'esclusione'
  }
}

export function getNewChanges (number, primaryOrigin, code, signer, userId, vehicle, savedPolicy) {
  return `<p>MODIFICA STATO DI RISCHIO - POLIZZA: ${number}<br/>
CONTRAENTE: ${signer}<br/>
<br/>
Richiesta di ${getState(vehicle['state'])}:<br/>
<br/>
Tipo Veicolo: ${vehicle['vehicleType']}<br/>
Targa: ${vehicle['licensePlate']}<br/>
<br/>
Data da: ${cDate.mom(vehicle['startDate'], null, 'DD/MM/YYYY')}<br/>
<br/>
${vehicle['state'].includes('DELETED') ? `Data a: ${cDate.mom(vehicle['endDate'], null, 'DD/MM/YYYY')}<br/><br/>` : ''}
Copertura: ${vehicle['productCode']}<br/>
<br/>
Valore assicurato: ${numeric.printDecimal(vehicle['value'] / 1000)} €<br/>
<br/>
Compreso IVA: ${vehicle['vatIncluded']}<br/>
Cristalli: ${vehicle['hasGlass']}<br/>
Traino: ${vehicle['hasTowing']}<br/>
<br/>
Link di polizza: ${primaryOrigin}/policies/edit/${code}<br/>
<br/>
UTENTE: ${userId}<br/>
<br/>
INTERMEDIARIO: ${savedPolicy['producer']['longName']}<br/>
<br/>
DATA E ORA: ${cDate.now('DD/MM/YYYY HH:mm')}<br/>
<br/>
</p>
${getSignature()}
`
}

export function getNewChangesConfirmed (number, primaryOrigin, code, signer, userId, vehicle) {
  return `<p>MODIFICA STATO DI RISCHIO - POLIZZA: ${number}<br/>
CONTRAENTE: ${signer}<br/>
<br/>
Spett.le Intermediario,<br/>
<br/>
a seguito della vostra richiesta, confermiamo l’${getState(vehicle['state'])} come da applicazione in allegato.<br/>
<br/>
Link di polizza: ${primaryOrigin}/policies/edit/${code}<br/>
<br/>
Cogliamo l’occasione per ringraziare e porgere i migliori saluti,
</p>
${getSignature()}
`
}
