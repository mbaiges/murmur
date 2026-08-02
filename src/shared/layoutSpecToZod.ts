import { z } from 'zod'
import { LayoutContentSpec } from './layoutContentSpecs'

export function layoutSpecToZodSchema(spec: LayoutContentSpec): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of spec.fields) {
    let validator: z.ZodTypeAny = z.string()
    if (!field.required) {
      validator = validator.optional()
    }
    shape[field.key] = validator
  }
  return z.object(shape).strict()
}

export function validateLayoutPayload(
  spec: LayoutContentSpec,
  data: unknown
): { success: true; payload: Record<string, string> } | { success: false; error: string } {
  const schema = layoutSpecToZodSchema(spec)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }

  const payload: Record<string, string> = {}
  for (const field of spec.fields) {
    const value = parsed.data[field.key]
    if (value === undefined || value === null) {
      continue
    }
    if (typeof value !== 'string') {
      return { success: false, error: `Field ${field.key} must be a string` }
    }
    const trimmed = value.trim()
    if (field.required && !trimmed) {
      return { success: false, error: `Required field ${field.key} is empty` }
    }
    if (trimmed) {
      payload[field.key] = trimmed
    }
  }

  for (const field of spec.fields) {
    if (field.required && !payload[field.key]) {
      return { success: false, error: `Missing required field ${field.key}` }
    }
  }

  return { success: true, payload }
}
