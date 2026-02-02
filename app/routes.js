const express = require('express')
const router = express.Router()
const icd10 = require('./data/icd10')
const asaPhysicalStatus = require('./data/asa-physical-status')
const { clinicians, findClinicianByGmc } = require('./data/clinicians')
const { devices, findDeviceByCode } = require('./data/devices')

function normaliseSearchText (value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normaliseGmcNumber (value) {
  return String(value || '')
    .replace(/\D/g, '')
    .trim()
}

function getClinicians (req) {
  return (req.session.data && req.session.data.clinicians) ? req.session.data.clinicians : []
}

function clinicianFullName (c) {
  const first = (c.firstName || '').trim()
  const last = (c.lastName || '').trim()
  const full = `${first} ${last}`.trim()
  return full || (c.name || '').trim()
}

function clinicianMatchesNameQuery (clinician, query) {
  const q = normaliseSearchText(query)
  if (!q) return false

  const full = normaliseSearchText(clinicianFullName(clinician))
  const first = normaliseSearchText(clinician.firstName)
  const last = normaliseSearchText(clinician.lastName)

  const tokens = q.split(' ').filter(Boolean)

  if (tokens.length === 1) {
    return full.includes(tokens[0]) || first.includes(tokens[0]) || last.includes(tokens[0])
  }

  return tokens.every(t => full.includes(t))
}

function findClinicianByGmcLocal (cliniciansList, gmcNumber) {
  const gmc = normaliseGmcNumber(gmcNumber)
  if (!gmc) return null

  return cliniciansList.find(c => normaliseGmcNumber(c.gmc || c.gmcNumber || c.registrationNumber) === gmc) || null
}

function findCliniciansByNameLocal (cliniciansList, nameQuery) {
  const q = normaliseSearchText(nameQuery)
  if (!q) return []

  const results = cliniciansList
    .filter(c => clinicianMatchesNameQuery(c, q))
    .sort((a, b) => clinicianFullName(a).localeCompare(clinicianFullName(b)))

  const seen = new Set()
  const deduped = []

  for (const c of results) {
    const gmc = normaliseGmcNumber(c.gmc || c.gmcNumber || c.registrationNumber)
    const key = gmc ? `gmc:${gmc}` : `name:${normaliseSearchText(clinicianFullName(c))}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(c)
    }
  }

  return deduped
}

function searchClinicians (req, rawQuery) {
  const cliniciansList = getClinicians(req)
  const raw = String(rawQuery || '').trim()

  const gmc = normaliseGmcNumber(raw)
  const q = normaliseSearchText(raw)

  if (gmc) {
    let match = null

    try {
      if (typeof findClinicianByGmc === 'function') {
        match = findClinicianByGmc(gmc)
      }
    } catch (e) {
      match = null
    }

    if (!match) match = findClinicianByGmcLocal(cliniciansList, gmc)

    if (match) return { mode: 'gmc', query: gmc, results: [match] }
    return { mode: 'gmc', query: gmc, results: [] }
  }

  if (q) return { mode: 'name', query: q, results: findCliniciansByNameLocal(cliniciansList, q) }

  return { mode: 'none', query: '', results: [] }
}

function setClinicianForRole (req, role, clinician) {
  req.session.data.selectedClinicians ||= {}
  req.session.data.selectedClinicians[role] = clinician

  const gmc = clinician ? (clinician.gmc || clinician.gmcNumber || clinician.registrationNumber || '') : ''

  if (role === 'responsible-consultant') {
    req.session.data.responsibleConsultant = clinician
    req.session.data.responsibleConsultantGmc = gmc
  }

  if (role === 'supervising-surgeon') {
    req.session.data.supervisingSurgeon = clinician
    req.session.data.supervisingSurgeonGmc = gmc
  }

  if (role === 'operation-lead-surgeon') {
    req.session.data.leadSurgeons ||= []
    if (clinician && req.session.data.leadSurgeons.length < 4) {
      const g = normaliseGmcNumber(gmc)
      const already = req.session.data.leadSurgeons.some(c => normaliseGmcNumber(c.gmc || c.gmcNumber || c.registrationNumber) === g)
      if (!already) req.session.data.leadSurgeons.push(clinician)
    }
  }
}

function getIcd10Label (code) {
  if (!code) return null
  return icd10[String(code).trim()] || null
}

function getLateralityLabel (code) {
  const map = {
    L: 'Left',
    R: 'Right',
    B: 'Both sides',
    M: 'Midline',
    '8': 'Not applicable',
    '9': 'Unknown'
  }

  return map[String(code)] || 'Unknown'
}

function getAsaLabel (value) {
  const map = {
    '1': 'ASA 1 – A normal healthy patient',
    '2': 'ASA 2 – A patient with mild systemic disease',
    '3': 'ASA 3 – A patient with severe systemic disease',
    '4': 'ASA 4 – A patient with severe systemic disease that is a constant threat to life',
    '5': 'ASA 5 – A moribund patient who is not expected to survive without the operation',
    '6': 'ASA 6 – A declared brain-dead patient whose organs are being removed for donor purposes'
  }

  return map[String(value)] || 'Unknown ASA status'
}

function formatDate (isoDate) {
  if (!isoDate) return null

  const date = new Date(isoDate)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}


router.use((req, res, next) => {
  req.session.data ||= {}

  req.session.data.currentUserId = 'user-1'
  req.session.data.currentUser = {
    firstName: 'Gregory',
    lastName: 'House',
    admin: false,
    organisations: ['org-1']
  }

  req.session.data.currentOrganisation = {
    name: 'Leeds General Infirmary',
    type: 'Organisation',
    inbox: []
  }

  req.session.data.organisationSetting = {
    permissionLevel: 'Administrator'
  }

  req.session.data.currentRegistry = { id: 'mdor', name: 'Medical Devices Outcomes Registry (MDOR)' }

  req.session.data.clinicians = clinicians
  req.session.data.devicesCatalogue = devices

  res.locals.data = req.session.data
  res.locals.currentUser = req.session.data.currentUser
  res.locals.currentOrganisation = req.session.data.currentOrganisation
  res.locals.organisationSetting = req.session.data.organisationSetting
  res.locals.currentRegistry = req.session.data.currentRegistry
  res.locals.icd10 = icd10
  res.locals.asaPhysicalStatus = asaPhysicalStatus
  res.locals.getIcd10Label = getIcd10Label
  res.locals.getLateralityLabel = getLateralityLabel
  res.locals.getAsaLabel = getAsaLabel
  res.locals.formatDate = formatDate


  next()
})

router.get('/record-procedure', (req, res) => {
//   delete req.session.data.nhsNumber
//   delete req.session.data.selectedPatient
  res.render('record-procedure/task-list')
})

router.post('/scanner-answer', (req, res) => {
  req.session.data.hasScanner = req.body.hasScanner === 'yes'
  const journey = req.session.data.journey
  if(journey == "singlePatientView") {
    return res.redirect('record-procedure/patient/has-nhs-number')
  } 
  else if (journey == "addProcedure"){
    return res.redirect('/record-procedure/task-list')
  }
})

router.get('/record-procedure/patient/has-nhs-number', (req, res) => {
  res.render('record-procedure/patient/has-nhs-number')
})

router.post('/has-nhs-number-answer', (req, res) => {
  if (req.body.hasNHSNumber === 'yes') return res.redirect('/record-procedure/patient/nhs-number')
  return res.redirect('/record-procedure/patient/patient-search')
})

router.get('/record-procedure/patient/nhs-number', (req, res) => {
  res.render('record-procedure/patient/nhs-number')
})

router.post('/nhs-number-answer', (req, res) => {
  const raw = req.body.nhsNumber || ''
  const nhsNumber = raw.replace(/\s/g, '')

  req.session.data.nhsNumber = raw

  if (nhsNumber.length < 10) {
    req.session.data.nhsNumberErrorMessage = 'The NHS number is too short'
    return res.redirect('/record-procedure/patient/nhs-number')
  }

  delete req.session.data.nhsNumberErrorMessage

  const patients = req.session.data.patients || []
  const patient = patients.find(p => p.nhsNumber === nhsNumber)

  if (!patient) {
    return res.redirect('/record-procedure/patient/patient-search')
  }

  req.session.data.selectedPatient = patient
  return res.redirect('/record-procedure/patient/confirm-patient')
})

router.get('/record-procedure/patient/confirm-patient', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/confirm-patient')
})

router.post('/record-procedure/patient/patient-information-complete', (req, res) => {

const journey = req.session.data.journey

  if(journey == "singlePatientView"){
    return res.redirect('/patient-profile/')
  } 
  else if (journey == "addProcedure") {
    req.session.data.patientInfoComplete = true
  return res.redirect('/record-procedure/task-list')
  }
})

router.get('/record-procedure/patient/enter-weight', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-weight')
})

router.post('/record-procedure/patient/enter-weight', (req, res) => {
  const raw = (req.body.weight || '').trim()

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.weightKg = raw ? Number(raw) : null
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

router.get('/record-procedure/patient/enter-height', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-height')
})

router.post('/record-procedure/patient/enter-height', (req, res) => {
  const raw = (req.body.height || '').trim()

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.heightCm = raw ? Number(raw) : null
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

router.get('/record-procedure/patient/enter-email', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-email')
})

router.post('/record-procedure/patient/enter-email', (req, res) => {
  const email = req.body.emailAddress

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.emailAddress = email
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

router.post('/record-procedure/procedure/procedure-date', (req, res) => {
  const procedureDateToday = req.body.procedureDateToday

  if (procedureDateToday === 'yes') {
    const now = new Date()

    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()

    req.session.data.procedureDate = `${day}/${month}/${year}`

    delete req.session.data.procedureDateDay
    delete req.session.data.procedureDateMonth
    delete req.session.data.procedureDateYear
  } else {
    const day = String(req.body.procedureDateDay || '').padStart(2, '0')
    const month = String(req.body.procedureDateMonth || '').padStart(2, '0')
    const year = String(req.body.procedureDateYear || '').trim()

    if (!day || !month || !year) {
      req.session.data.procedureDateError = 'Enter the date of the procedure'
      return res.redirect('/record-procedure/procedure/procedure-date')
    }

    req.session.data.procedureDate = `${day}/${month}/${year}`

    req.session.data.procedureDateDay = day
    req.session.data.procedureDateMonth = month
    req.session.data.procedureDateYear = year

    delete req.session.data.procedureDateError
  }

  return res.redirect('/record-procedure/procedure/procedure-time')
})

router.post('/record-procedure/procedure/procedure-time', (req, res) => {
  let procedureTime = (req.body.procedureTime || '').trim()

  procedureTime = procedureTime.replace(/\s+/g, '')

  if (!procedureTime.includes(':')) {
    if (procedureTime.length === 3) {
      procedureTime = `0${procedureTime[0]}:${procedureTime.slice(1)}`
    } else if (procedureTime.length === 4) {
      procedureTime = `${procedureTime.slice(0, 2)}:${procedureTime.slice(2)}`
    }
  }

  req.session.data.procedureTime = procedureTime

  res.redirect('/record-procedure/procedure/primary-diagnosis')
})

router.post('/record-procedure/procedure/primary-diagnosis', (req, res) => {
  const code = req.body.primaryDiagnosisCode

  if (!req.session.data.diagnosisCodes) req.session.data.diagnosisCodes = []

  if (code && !req.session.data.diagnosisCodes.includes(code)) {
    req.session.data.diagnosisCodes.push(code)
  }

  return res.redirect('/record-procedure/procedure/diagnosis-summary')
})

router.get('/record-procedure/procedure/add-diagnosis', (req, res) => {
  res.render('record-procedure/procedure/add-diagnosis')
})

router.post('/record-procedure/procedure/add-diagnosis', (req, res) => {
  const code = req.body.diagnosisCode

  req.session.data.diagnosisCodes ||= []

  if (!code) {
    req.session.data.addDiagnosisError = 'Select a diagnosis code'
    return res.redirect('/record-procedure/procedure/add-diagnosis')
  }

  if (req.session.data.diagnosisCodes.includes(code)) {
    req.session.data.addDiagnosisError = 'That diagnosis has already been added'
    return res.redirect('/record-procedure/procedure/add-diagnosis')
  }

  req.session.data.diagnosisCodes.push(code)
  delete req.session.data.addDiagnosisError

  return res.redirect('/record-procedure/procedure/diagnosis-summary')
})

router.post('/record-procedure/procedure/physical-status', (req, res) => {
  const asa = req.body.asaClassification

  if (!asa) {
    req.session.data.asaClassificationError = 'Select the patient’s physical status'
    return res.redirect('/record-procedure/procedure/physical-status')
  }

  req.session.data.currentOperation ||= {}
  req.session.data.currentOperation.asaClassification = asa

  delete req.session.data.asaClassificationError

  return res.redirect('/record-procedure/procedure/operation-details')
})

router.post('/record-procedure/procedure/operation-details', (req, res) => {
  req.session.data.currentOperation ||= {}

  req.session.data.currentOperation.operationOutcome = req.body.operationOutcome
  req.session.data.currentOperation.operationOutcomeOtherDetail = req.body.operationOutcomeOtherDetail || ''
  req.session.data.currentOperation.laterality = req.body.laterality

  return res.redirect('/record-procedure/procedure/operation-summary')
})

router.get('/record-procedure/procedure/operation-summary', (req, res) => {
  res.render('record-procedure/procedure/operation-summary')
})

router.post('/record-procedure/procedure/confirm', (req, res) => {
  const patient = req.session.data.selectedPatient
  if (!patient) {
    return res.redirect('/record-procedure/patient/nhs-number')
  }

  patient.procedures ||= []

  const diagnosisCodes = req.session.data.diagnosisCodes || []
  const op = req.session.data.currentOperation || {}

  const newProcedure = {
    id: `proc-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    date: req.session.data.procedureDate || null,
    time: req.session.data.procedureTime || null,
    primaryDiagnosisCode: diagnosisCodes[0] || null,
    additionalDiagnosisCodes: diagnosisCodes.slice(1),
    asaClassification: op.asaClassification || null,
    operationOutcome: op.operationOutcome || null,
    operationOutcomeOtherDetail: op.operationOutcomeOtherDetail || '',
    laterality: op.laterality || null,
    clinicians: {
      responsibleConsultant: req.session.data.responsibleConsultant || null,
      supervisingSurgeon: req.session.data.supervisingSurgeon || null,
      leadSurgeons: req.session.data.leadSurgeons || []
    },
    devices: req.session.data.currentOperationDevices || []
  }

  patient.procedures.push(newProcedure)

  delete req.session.data.currentOperation
  delete req.session.data.diagnosisCodes
  delete req.session.data.procedureDate
  delete req.session.data.procedureTime
  delete req.session.data.currentOperationDevices

  req.session.data.procedureDetailsComplete = true

  return res.redirect('/record-procedure/task-list')
})

