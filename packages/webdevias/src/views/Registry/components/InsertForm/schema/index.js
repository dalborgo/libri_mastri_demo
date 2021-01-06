import { object, string } from 'yup'
import { validation } from '@adapter/common'

const schema = object().shape({
  id: string().required('Obbligatorio!'),
  surname: string().required('Obbligatorio!'),
  activity: string().nullable().required('Obbligatorio!'),
  name: string()
    .when('id', {
      is: id => !validation.valGlobalVAT(id),
      then: string().required('Obbligatorio!'),
    }),
})

export default schema
