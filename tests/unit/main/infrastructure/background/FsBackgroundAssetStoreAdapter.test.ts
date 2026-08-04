import { mkdtempSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { describe, expect, it } from 'vitest'
import { FsBackgroundAssetStoreAdapter } from '../../../../../src/main/infrastructure/background/FsBackgroundAssetStoreAdapter'

describe('FsBackgroundAssetStoreAdapter', () => {
  it('imports png and resolves path', async () => {
    const root = mkdtempSync(join(tmpdir(), 'murmur-bg-'))
    const store = new FsBackgroundAssetStoreAdapter(root)
    const src = join(root, 'source.png')
    writeFileSync(src, Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    const rel = await store.importPersonalPhoto('mon-1', src)
    expect(rel).toBe('mon-1/personal.png')
    expect(store.resolveAbsolutePath(rel)).toBe(join(root, rel))
  })
})