router.get('/record-procedure/clinician/find', (req, res) => {
  const err = String(req.query.err || '').trim()
  const q = String(req.query.q || '').trim()

  req.session.data.clinicianSearch ||= { query: '', mode: 'none', results: [] }
  if (q) req.session.data.clinicianSearch.query = q

  if (err === 'empty') req.session.data.clinicianLookupError = 'Enter a name or GMC number'
  else if (err === 'notfound') req.session.data.clinicianLookupError = 'We could not find a clinician with those details'
  else delete req.session.data.clinicianLookupError

  res.render('record-procedure/clinician/find')
})

router.post('/record-procedure/clinician/find', (req, res) => {
  const raw = String((req.body && req.body.clinicianSearch) || '').trim()
  const search = searchClinicians(req, raw)

  req.session.data.clinicianSearch = {
    query: raw,
    mode: search.mode,
    results: search.results
  }

  if (search.mode === 'none') return res.redirect('/record-procedure/clinician/find?err=empty')
  if (search.results.length === 1) {
    const one = search.results[0]
    const gmc = normaliseGmcNumber(one.gmc || one.gmcNumber || one.registrationNumber || '')
    return res.redirect(`/record-procedure/clinician/assign?gmc=${encodeURIComponent(gmc)}&q=${encodeURIComponent(raw)}`)
  }
  if (search.results.length > 1) return res.redirect(`/record-procedure/clinician/results?q=${encodeURIComponent(raw)}`)
  return res.redirect(`/record-procedure/clinician/find?err=notfound&q=${encodeURIComponent(raw)}`)
})

