import { createServer, Server } from 'http'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastXmlRssFetcherAdapter } from '../../../src/main/infrastructure/rss/FastXmlRssFetcherAdapter'
import { NodeCanvasWallpaperPainterAdapter } from '../../../src/main/infrastructure/canvas/NodeCanvasWallpaperPainterAdapter'

describe('Pipeline Integration', () => {
  let server: Server
  let port: number
  const mockRssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
 <title>Mock News Source</title>
 <link>http://mocknews.com</link>
 <description>Mock RSS Feed for testing</description>
 <item>
  <title>The economy of clouds is shifting rapidly</title>
  <link>http://mocknews.com/clouds</link>
 </item>
 <item>
  <title>Geopolitical coffee beans affect local interest rates</title>
  <link>http://mocknews.com/coffee</link>
 </item>
</channel>
</rss>`

  beforeAll(async () => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/xml' })
      res.end(mockRssXml)
    })
    
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (typeof address === 'object' && address) {
          port = address.port
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('successfully fetches feeds and paints wallpaper', async () => {
    const fetcher = new FastXmlRssFetcherAdapter()
    const feeds = [`http://127.0.0.1:${port}/feed.xml`]
    
    const items = await fetcher.fetchAll(feeds)
    expect(items.length).toBe(2)
    expect(items[0].title).toBe('The economy of clouds is shifting rapidly')
    expect(items[0].source).toBe('Mock News Source')

    const painter = new NodeCanvasWallpaperPainterAdapter()
    const phrase = 'the interest rate of clouds fluctuations geopolitical coffee'

    const buffer = await painter.paint({
      phrase,
      theme: 'Midnight',
      fontFamily: 'Outfit',
      animation: 'Fade',
      overlays: { dateTime: true, sourceCredit: true, inspiringHeadlines: true },
      resolution: { width: 800, height: 600 },
      textAlignment: 'center',
      layoutStyle: 'centered',
      vignetteStyle: 'none',
      noiseIntensity: 'none',
      audioFeedback: false,
      enableBold: true,
      enableItalic: true,
      enableNewlines: true,
      enableDifferentFonts: true,
      headlines: items.map((i) => i.title),
      sources: ['Mock News Source']
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer[0]).toBe(0x89)
    expect(buffer[1]).toBe(0x50)
    expect(buffer[2]).toBe(0x4E)
    expect(buffer[3]).toBe(0x47)
  })
})
