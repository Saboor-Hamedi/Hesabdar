import { ZodSchema, ZodError } from 'zod'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: Record<string, string>
}

/**
 * Validates any form data against a Zod schema and returns a structured field-to-error map.
 */
export function validateForm<T>(schema: ZodSchema<T>, values: unknown): ValidationResult<T> {
  const result = schema.safeParse(values)

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
    }
  }

  const errors: Record<string, string> = {}
  const zodError = result.error as ZodError

  for (const issue of zodError.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : '_global'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return {
    success: false,
    errors,
  }
}

/**
 * Validates a single field value against a schema.
 */
export function validateField<T>(schema: ZodSchema<T>, fieldName: string, value: unknown): string | null {
  const partial = schema.safeParse({ [fieldName]: value })
  if (partial.success) return null

  const issue = partial.error.issues.find((i) => String(i.path[0]) === fieldName)
  return issue ? issue.message : null
}