router.get('/record-procedure/clinician/results', (req, res) => {
  const q = String(req.query.q || '').trim()

  let search = req.session.data.clinicianSearch

  if ((!search || !Array.isArray(search.results) || search.results.length < 2) && q) {
    const rebuilt = searchClinicians(req, q)
    req.session.data.clinicianSearch = {
      query: q,
      mode: rebuilt.mode,
      results: rebuilt.results
    }
    search = req.session.data.clinicianSearch

    if (rebuilt.results.length === 1) {
      const one = rebuilt.results[0]
      const gmc = normaliseGmcNumber(one.gmc || one.gmcNumber || one.registrationNumber || '')
      return res.redirect(`/record-procedure/clinician/assign?gmc=${encodeURIComponent(gmc)}&q=${encodeURIComponent(q)}`)
    }

    if (rebuilt.results.length === 0) {
      return res.redirect(`/record-procedure/clinician/find?err=notfound&q=${encodeURIComponent(q)}`)
    }
  }

  if (!search || !Array.isArray(search.results) || search.results.length < 2) {
    return res.redirect('/record-procedure/clinician/find')
  }

  delete req.session.data.clinicianLookupError

  res.render('record-procedure/clinician/results', {
    query: search.query,
    results: search.results
  })
})

router.post('/record-procedure/clinician/results', (req, res) => {
  const search = req.session.data.clinicianSearch
  const selectedGmc = normaliseGmcNumber(req.body.selectedClinicianGmc || '')

  if (!selectedGmc) {
    req.session.data.clinicianLookupError = 'Select a clinician'
    return res.redirect(`/record-procedure/clinician/results?q=${encodeURIComponent((search && search.query) || '')}`)
  }

  return res.redirect(`/record-procedure/clinician/assign?gmc=${encodeURIComponent(selectedGmc)}&q=${encodeURIComponent((search && search.query) || '')}`)
})

