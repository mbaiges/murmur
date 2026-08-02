import { LayoutContentSpec } from '../layout/layoutContentSpecs'
import { layoutContentPreview } from '../layout/layoutContentPreview'
import { LayoutContentEnvelope } from '../../domain/types'

export function payloadToPlainSummary(spec: LayoutContentSpec, payload: Record<string, string>): string {
  const envelope: LayoutContentEnvelope = {
    schemaId: spec.schemaId,
    layoutStyle: spec.layoutStyle,
    payload
  }
  return layoutContentPreview(envelope)
}
