// app/routes.js

const express = require('express')
const router = express.Router()
const icd10 = require('./data/icd10')
const asaPhysicalStatus = require('./data/asa-physical-status')
const { clinicians, findClinicianByGmc } = require('./data/clinicians')
const { devices, findDeviceByCode } = require('./data/devices')

/* Function: session bootstrap */
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

  next()
})

/* Function: GET /record-procedure */
router.get('/record-procedure', (req, res) => {
  delete req.session.data.nhsNumber
  delete req.session.data.selectedPatient
  res.render('record-procedure/barcode-scanner')
})

/* Function: POST /scanner-answer */
router.post('/scanner-answer', (req, res) => {
  req.session.data.hasScanner = req.body.hasScanner === 'yes'
  res.redirect('record-procedure/task-list')
})

/* Function: GET /record-procedure/patient/has-nhs-number */
router.get('/record-procedure/patient/has-nhs-number', (req, res) => {
  res.render('record-procedure/patient/has-nhs-number')
})

/* Function: POST /has-nhs-number-answer */
router.post('/has-nhs-number-answer', (req, res) => {
  if (req.body.hasNHSNumber === 'yes') return res.redirect('/record-procedure/patient/nhs-number')
  return res.redirect('/record-procedure/patient/patient-search')
})

/* Function: GET /record-procedure/patient/nhs-number */
router.get('/record-procedure/patient/nhs-number', (req, res) => {
  res.render('record-procedure/patient/nhs-number')
})

/* Function: POST /nhs-number-answer */
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

/* Function: GET /record-procedure/patient/confirm-patient */
router.get('/record-procedure/patient/confirm-patient', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/confirm-patient')
})

/* Function: POST /record-procedure/patient/patient-information-complete */
router.post('/record-procedure/patient/patient-information-complete', (req, res) => {
  req.session.data.patientInfoComplete = true
  return res.redirect('/record-procedure/task-list')
})

/* Function: GET /record-procedure/patient/enter-weight */
router.get('/record-procedure/patient/enter-weight', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-weight')
})