router.get('/record-procedure/clinician/assign', (req, res) => {
  const gmc = normaliseGmcNumber(req.query.gmc || '')
  const q = String(req.query.q || '').trim()

  if (!gmc) return res.redirect('/record-procedure/clinician/find')

  const clinician = findClinicianByGmcLocal(getClinicians(req), gmc)
  if (!clinician) return res.redirect(`/record-procedure/clinician/find?err=notfound&q=${encodeURIComponent(q)}`)

  delete req.session.data.clinicianLookupError

  res.render('record-procedure/clinician/assign', { clinician })
})

router.post('/record-procedure/clinician/assign', (req, res) => {
  const gmc = normaliseGmcNumber(req.query.gmc || req.body.gmc || '')
  const role = String(req.body.clinicianRole || '').trim()

  if (!gmc) return res.redirect('/record-procedure/clinician/find')

  const clinician = findClinicianByGmcLocal(getClinicians(req), gmc)
  if (!clinician) return res.redirect('/record-procedure/clinician/find?err=notfound')

  if (!role) {
    req.session.data.clinicianLookupError = 'Select a role'
    return res.redirect(`/record-procedure/clinician/assign?gmc=${encodeURIComponent(gmc)}`)
  }

  setClinicianForRole(req, role, clinician)
  return res.redirect('/record-procedure/clinician/clinicians-summary')
})

