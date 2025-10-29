import React from 'react'
import { FactoryForm, TextField, PasswordField } from '../../components/design-system'

export const RegisterForm = ({ onSubmit }: { onSubmit?: (vals: any) => void }) => {
  return (
    <FactoryForm onSubmit={onSubmit}>
      {() => (
        <div className="max-w-sm">
          <TextField label="Full name" name="name" />
          <TextField label="Email" name="email" />
          <PasswordField label="Password" name="password" />
        </div>
      )}
    </FactoryForm>
  )
}

export default RegisterForm
