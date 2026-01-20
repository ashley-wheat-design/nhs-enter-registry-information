const express = require('express')
const router = express.Router()
const icd10 = require('./data/icd10')
const asaPhysicalStatus = require('./data/asa-physical-status')


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

  res.locals.data = req.session.data
  res.locals.currentUser = req.session.data.currentUser
  res.locals.currentOrganisation = req.session.data.currentOrganisation
  res.locals.organisationSetting = req.session.data.organisationSetting
  res.locals.currentRegistry = req.session.data.currentRegistry
  res.locals.icd10 = icd10
  res.locals.asaPhysicalStatus = asaPhysicalStatus


  next()
})

router.get('/record-procedure', (req, res) => {
  delete req.session.data.nhsNumber
  delete req.session.data.selectedPatient
  res.render('record-procedure/barcode-scanner')
})

router.post('/scanner-answer', (req, res) => {
  req.session.data.hasScanner = req.body.hasScanner === 'yes'
  res.redirect('record-procedure/task-list')
})

router.get('/record-procedure/patient/has-nhs-number', (req, res) => {
  res.render('record-procedure/patient/has-nhs-number')
})

router.post('/has-nhs-number-answer', (req, res) => {
  if (req.body.hasNHSNumber === 'yes') return res.redirect('/record-procedure/patient/nhs-number')
  return res.redirect('/record-procedure/patient/patient-search')
})

router.get('/nhs-number', (req, res) => {
  res.render('record-procedure/patient/nhs-number')
})

router.post('/nhs-number-answer', (req, res) => {
  const raw = (req.body.nhsNumber || '')
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
    return res.redirect('/record-procedure/patient-search')
  }

  req.session.data.selectedPatient = patient
  return res.redirect('/record-procedure/patient/confirm-patient')
})

router.get('/record-procedure/patient/confirm-patient', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/patient/nhs-number')
  res.render('record-procedure/patient/confirm-patient')
})

router.post('/record-procedure/patient/patient-information-complete', (req, res) => {
  req.session.data.patientInfoComplete = true
  return res.redirect('/record-procedure/task-list')
})

router.get('/record-procedure/patient/enter-weight', (req, res) => {
  if (!req.session.data.selectedPatient) return res.redirect('/record-procedure/nhs-number')
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

    req.session.data.procedureDate = `${day}-${month}-${year}`

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

    req.session.data.procedureDate = `${day}-${month}-${year}`

    req.session.data.procedureDateDay = day
    req.session.data.procedureDateMonth = month
    req.session.data.procedureDateYear = year

    delete req.session.data.procedureDateError
  }

  return res.redirect('/record-procedure/procedure/procedure-time')
})

router.post('/record-procedure/procedure/procedure-time', (req, res) => {
    let procedureTime = (req.body.procedureTime || '').trim()

  // Remove spaces
  procedureTime = procedureTime.replace(/\s+/g, '')

  // If user didn't include a colon
  if (!procedureTime.includes(':')) {
    // e.g. 930 or 0930 → 09:30
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

  // Prevent duplicates
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

  // Basic validation
  if (!asa) {
    req.session.data.asaClassificationError = 'Select the patient’s physical status'
    return res.redirect('/record-procedure/procedure/physical-status')
  }

  // Store on the current operation
  req.session.data.currentOperation ||= {}
  req.session.data.currentOperation.asaClassification = asa

  delete req.session.data.asaClassificationError

  // Next step: operation details (implant / explant + laterality)
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

    // These are stored at top-level in your journey
    date: req.session.data.procedureDate || null,
    time: req.session.data.procedureTime || null,

    primaryDiagnosisCode: diagnosisCodes[0] || null,
    additionalDiagnosisCodes: diagnosisCodes.slice(1),

    // These are stored under currentOperation in your journey
    asaClassification: op.asaClassification || null,
    operationOutcome: op.operationOutcome || null,
    operationOutcomeOtherDetail: op.operationOutcomeOtherDetail || '',
    laterality: op.laterality || null,

    clinicians: {
      leadSurgeon: req.session.data.leadSurgeonName || null
    },

    devices: []
  }

  patient.procedures.push(newProcedure)

  console.log('✅ New procedure saved:', newProcedure)
  console.log('✅ Patient now has procedures:', patient.procedures.length)

  delete req.session.data.currentOperation
  delete req.session.data.diagnosisCodes
  delete req.session.data.procedureDate
  delete req.session.data.procedureTime
  
  req.session.data.procedureDetailsComplete = true
  
  return res.redirect('/record-procedure/task-list')
})



module.exports = router