router.get('/record-procedure/clinician/clinicians-summary', (req, res) => {
  req.session.data.leadSurgeons ||= []
  res.render('record-procedure/clinician/clinicians-summary')
})

router.post('/record-procedure/clinician/clinicians-summary', (req, res) => {
  req.session.data.clinicianDetailsComplete = true
  return res.redirect('/record-procedure/task-list')
})

router.get('/record-procedure/devices/add-devices', (req, res) => {
  req.session.data.currentOperationDevices ||= []
  res.render('record-procedure/devices/add-devices')
})

router.post('/record-procedure/devices/add-devices/add', (req, res) => {
  req.session.data.currentOperationDevices ||= []

  if (req.session.data.hasScanner) {
    return res.redirect('/record-procedure/devices/scan-device')
  }

  return res.redirect('/record-procedure/devices/select-device')
})

router.get('/record-procedure/devices/scan-device', (req, res) => {
  req.session.data.currentOperationDevices ||= []
  req.session.data.scannedDeviceCode ||= ''
  req.session.data.scannedUdi ||= req.session.data.scannedDeviceCode
  req.session.data.deviceToConfirm = null
  res.render('record-procedure/devices/scan-device')
})

router.post('/record-procedure/devices/scan-device', (req, res) => {
  req.session.data.currentOperationDevices ||= []

  const scanned = (req.body.scannedDeviceCode || req.body.scannedUdi || '').trim()

  req.session.data.scannedDeviceCode = scanned
  req.session.data.scannedUdi = scanned

  if (!scanned) {
    req.session.data.deviceScanError = 'Enter the device barcode'
    req.session.data.deviceToConfirm = null
    return res.redirect('/record-procedure/devices/scan-device')
  }

  const found = findDeviceByCode(scanned)
  req.session.data.deviceToConfirm = found

  if (!found) {
    req.session.data.deviceScanError = 'No device has been found with that barcode.'
    req.session.data.deviceToConfirm = null
    return res.redirect('/record-procedure/devices/scan-device')
  }

  const alreadyAdded = req.session.data.currentOperationDevices.some(
    d => d.uniqueDeviceIdentifier === found.uniqueDeviceIdentifier
  )

  if (alreadyAdded) {
    req.session.data.deviceScanError = 'Scan a different device.'
    req.session.data.deviceToConfirm = null
    return res.redirect('/record-procedure/devices/scan-device')
  }

  delete req.session.data.deviceScanError
  return res.redirect('/record-procedure/devices/confirm-device')
})

