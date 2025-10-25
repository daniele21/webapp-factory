import fs from 'node:fs'
import path from 'node:path'

// Read tokens from src/app/styles/tokens.json and write generated brand CSS
const src = path.resolve('src/app/styles/tokens.json')
const outDir = path.resolve('src/app/styles')
const data = JSON.parse(fs.readFileSync(src, 'utf8'))

let css = ''
for (const [name, vars] of Object.entries<any>(data.brands)) {
  css += `:root[data-theme="${name}"]{--primary:${vars.primary};--secondary:${vars.secondary};--accent:${vars.accent};}\n`
}
fs.writeFileSync(path.join(outDir, 'brands.generated.css'), css)
console.log('Generated src/app/styles/brands.generated.css')
