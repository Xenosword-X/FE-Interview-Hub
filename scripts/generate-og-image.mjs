// scripts/generate-og-image.mjs
// Converts public/og-image.svg -> public/og-image.png (1200x630)
// Run with: node scripts/generate-og-image.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const svgPath = resolve('public/og-image.svg')
const pngPath = resolve('public/og-image.png')

const svg = readFileSync(svgPath)
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: 'Microsoft JhengHei',
  },
})
const png = resvg.render().asPng()
writeFileSync(pngPath, png)
console.log(`Wrote ${pngPath} (${png.length} bytes)`)
