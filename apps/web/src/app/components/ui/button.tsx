import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-bg',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-fg hover:opacity-90',
        secondary: 'bg-secondary text-secondary-fg hover:opacity-90',
        ghost: 'hover:bg-muted',
        outline: 'border border-border hover:bg-muted',
        destructive: 'bg-destructive text-destructive-fg hover:opacity-90',
      },
      size: { sm: 'h-8 px-3', md: 'h-9 px-4', lg: 'h-10 px-6' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'