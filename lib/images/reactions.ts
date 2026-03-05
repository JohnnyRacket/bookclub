import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const REACTIONS_DIR = path.join(process.cwd(), 'public', 'reactions')

function ensureReactionsDir() {
  if (!fs.existsSync(REACTIONS_DIR)) fs.mkdirSync(REACTIONS_DIR, { recursive: true })
}

export function deleteReactionFile(imagePath: string): void {
  try {
    const filename = path.basename(imagePath);
    fs.unlinkSync(path.join(REACTIONS_DIR, filename));
  } catch { /* ignore if already gone */ }
}

export async function saveUploadedReaction(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    ensureReactionsDir()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`
    fs.writeFileSync(path.join(REACTIONS_DIR, filename), buffer)
    return `/reactions/${filename}`
  } catch { return null }
}
