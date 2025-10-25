import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  as: ComponentType<SVGProps<SVGSVGElement>>
  className?: string
}

export default function Icon({ as: Component, className = '', ...props }: IconProps) {
  const cls = `h-5 w-5 text-fg ${className}`.trim()
  return <Component className={cls} {...props} />
}
