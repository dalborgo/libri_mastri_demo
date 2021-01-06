import { initState, resolvers, typeDefs } from '../localstate'
import { ApolloClient } from 'apollo-client'
import { defaultDataIdFromObject, InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { createUploadLink } from 'apollo-upload-client'
import { onError } from 'apollo-link-error'
import { ApolloLink } from 'apollo-link'
import { envConfig } from '../init'
import log from '@adapter/common/src/log'
import introspectionQueryResultData from './fragmentTypes.json'

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          log.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        )
      }
      if (networkError) {
        log.error(`[Network error]: ${networkError}`)
      }
    }),

    new createUploadLink({
      uri: `${envConfig.HOST}/graphql`,
      credentials: 'include',
    }),
  ]),
  resolvers,
  typeDefs,
  cache: new InMemoryCache({ 
    fragmentMatcher,
    dataIdFromObject: object => {
      switch (object.__typename) {
        case 'ChildUser': 
        case 'MainUser': return `User:${object.id}`; 
        default: return defaultDataIdFromObject(object); // fall back to default handling
      }
    },
  }),
})

client.writeData(initState)

export default client