router.get('/record-procedure/devices/confirm-device', (req, res) => {
  if (!req.session.data.deviceToConfirm) {
    return res.redirect('/record-procedure/devices/add-devices')
  }

  res.render('record-procedure/devices/confirm-device')
})

router.post('/record-procedure/devices/confirm-device', (req, res) => {
  req.session.data.currentOperationDevices ||= []

  const device = req.session.data.deviceToConfirm

  if (device) {
    const alreadyAdded = req.session.data.currentOperationDevices.some(
      d => d.uniqueDeviceIdentifier === device.uniqueDeviceIdentifier
    )

    if (!alreadyAdded) {
      req.session.data.currentOperationDevices.push(device)
    }
  }

  req.session.data.deviceToConfirm = null
  req.session.data.scannedDeviceCode = ''
  req.session.data.scannedUdi = ''

  return res.redirect('/record-procedure/devices/add-devices')
})

router.get('/record-procedure/devices/select-device', (req, res) => {
  req.session.data.deviceToConfirm = null
  res.render('record-procedure/devices/select-device')
})

router.post('/record-procedure/devices/select-device', (req, res) => {
  req.session.data.currentOperationDevices ||= []

  const selectedDeviceCode = (req.body.selectedDeviceCode || req.body.selectedUdi || '').trim()
  req.session.data.selectedDeviceCode = selectedDeviceCode

  const found = findDeviceByCode(selectedDeviceCode)
  req.session.data.deviceToConfirm = found

  if (!found) {
    req.session.data.deviceSelectError = 'Select a device'
    return res.redirect('/record-procedure/devices/select-device')
  }

  const alreadyAdded = req.session.data.currentOperationDevices.some(
    d => d.uniqueDeviceIdentifier === found.uniqueDeviceIdentifier
  )

  if (alreadyAdded) {
    req.session.data.deviceSelectError = 'This device has already been added'
    req.session.data.deviceToConfirm = null
    return res.redirect('/record-procedure/devices/select-device')
  }

  delete req.session.data.deviceSelectError
  return res.redirect('/record-procedure/devices/confirm-device')
})

