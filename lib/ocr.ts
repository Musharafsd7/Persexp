import { parseReceipt, type Parsed } from './receipt-parse'

export type OcrResult = Parsed & { rawText: string; confidence: number }

/** Downscale a photo to a JPEG data URL (keeps storage small, speeds up OCR). */
export async function loadImage(file: File, maxSide: number, quality: number): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('Could not read image'))
      i.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

let workerPromise: Promise<import('tesseract.js').Worker> | null = null
let progressCb: ((p: number) => void) | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(async ({ createWorker }) => {
      const w = await createWorker('eng', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract',
        langPath: '/tesseract',
        workerBlobURL: false,
        gzip: true,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') progressCb?.(m.progress)
        },
      })
      // Automatic page segmentation: far better than the default single-block mode on photos (85% vs 32% in testing)
      await w.setParameters({ tessedit_pageseg_mode: '3' as never })
      return w
    })
    workerPromise.catch(() => (workerPromise = null))
  }
  return workerPromise
}

/** Runs fully on-device: worker, wasm and language data are bundled in the app. */
export async function scanReceipt(dataUrl: string, onProgress: (p: number) => void): Promise<OcrResult> {
  progressCb = onProgress
  const worker = await getWorker()
  const { data } = await worker.recognize(dataUrl)
  progressCb = null
  return { ...parseReceipt(data.text), rawText: data.text, confidence: Math.round(data.confidence) }
}
