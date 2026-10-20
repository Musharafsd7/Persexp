// Copies Tesseract worker, wasm core and English data into public/ so OCR works fully offline in the APK.
import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const out = 'public/tesseract'
mkdirSync(out, { recursive: true })
const tessDir = dirname(require.resolve('tesseract.js/package.json'))
cpSync(join(tessDir, 'dist/worker.min.js'), join(out, 'worker.min.js'))
const coreDir = dirname(require.resolve('tesseract.js-core/package.json', { paths: [tessDir] }))
for (const f of readdirSync(coreDir)) if (/^tesseract-core(-simd)?-lstm\.wasm\.js$/.test(f)) cpSync(join(coreDir, f), join(out, f))
const dataDir = dirname(require.resolve('@tesseract.js-data/eng/package.json'))
const best = join(dataDir, '4.0.0_best_int/eng.traineddata.gz')
cpSync(existsSync(best) ? best : join(dataDir, '4.0.0/eng.traineddata.gz'), join(out, 'eng.traineddata.gz'))
console.log('OCR assets copied:', readdirSync(out).join(', '))
