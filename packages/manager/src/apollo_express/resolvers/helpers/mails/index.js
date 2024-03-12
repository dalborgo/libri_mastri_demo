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

export function getNewChanges (number, primaryOrigin, code, list, signer, userId) {
  return `<pre>MODIFICA STATO DI RISCHIO - POLIZZA: ${number}
CONTRAENTE: ${signer}

Ci sono modifiche allo stato di rischio nel sistema LIBRI MATRICOLA e disponibile all'indirizzo: ${primaryOrigin}/policies/edit/${code}

${list}

Operazione effettuata da: ${userId}
</pre>`
}
