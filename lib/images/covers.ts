import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const COVERS_DIR = path.join(process.cwd(), 'public', 'covers')

function ensureCoverDir() {
  if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true })
}

export async function downloadCover(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    ensureCoverDir()
    const hash = crypto.createHash('sha1').update(url).digest('hex')
    const filename = `${hash}.jpg`
    fs.writeFileSync(path.join(COVERS_DIR, filename), buffer)
    return `/covers/${filename}`
  } catch { return null }
}

export async function saveUploadedCover(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    ensureCoverDir()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`
    fs.writeFileSync(path.join(COVERS_DIR, filename), buffer)
    return `/covers/${filename}`
  } catch { return null }
}