router.post('/record-procedure/devices/add-devices', (req, res) => {
  req.session.data.deviceDetailsComplete = true
  return res.redirect('/record-procedure/task-list')
})

function normaliseProcedureDate (value) {
  const v = String(value || '').trim()
  if (!v) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`
  }

  return v
}


router.post('/record-procedure/confirmation', (req, res) => {
  const patient = req.session.data.selectedPatient
  if (!patient) return res.redirect('/record-procedure/patient/nhs-number')

  patient.procedures ||= []

  const diagnosisCodes = req.session.data.diagnosisCodes || []
  const op = req.session.data.currentOperation || {}

  const newProcedure = {
    id: `proc-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    date: normaliseProcedureDate(req.session.data.procedureDate || null),
    time: req.session.data.procedureTime || null,
    primaryDiagnosisCode: diagnosisCodes[0] || null,
    additionalDiagnosisCodes: diagnosisCodes.slice(1),
    asaClassification: op.asaClassification || null,
    operationOutcome: op.operationOutcome || null,
    operationOutcomeOtherDetail: op.operationOutcomeOtherDetail || '',
    laterality: op.laterality || null,
    clinicians: {
      responsibleConsultant: req.session.data.responsibleConsultant || null,
      supervisingSurgeon: req.session.data.supervisingSurgeon || null,
      leadSurgeons: req.session.data.leadSurgeons || []
    },
    devices: req.session.data.currentOperationDevices || []
  }

  patient.procedures.push(newProcedure)

//   patient.devices = buildPatientDevices(patient.procedures)

  return res.redirect('/record-procedure/confirmation')
})


router.get('/start-prototype', (req, res) => {
    const journey = req.query.journey
    console.log("Launching prototype journey: " + journey)
    req.session.data.journey = journey
    return res.redirect('barcode-scanner')
})

function clone (obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : null
}

function inferDeviceStatus (procedure, device) {
  if (device && device.status) return device.status
  const outcome = procedure && procedure.operationOutcome
  if (outcome === 'device-removal') return 'Removed'
  return 'Implanted'
}

function buildPatientDevices (procedures) {
  return (procedures || []).flatMap(p => {
    const procId = p.id
    return (p.devices || []).map(d => ({
      procedureId: procId,
      procedureDate: p.date || null,
      status: inferDeviceStatus(p, d),
      ...clone(d)
    }))
  })
}

function getReturnTo (req) {
  const v = req.session.data && req.session.data.returnTo
  return v ? String(v) : ''
}

function inEditMode (req) {
  return Boolean(req.session.data && req.session.data.editingProcedureId)
}

function redirectAfterChange (req, res, fallback) {
  const returnTo = getReturnTo(req)
  if (returnTo && inEditMode(req)) return res.redirect(returnTo)
  return res.redirect(fallback)
}

function seedProcedureEditSession (req, procedure) {
  req.session.data.editingProcedureId = procedure.id

  req.session.data.procedureDate = procedure.date || null
  req.session.data.procedureTime = procedure.time || null

  const codes = []
  if (procedure.primaryDiagnosisCode) codes.push(procedure.primaryDiagnosisCode)
  if (procedure.additionalDiagnosisCodes && procedure.additionalDiagnosisCodes.length) {
    codes.push(...procedure.additionalDiagnosisCodes)
  }
  req.session.data.diagnosisCodes = codes

  req.session.data.currentOperation ||= {}
  req.session.data.currentOperation.asaClassification = procedure.asaClassification || null
  req.session.data.currentOperation.operationOutcome = procedure.operationOutcome || null
  req.session.data.currentOperation.operationOutcomeOtherDetail = procedure.operationOutcomeOtherDetail || ''
  req.session.data.currentOperation.laterality = procedure.laterality || null

  req.session.data.currentOperationDevices = clone(procedure.devices || [])

  const clinicians = procedure.clinicians || {}
  req.session.data.responsibleConsultant = clinicians.responsibleConsultant || null
  req.session.data.supervisingSurgeon = clinicians.supervisingSurgeon || null
  req.session.data.leadSurgeons = clinicians.leadSurgeons || []
}

