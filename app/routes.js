const express = require('express')
const router = express.Router()

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

  next()
})

router.get('/record-procedure', (req, res) => {
  delete req.session.data.nhsNumber
  delete req.session.data.selectedPatient
  res.render('record-procedure/task-list')
})

router.post('/scanner-answer', (req, res) => {
  req.session.data.hasScanner = req.body.hasScanner === 'yes'
  res.redirect('record-procedure/patient/has-nhs-number')
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

router.get('/record-procedure/pateint/enter-weight', (req, res) => {
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

module.exports = router
