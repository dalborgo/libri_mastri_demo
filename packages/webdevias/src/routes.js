/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
import React, { lazy } from 'react'
import { Redirect } from 'react-router-dom'
import log from '@adapter/common/src/log'
import AuthLayout from './layouts/Auth'
import ErrorLayout from './layouts/Error'
import DashboardLayout from './layouts/Dashboard'

function routerSwitch (role) {
  switch (role) {
    case 'GUEST':
      return routesGuest
    case 'SUB_AGENT':
      return routesSubAgent
    case 'AGENT':
      return routesAgent
    case 'SUPER':
      return routesSuper
    default:
      return routesSuper
  }
}

export const roleRoutes = (role, pathRef, history) => {
  const wlp = window.location.pathname
  if (wlp === '/auth/login' && role !== 'GUEST' && !['/auth/login', '/', ''].includes(pathRef)) {
    log.info('redirect from pathRef:', pathRef)
    setTimeout(() => {history.push(pathRef)}, 0)
    return routerSwitch(role)
  } else {
    return routerSwitch(role)
  }
}

const routesGuest = [
  {
    path: '/',
    exact: true,
    component: () => <Redirect to="/auth/login"/>,
  },
  {
    path: '/auth',
    component: AuthLayout,
    routes: [
      {
        path: '/auth',
        exact: true,
        component: () => <Redirect to="/auth/login"/>,
      },
      {
        path: '/auth/login',
        exact: true,
        component: lazy(() => import('views/Login')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    path: '/errors',
    component: ErrorLayout,
    routes: [
      {
        path: '/errors/error-401',
        exact: true,
        component: lazy(() => import('views/Error401')),
      },
      {
        path: '/errors/error-404',
        exact: true,
        component: lazy(() => import('views/Error404')),
      },
      {
        path: '/errors/error-500',
        exact: true,
        component: lazy(() => import('views/Error500')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    component: () => <Redirect to="/auth/login"/>,
  },
]

const routesSuper = [
  {
    path: '/',
    exact: true,
    component: () => <Redirect to="/policies/list"/>,
  },
  {
    path: '/auth',
    component: AuthLayout,
    routes: [
      {
        path: '/auth/login',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    path: '/errors',
    component: ErrorLayout,
    routes: [
      {
        path: '/errors/error-401',
        exact: true,
        component: lazy(() => import('views/Error401')),
      },
      {
        path: '/errors/error-404',
        exact: true,
        component: lazy(() => import('views/Error404')),
      },
      {
        path: '/errors/error-500',
        exact: true,
        component: lazy(() => import('views/Error500')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    route: '*',
    component: DashboardLayout,
    routes: [
      {
        path: '/policies/editpolicy/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/editpolicy/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/new/:tab',
        exact: true,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/list',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies/doclist',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies/bdx',
        exact: true,
        component: lazy(() => import('views/Bdx')),
      },
      {
        path: '/policies',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      {
        path: '/management/users',
        exact: true,
        component: lazy(() => import('views/Users')),
      },
      {
        path: '/management/users/:id',
        exact: true,
        component: lazy(() => import('views/UserManagementDetails')),
      },
      {
        path: '/management/users/:id/:tab',
        exact: true,
        component: lazy(() => import('views/UserManagementDetails')),
      },
      {
        path: '/management/user/create',
        exact: true,
        component: lazy(() => import('views/UserCreation')),
      },
      {
        path: '/management_reg/registries',
        exact: true,
        component: lazy(() => import('views/Registries')),
      },
      {
        path: '/management_reg/registries/:id',
        exact: true,
        component: lazy(() => import('views/RegistryManagementDetails')),
      },
      {
        path: '/management_reg/registries/:id/:tab',
        exact: true,
        component: lazy(() => import('views/RegistryManagementDetails')),
      },
      {
        path: '/management_reg/registry/create',
        exact: true,
        component: lazy(() => import('views/RegistryCreation')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
]

const routesAgent = [
  {
    path: '/',
    exact: true,
    component: () => <Redirect to="/policies/list"/>,
  },
  {
    path: '/auth',
    component: AuthLayout,
    routes: [
      {
        path: '/auth/login',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    path: '/errors',
    component: ErrorLayout,
    routes: [
      {
        path: '/errors/error-401',
        exact: true,
        component: lazy(() => import('views/Error401')),
      },
      {
        path: '/errors/error-404',
        exact: true,
        component: lazy(() => import('views/Error404')),
      },
      {
        path: '/errors/error-500',
        exact: true,
        component: lazy(() => import('views/Error500')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    route: '*',
    component: DashboardLayout,
    routes: [
      {
        path: '/policies/editpolicy/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/editpolicy/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/new/:tab',
        exact: true,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/list',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies/doclist',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      /* {
         path: '/management/users/:id',
         exact: true,
         component: lazy(() => import('views/UserManagementDetails')),
       },
       {
         path: '/management/users/:id/:tab',
         exact: true,
         component: lazy(() => import('views/UserManagementDetails')),
       },
       {
         path: '/management_reg/registries',
         exact: true,
         component: lazy(() => import('views/Registries')),
       },
       {
         path: '/management_reg/registries/:id',
         exact: true,
         component: lazy(() => import('views/RegistryManagementDetails')),
       },
       {
         path: '/management_reg/registries/:id/:tab',
         exact: true,
         component: lazy(() => import('views/RegistryManagementDetails')),
       },
       {
         path: '/management_reg/registry/create',
         exact: true,
         component: lazy(() => import('views/RegistryCreation')),
       },*/
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
]

const routesSubAgent = [
  {
    path: '/',
    exact: true,
    component: () => <Redirect to="/policies/list"/>,
  },
  {
    path: '/auth',
    component: AuthLayout,
    routes: [
      {
        path: '/auth/login',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    path: '/errors',
    component: ErrorLayout,
    routes: [
      {
        path: '/errors/error-401',
        exact: true,
        component: lazy(() => import('views/Error401')),
      },
      {
        path: '/errors/error-404',
        exact: true,
        component: lazy(() => import('views/Error404')),
      },
      {
        path: '/errors/error-500',
        exact: true,
        component: lazy(() => import('views/Error500')),
      },
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
  {
    route: '*',
    component: DashboardLayout,
    routes: [
      {
        path: '/policies/editpolicy/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/editpolicy/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id/:tab',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      {
        path: '/policies/edit/:id',
        exact: false,
        component: lazy(() => import('views/Policy')),
      },
      /*
      {
        path: '/policies/new/:tab',
        exact: true,
        component: lazy(() => import('views/Policy')),
      },
      */
      {
        path: '/policies/list',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies/doclist',
        exact: true,
        component: lazy(() => import('views/Policies')),
      },
      {
        path: '/policies',
        exact: true,
        component: () => <Redirect to="/policies/list"/>,
      },
      /*  {
          path: '/management/users/:id',
          exact: true,
          component: lazy(() => import('views/UserManagementDetails')),
        },
        {
          path: '/management/users/:id/:tab',
          exact: true,
          component: lazy(() => import('views/UserManagementDetails')),
        },
        {
          path: '/management_reg/registries',
          exact: true,
          component: lazy(() => import('views/Registries')),
        },
        {
          path: '/management_reg/registries/:id',
          exact: true,
          component: lazy(() => import('views/RegistryManagementDetails')),
        },
        {
          path: '/management_reg/registries/:id/:tab',
          exact: true,
          component: lazy(() => import('views/RegistryManagementDetails')),
        },
        {
          path: '/management_reg/registry/create',
          exact: true,
          component: lazy(() => import('views/RegistryCreation')),
        },*/
      {
        component: () => <Redirect to="/errors/error-404"/>,
      },
    ],
  },
]

