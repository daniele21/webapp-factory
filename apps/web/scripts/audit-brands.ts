import fs from 'fs'
import path from 'path'

const stylesDir = path.resolve('src/app/styles')
const files = (fs.readdirSync(stylesDir) as string[]).filter((f: string) => f.endsWith('.css'))

let problems: string[] = []
for (const file of files) {
  const content = fs.readFileSync(path.join(stylesDir, file), 'utf8')
  // Find :root[data-theme="..."] blocks
  const re = /:root\[data-theme="([^"]+)"\]([^}]*\})/gms
  let m
  while ((m = re.exec(content)) !== null) {
    const theme = m[1]
    const block = m[2]
    // Check for any CSS property inside block not starting with '--' (ignore comments and whitespace)
  const props = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('/*') && !l.startsWith('}'))
    for (const p of props) {
      const propName = p.split(':')[0].trim()
      if (!propName.startsWith('--')) {
        problems.push(`${file} -> theme=${theme} contains non-variable property: ${p}`)
      }
    }
  }
}

if (problems.length === 0) {
  console.log('audit-brands: OK — all brand blocks contain only CSS variables')
  process.exit(0)
} else {
  console.error('audit-brands: Found issues:')
  for (const prob of problems) console.error(' - ' + prob)
  process.exit(2)
}
