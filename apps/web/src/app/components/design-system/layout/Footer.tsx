import React from 'react'

type FooterProps = {
	children?: React.ReactNode
	className?: string
	copyright?: string
}

export default function Footer({ children, className = '', copyright = '© Webapp Factory' }: FooterProps) {
	return (
		<footer className={`p-4 text-sm ${className}`.trim()}>
			{children ?? copyright}
		</footer>
	)
}

export { Footer }
