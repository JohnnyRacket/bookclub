import { ImageResponse } from 'next/og'
import { getClubConfig } from '@/lib/actions/settings'
import { db } from '@/lib/db/client'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

async function imageResponseFromPath(filePath: string) {
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/png'
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  return new ImageResponse(
    <img src={dataUrl} style={{ width: 32, height: 32, objectFit: 'contain' }} />,
    { ...size }
  )
}

export default async function Icon() {
  const config = await getClubConfig()

  // Priority 1: current book cover (if bookFavicon enabled)
  if (config.bookFavicon) {
    const book = await db
      .selectFrom('books')
      .select('cover_url')
      .where('status', '=', 'current')
      .executeTakeFirst()

    if (book?.cover_url) {
      try {
        const filePath = path.join(process.cwd(), 'public', book.cover_url)
        return await imageResponseFromPath(filePath)
      } catch {
        // fall through
      }
    }
  }

  // Priority 2: club logo
  if (config.logoUrl) {
    try {
      const filePath = path.join(process.cwd(), 'public', config.logoUrl)
      return await imageResponseFromPath(filePath)
    } catch {
      // fall through
    }
  }

  // Default: green circle
  return new ImageResponse(
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'oklch(0.68 0.18 140)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
    }}>
      📚
    </div>,
    { ...size }
  )
}
