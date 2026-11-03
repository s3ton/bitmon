import { CHANNEL } from './channel'

// Add data-setting="key" to a form control to persist future preferences.
// Only explicitly marked settings are saved; coordinate input is an action, not a preference.
const KEY = 'bitmon:' + CHANNEL + ':settings:v1'
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function savedValues(): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  } catch { /* Storage may be disabled or the saved value invalid. */ }
  return {}
}

function restore(control: Control, value: unknown): void {
  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    if (typeof value === 'boolean') control.checked = value
    return
  }
  if (typeof value !== 'string') return
  if (control instanceof HTMLSelectElement) {
    if ([...control.options].some((option) => option.value === value && !option.disabled)) {
      control.value = value
    }
  } else if (control instanceof HTMLInputElement && ['range', 'number'].includes(control.type)) {
    const number = Number(value)
    if (value.trim() && Number.isFinite(number) &&
        (!control.min || number >= Number(control.min)) &&
        (!control.max || number <= Number(control.max))) control.value = value
  } else {
    control.value = value
  }
}

export function initializeSettings(): void {
  const controls = [...document.querySelectorAll<Control>('[data-setting]')]
  const values = savedValues()
  for (const control of controls) {
    const key = control.dataset.setting
    if (key) restore(control, values[key])
  }

  function save(): void {
    const current: Record<string, string | boolean> = {}
    for (const control of controls) {
      const key = control.dataset.setting
      if (!key) continue
      current[key] = control instanceof HTMLInputElement && control.type === 'checkbox'
        ? control.checked : control.value
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(current))
    } catch { /* The UI remains usable when persistence is unavailable. */ }
  }

  for (const control of controls) control.addEventListener('change', save)
}