/* Function: POST /record-procedure/patient/enter-weight */
router.post('/record-procedure/patient/enter-weight', (req, res) => {
  const raw = (req.body.weight || '').trim()

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.weightKg = raw ? Number(raw) : null
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

/* Function: GET /record-procedure/patient/enter-height */
router.get('/record-procedure/patient/enter-height', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-height')
})

/* Function: POST /record-procedure/patient/enter-height */
router.post('/record-procedure/patient/enter-height', (req, res) => {
  const raw = (req.body.height || '').trim()

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.heightCm = raw ? Number(raw) : null
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

/* Function: GET /record-procedure/patient/enter-email */
router.get('/record-procedure/patient/enter-email', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/enter-email')
})

/* Function: POST /record-procedure/patient/enter-email */
router.post('/record-procedure/patient/enter-email', (req, res) => {
  const email = req.body.emailAddress

  if (req.session.data.selectedPatient) {
    req.session.data.selectedPatient.emailAddress = email
  }

  res.redirect('/record-procedure/patient/confirm-patient')
})

/* Function: POST /record-procedure/procedure/procedure-date */
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

/* Function: POST /record-procedure/procedure/procedure-time */
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

/* Function: POST /record-procedure/procedure/primary-diagnosis */
router.post('/record-procedure/procedure/primary-diagnosis', (req, res) => {
  const code = req.body.primaryDiagnosisCode

  if (!req.session.data.diagnosisCodes) req.session.data.diagnosisCodes = []

  if (code && !req.session.data.diagnosisCodes.includes(code)) {
    req.session.data.diagnosisCodes.push(code)
  }

  return res.redirect('/record-procedure/procedure/diagnosis-summary')
})

/* Function: GET /record-procedure/procedure/add-diagnosis */
router.get('/record-procedure/procedure/add-diagnosis', (req, res) => {
  res.render('record-procedure/procedure/add-diagnosis')
})

/* Function: POST /record-procedure/procedure/add-diagnosis */
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

/* Function: POST /record-procedure/procedure/physical-status */
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

/* Function: POST /record-procedure/procedure/operation-details */
router.post('/record-procedure/procedure/operation-details', (req, res) => {
  req.session.data.currentOperation ||= {}

  req.session.data.currentOperation.operationOutcome = req.body.operationOutcome
  req.session.data.currentOperation.operationOutcomeOtherDetail = req.body.operationOutcomeOtherDetail || ''
  req.session.data.currentOperation.laterality = req.body.laterality

  return res.redirect('/record-procedure/procedure/operation-summary')
})

/* Function: GET /record-procedure/procedure/operation-summary */
router.get('/record-procedure/procedure/operation-summary', (req, res) => {
  res.render('record-procedure/procedure/operation-summary')
})

/* Function: POST /record-procedure/procedure/confirm */
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

/* Function: GET /record-procedure/clinician/responsible-consultant */
router.get('/record-procedure/clinician/responsible-consultant', (req, res) => {
  res.render('record-procedure/clinician/responsible-consultant')
})

/* Function: POST /record-procedure/clinician/responsible-consultant */
router.post('/record-procedure/clinician/responsible-consultant', (req, res) => {
  const gmc = (req.session.data.responsibleConsultantGmc || '').trim()
  req.session.data.responsibleConsultant = findClinicianByGmc(gmc)

  if (!req.session.data.responsibleConsultant) {
    req.session.data.clinicianLookupError = 'We could not find a clinician with that GMC number'
    return res.redirect('/record-procedure/clinician/responsible-consultant')
  }

  delete req.session.data.clinicianLookupError
  return res.redirect('/record-procedure/clinician/confirm-responsible-consultant')
})

/* Function: GET /record-procedure/clinician/confirm-responsible-consultant */
router.get('/record-procedure/clinician/confirm-responsible-consultant', (req, res) => {
  res.render('record-procedure/clinician/confirm-responsible-consultant')
})

/* Function: POST /record-procedure/clinician/confirm-responsible-consultant */
router.post('/record-procedure/clinician/confirm-responsible-consultant', (req, res) => {
  res.redirect('/record-procedure/clinician/supervising-surgeon')
})

/* Function: GET /record-procedure/clinician/supervising-surgeon */
router.get('/record-procedure/clinician/supervising-surgeon', (req, res) => {
  res.render('record-procedure/clinician/supervising-surgeon')
})

/* Function: POST /record-procedure/clinician/supervising-surgeon */
router.post('/record-procedure/clinician/supervising-surgeon', (req, res) => {
  const gmc = (req.session.data.supervisingSurgeonGmc || '').trim()
  req.session.data.supervisingSurgeon = findClinicianByGmc(gmc)

  if (!req.session.data.supervisingSurgeon) {
    req.session.data.clinicianLookupError = 'We could not find a clinician with that GMC number'
    return res.redirect('/record-procedure/clinician/supervising-surgeon')
  }

  delete req.session.data.clinicianLookupError
  return res.redirect('/record-procedure/clinician/confirm-supervising-surgeon')
})

/* Function: GET /record-procedure/clinician/confirm-supervising-surgeon */
router.get('/record-procedure/clinician/confirm-supervising-surgeon', (req, res) => {
  res.render('record-procedure/clinician/confirm-supervising-surgeon')
})

/* Function: POST /record-procedure/clinician/confirm-supervising-surgeon */
router.post('/record-procedure/clinician/confirm-supervising-surgeon', (req, res) => {
  res.redirect('/record-procedure/clinician/operation-lead-surgeon')
})

/* Function: GET /record-procedure/clinician/operation-lead-surgeon */
router.get('/record-procedure/clinician/operation-lead-surgeon', (req, res) => {
  req.session.data.leadSurgeons ||= []
  res.render('record-procedure/clinician/operation-lead-surgeon')
})

/* Function: POST /record-procedure/clinician/operation-lead-surgeon */
router.post('/record-procedure/clinician/operation-lead-surgeon', (req, res) => {
  const gmc = (req.session.data.leadSurgeonGmc || '').trim()
  req.session.data.leadSurgeon = findClinicianByGmc(gmc)

  if (!req.session.data.leadSurgeon) {
    req.session.data.clinicianLookupError = 'We could not find a clinician with that GMC number'
    return res.redirect('/record-procedure/clinician/operation-lead-surgeon')
  }

  delete req.session.data.clinicianLookupError
  return res.redirect('/record-procedure/clinician/confirm-operation-lead-surgeon')
})

/* Function: GET /record-procedure/clinician/confirm-operation-lead-surgeon */
router.get('/record-procedure/clinician/confirm-operation-lead-surgeon', (req, res) => {
  req.session.data.leadSurgeons ||= []
  res.render('record-procedure/clinician/confirm-operation-lead-surgeon')
})

/* Function: POST /record-procedure/clinician/confirm-operation-lead-surgeon */
router.post('/record-procedure/clinician/confirm-operation-lead-surgeon', (req, res) => {
  req.session.data.leadSurgeons ||= []

  if (req.session.data.leadSurgeon && req.session.data.leadSurgeons.length < 4) {
    req.session.data.leadSurgeons.push(req.session.data.leadSurgeon)
  }

  req.session.data.leadSurgeonGmc = ''
  req.session.data.leadSurgeon = null

  return res.redirect('/record-procedure/clinician/clinicians-summary')
})

/* Function: GET /record-procedure/clinician/clinicians-summary */
router.get('/record-procedure/clinician/clinicians-summary', (req, res) => {
  req.session.data.leadSurgeons ||= []
  res.render('record-procedure/clinician/clinicians-summary')
})

/* Function: POST /record-procedure/clinician/clinicians-summary */
router.post('/record-procedure/clinician/clinicians-summary', (req, res) => {
  req.session.data.clinicianDetailsComplete = true
  return res.redirect('/record-procedure/task-list')
})

/* Function: GET /record-procedure/clinician/add-another-operation-lead-surgeon */
router.get('/record-procedure/clinician/add-another-operation-lead-surgeon', (req, res) => {
  return res.redirect('/record-procedure/clinician/clinicians-summary')
})

/* Function: POST /record-procedure/clinician/add-another-operation-lead-surgeon */
router.post('/record-procedure/clinician/add-another-operation-lead-surgeon', (req, res) => {
  return res.redirect('/record-procedure/clinician/clinicians-summary')
})

/* Function: GET /record-procedure/devices/add-devices */
router.get('/record-procedure/devices/add-devices', (req, res) => {
  req.session.data.currentOperationDevices ||= []
  res.render('record-procedure/devices/add-devices')
})

/* Function: POST /record-procedure/devices/add-devices/add */
router.post('/record-procedure/devices/add-devices/add', (req, res) => {
  req.session.data.currentOperationDevices ||= []

  if (req.session.data.hasScanner) {
    return res.redirect('/record-procedure/devices/scan-device')
  }

  return res.redirect('/record-procedure/devices/select-device')
})

/* Function: GET /record-procedure/devices/scan-device */
router.get('/record-procedure/devices/scan-device', (req, res) => {
  req.session.data.scannedDeviceCode = ''
  req.session.data.deviceToConfirm = null
  res.render('record-procedure/devices/scan-device')
})

/* Function: POST /record-procedure/devices/scan-device */
router.post('/record-procedure/devices/scan-device', (req, res) => {
  const scanned = (req.body.scannedDeviceCode || req.body.scannedUdi || '').trim()
  req.session.data.scannedDeviceCode = scanned

  const found = findDeviceByCode(scanned)
  req.session.data.deviceToConfirm = found

  if (!found) {
    req.session.data.deviceScanError = 'No device has been found with that barcode.'
    return res.redirect('/record-procedure/devices/scan-device')
  }

  delete req.session.data.deviceScanError
  return res.redirect('/record-procedure/devices/confirm-device')
})

/* Function: GET /record-procedure/devices/confirm-device */
router.get('/record-procedure/devices/confirm-device', (req, res) => {
  if (!req.session.data.deviceToConfirm) {
    return res.redirect('/record-procedure/devices/add-devices')
  }

  res.render('record-procedure/devices/confirm-device')
})

/* Function: POST /record-procedure/devices/confirm-device */
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

  return res.redirect('/record-procedure/devices/add-devices')
})

/* Function: GET /record-procedure/devices/select-device */
router.get('/record-procedure/devices/select-device', (req, res) => {
  req.session.data.deviceToConfirm = null
  res.render('record-procedure/devices/select-device')
})

/* Function: POST /record-procedure/devices/select-device */
router.post('/record-procedure/devices/select-device', (req, res) => {
  const selectedDeviceCode = (req.body.selectedDeviceCode || req.body.selectedUdi || '').trim()
  req.session.data.selectedDeviceCode = selectedDeviceCode

  const found = findDeviceByCode(selectedDeviceCode)
  req.session.data.deviceToConfirm = found

  if (!found) {
    req.session.data.deviceSelectError = 'Select a device'
    return res.redirect('/record-procedure/devices/select-device')
  }

  delete req.session.data.deviceSelectError
  return res.redirect('/record-procedure/devices/confirm-device')
})

/* Function: POST /record-procedure/devices/add-devices */
router.post('/record-procedure/devices/add-devices', (req, res) => {
  req.session.data.deviceDetailsComplete = true
  return res.redirect('/record-procedure/task-list')
})

module.exports = router
