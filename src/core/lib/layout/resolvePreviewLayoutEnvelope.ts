import type { LayoutContentEnvelope, LayoutStyleName } from '../../domain/types'
import { getLayoutContentSpec } from './layoutContentSpecs'
import { isStructuredMagazineLayout, mockLayoutPayloadForPreview } from './mockLayoutPayloadForPreview'

/** Use committed envelope when layout matches; otherwise mock fields for preview. */
export function resolvePreviewLayoutEnvelope(
  layoutStyle: LayoutStyleName,
  phrase: string,
  committed?: LayoutContentEnvelope | null
): LayoutContentEnvelope | null {
  if (!isStructuredMagazineLayout(layoutStyle)) {
    return null
  }

  if (committed?.layoutStyle === layoutStyle && committed.payload) {
    return committed
  }

  const spec = getLayoutContentSpec(layoutStyle)
  return {
    schemaId: spec.schemaId,
    layoutStyle,
    payload: mockLayoutPayloadForPreview(layoutStyle, phrase)
  }
}
