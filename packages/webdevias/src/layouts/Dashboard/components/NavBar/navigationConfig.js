/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
import PeopleIcon from '@material-ui/icons/PeopleOutlined'
import ReceiptIcon from '@material-ui/icons/ReceiptOutlined'
import Business from '@material-ui/icons/AccountBalanceOutlined'

function navigationConfig (user, policy, registry, priority, pathname) {
  const isEditPolicy = pathname.startsWith('/policies/editpolicy')
  const policyChildren = [
    {
      title: `Nuova ${priority === 3 ? 'Offerta' : 'Proposta'}`,
      href: '/policies/new/all',
    },
    {
      title: 'Lista Polizze',
      href: '/policies/list',
    },
    {
      title: 'Lista Quotazioni',
      href: '/policies/doclist',
    },
  ]
  priority === 1 && policyChildren.shift()
  policy && !isEditPolicy && policyChildren.push({
    title: `Modifica ${priority === 3 ? 'Offerta' : 'Proposta'}`,
    href: `/policies/edit/${policy}/all`,
    shared: true,
  })
  policy && isEditPolicy && policyChildren.push({
    title: 'Modifica stato di rischio',
    href: `/policies/editpolicy/${policy}/all`,
    shared: true,
  })
  priority === 3 && policyChildren.push({
    title: 'Bdx',
    href: '/policies/bdx',
  })
  
  const companyChildren = [
    {
      title: 'Società di Leasing',
      href: '/management_reg/registries',
    },
    {
      title: 'Creazione Società',
      href: '/management_reg/registry/create',
    },
  ]
  registry && companyChildren.splice(1, 0, {
    title: 'Dettaglio Società',
    href: `/management_reg/registries/${registry}/summary`,
  })
  const pages = [
    {
      title: 'Gestione Documenti',
      href: '/policies',
      icon: ReceiptIcon,
      children: policyChildren,
    },
    {
      title: 'Gestione Utenti',
      href: '/management',
      icon: PeopleIcon,
      children: priority === 3 ?
        [
          {
            title: 'Lista Utenti',
            href: '/management/users',
          },
          {
            title: 'Dettaglio Utente',
            href: `/management/users/${user}/summary`,
          },
          {
            title: 'Creazione Utente',
            href: '/management/user/create',
          },
        ]
        :
        [
          {
            title: 'Dettaglio Utente',
            href: `/management/users/${user}/summary`,
          },
        ],
    },
    {
      title: 'Gestione Aziende',
      href: '/management_reg',
      icon: Business,
      children: companyChildren,
    },
  ]
  priority < 3 && pages.splice(-2, 2)
  return [
    {
      title: '',
      pages,
    },
  ]
  
}

export default navigationConfig
