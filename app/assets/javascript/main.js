// ES6 or Vanilla JavaScript

/* global accessibleAutocomplete */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#primaryDiagnosisCode-container')
  const hidden = document.querySelector('#primaryDiagnosisCode')

  if (!container || !hidden || typeof accessibleAutocomplete === 'undefined') return

  // Prototype dataset (swap later for real ICD list / API)
  const icd = [
    { code: 'H25.9', label: 'Senile cataract, unspecified' },
    { code: 'H40.11', label: 'Primary open-angle glaucoma' },
    { code: 'M16.9', label: 'Osteoarthritis of hip, unspecified' },
    { code: 'K40.9', label: 'Inguinal hernia, without obstruction or gangrene' }
  ]

  function source(query, populate) {
    const q = (query || '').trim().toLowerCase()
    if (!q) return populate([])

    const results = icd
      .filter(d =>
        d.code.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q)
      )
      .slice(0, 20)

    populate(results)
  }

  accessibleAutocomplete({
    element: container,
    id: 'primaryDiagnosisCode-autocomplete',
    name: 'primaryDiagnosisCode-autocomplete', // not submitted; hidden field is
    source,
    minLength: 2,
    autoselect: true,
    confirmOnBlur: false,
    placeholder: 'Start typing to search',
    templates: {
      suggestion: d => `${d.code} — ${d.label}`,
      inputValue: d => `${d.code} — ${d.label}`
    },
    onConfirm: (selected) => {
      // selected is the object from the results array
      hidden.value = selected ? selected.code : ''
    }
  })
})
