import { ImageResponse } from 'next/og'
import { getClubConfig } from '@/lib/actions/settings'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const config = await getClubConfig()

  if (config.logoUrl) {
    try {
      const filePath = path.join(process.cwd(), 'public', config.logoUrl)
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(config.logoUrl).slice(1).toLowerCase()
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'webp' ? 'image/webp'
        : ext === 'gif' ? 'image/gif'
        : 'image/png'
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`

      return new ImageResponse(
        // @ts-expect-error JSX in .tsx with next/og
        <img src={dataUrl} style={{ width: 32, height: 32, objectFit: 'contain' }} />,
        { ...size }
      )
    } catch {
      // fall through to default
    }
  }

  // Default: green circle
  return new ImageResponse(
    // @ts-expect-error JSX in .tsx with next/og
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
