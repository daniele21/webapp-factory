import { Highlight, themes } from 'prism-react-renderer'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type CodeBlockProps = {
	code: string
	language?: string
	highlightLines?: number[]
	showCopy?: boolean
}

export const CodeBlock = ({ code, language = 'tsx', highlightLines = [], showCopy = true }: CodeBlockProps) => (
	<div className="relative rounded-2xl border border-border bg-card text-xs text-fg">
		{showCopy && (
			<button
				type="button"
				className="absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] uppercase tracking-wide border-brand-subtle"
				onClick={() => navigator.clipboard.writeText(code)}
			>
				Copy
			</button>
		)}
		<Highlight code={code.trim()} language={language as any} theme={themes.nightOwl}>
			{({ className, style, tokens, getLineProps, getTokenProps }) => (
				<pre className={cn(className, 'overflow-auto rounded-2xl p-5 text-[13px] leading-relaxed')} style={style}>
					{tokens.map((line, index) => (
						<div key={index} {...getLineProps({ line })} className={cn(highlightLines.includes(index + 1) && 'bg-brand-highlight')}>
							<span className="mr-4 text-muted-fg">{index + 1}</span>
							{line.map((token, key) => (
								<span key={key} {...getTokenProps({ token })} />
							))}
						</div>
					))}
				</pre>
			)}
		</Highlight>
	</div>
)

export default CodeBlock