function normaliseProcedureDate (value) {
  const v = String(value || '').trim()
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`

  return v
}

function updateProcedureFromSession (req, procedure) {
  const diagnosisCodes = req.session.data.diagnosisCodes || []
  const op = req.session.data.currentOperation || {}

  procedure.date = normaliseProcedureDate(req.session.data.procedureDate || null)
  procedure.time = req.session.data.procedureTime || null
  procedure.primaryDiagnosisCode = diagnosisCodes[0] || null
  procedure.additionalDiagnosisCodes = diagnosisCodes.slice(1)
  procedure.asaClassification = op.asaClassification || null
  procedure.operationOutcome = op.operationOutcome || null
  procedure.operationOutcomeOtherDetail = op.operationOutcomeOtherDetail || ''
  procedure.laterality = op.laterality || null

  procedure.clinicians = {
    responsibleConsultant: req.session.data.responsibleConsultant || null,
    supervisingSurgeon: req.session.data.supervisingSurgeon || null,
    leadSurgeons: req.session.data.leadSurgeons || []
  }

  procedure.devices = (req.session.data.currentOperationDevices || []).map(d => ({
    ...d,
    status: d.status || inferDeviceStatus(procedure, d)
  }))
}

router.use((req, res, next) => {
  req.session.data ||= {}

  if (req.query && req.query.returnTo) {
    req.session.data.returnTo = String(req.query.returnTo)
  }

  // keep patient.devices in sync
  if (req.session.data.selectedPatient && req.session.data.selectedPatient.procedures) {
    req.session.data.selectedPatient.devices = buildPatientDevices(req.session.data.selectedPatient.procedures)
  }

  next()
})

router.get('/patient-profile/procedures/:procedureId', (req, res) => {
  const patient = req.session.data.selectedPatient
  if (!patient) return res.redirect('/record-procedure/patient/nhs-number')

  const procedure = (patient.procedures || []).find(p => p.id === req.params.procedureId)
  if (!procedure) return res.redirect('/patient-profile/')

  req.session.data.returnTo = `/patient-profile/procedures/${procedure.id}`
  seedProcedureEditSession(req, procedure)

  return res.render('patient-profile/procedure-details', { procedure })
})

router.post('/patient-profile/procedures/:procedureId/save', (req, res) => {
  const patient = req.session.data.selectedPatient
  if (!patient) return res.redirect('/record-procedure/patient/nhs-number')

  const procedure = (patient.procedures || []).find(p => p.id === req.params.procedureId)
  if (!procedure) return res.redirect('/patient-profile/')

  updateProcedureFromSession(req, procedure)
  patient.devices = buildPatientDevices(patient.procedures)

  delete req.session.data.returnTo
  delete req.session.data.editingProcedureId

  return res.redirect('/patient-profile/')
})

router.get('/patient-profile/devices/:udi', (req, res) => {
  const patient = req.session.data.selectedPatient
  if (!patient) return res.redirect('/record-procedure/patient/nhs-number')

  const udi = String(req.params.udi || '')
  const devices = patient.devices || []
  const device = devices.find(d =>
    String(d.uniqueDeviceIdentifier || d.selectedDeviceCode || '') === udi
  )

  if (!device) return res.redirect('/patient-profile/')

  const procedure = (patient.procedures || []).find(p => p.id === device.procedureId) || null

  return res.render('patient-profile/device-details', { device, procedure })
})



module.exports = router
