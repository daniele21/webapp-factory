import React from 'react'
import { FactoryForm, TextField, PasswordField, Button } from '../../components/factory'

export const LoginForm = ({ onSubmit }: { onSubmit?: (vals: any) => void }) => {
  return (
    <FactoryForm onSubmit={onSubmit}>
      {() => (
        <div className="max-w-sm">
          <TextField label="Email" name="email" />
          <PasswordField label="Password" name="password" />
        </div>
      )}
    </FactoryForm>
  )
}

export default LoginForm
