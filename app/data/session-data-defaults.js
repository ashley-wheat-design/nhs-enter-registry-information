const { findDeviceByCode } = require('./devices')
const { findClinicianByGmc } = require('./clinicians')

function clone (obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : null
}

function device (deviceCode, overrides = {}) {
  const found = findDeviceByCode(deviceCode)
  const base = clone(found) || { deviceCode: String(deviceCode || '').trim() }
  return { ...base, ...overrides }
}

function clinician (gmc) {
  return clone(findClinicianByGmc(String(gmc || '').trim()))
}

function buildPatientDevices (procedures) {
  return (procedures || []).flatMap(p => {
    const procId = p.id
    return (p.devices || []).map(d => ({
      procedureId: procId,
      procedureDate: p.date || null,
      ...clone(d)
    }))
  })
}

const patients = [
  {
    nhsNumber: '9123123123',
    firstName: 'Jodie',
    lastName: 'Brown',
    dob: '15 August 1949 (75 years old)',
    gender: 'Female',
    address: ['73 Roman Rd', 'Leeds', 'LS2 5ZN'],
    registeredGp: [
      'Beech House surgery',
      '1 Ash Tree Road',
      'Knaresborough',
      'HG5 0UB'
    ],
    heightCm: null,
    weightKg: null,
    procedures: [
      {
        id: 'proc-1001',
        recordedAt: '2024-03-12T10:14:00.000Z',
        date: '2024-03-12',
        time: '09:30',
        primaryDiagnosisCode: 'H25.9',
        additionalDiagnosisCodes: [],
        asaClassification: '2',
        operationOutcome: 'implant',
        operationOutcomeOtherDetail: '',
        laterality: 'R',
        clinicians: {
          responsibleConsultant: clinician('C123456'),
          supervisingSurgeon: clinician('4567890'),
          leadSurgeons: [clinician('8901234')]
        },
        devices: [
          device('912312311', { status: 'Implanted' })
        ]
      },
      {
        id: 'proc-1002',
        recordedAt: '2025-07-22T14:22:00.000Z',
        date: '2025-07-22',
        time: '13:10',
        primaryDiagnosisCode: 'H40.1',
        additionalDiagnosisCodes: ['I10'], // example additional diagnosis present in your icd10.js
        asaClassification: '2',
        operationOutcome: 'implant',
        operationOutcomeOtherDetail: '',
        laterality: 'L',
        clinicians: {
          responsibleConsultant: clinician('C234567'),
          supervisingSurgeon: clinician('8901234'),
          leadSurgeons: [clinician('2345678')]
        },
        devices: [
          device('912312322', { status: 'Implanted' })
        ]
      },
      {
        id: 'proc-1003',
        recordedAt: '2026-01-09T08:05:00.000Z',
        date: '2026-01-09',
        time: '07:50',
        primaryDiagnosisCode: 'H26.9',
        additionalDiagnosisCodes: [],
        asaClassification: '3',
        operationOutcome: 'replacement',
        operationOutcomeOtherDetail: '',
        laterality: 'L',
        clinicians: {
          responsibleConsultant: clinician('C123456'),
          supervisingSurgeon: clinician('4567890'),
          leadSurgeons: [clinician('8901234')]
        },
        // replacement = removal and implant (so show two device records)
        devices: [
          device('912312322', { status: 'Removed' }),
          device('912312333', { status: 'Implanted' })
        ]
      }
    ]
  },
  {
    nhsNumber: '4857773456',
    firstName: 'Alex',
    lastName: 'Patel',
    dob: '1983-02-09',
    gender: 'Male',
    address: ['12 Market St', 'Leeds', 'LS1 2AB'],
    registeredGp: [
      'City Health Practice',
      '99 High Street',
      'Leeds',
      'LS1 1AA'
    ],
    heightCm: 172,
    weightKg: 74,
    procedures: [
      {
        id: 'proc-2001',
        recordedAt: '2024-06-03T08:45:00.000Z',
        date: '2024-06-03',
        time: '08:15',
        primaryDiagnosisCode: 'I48.9',
        additionalDiagnosisCodes: [],
        asaClassification: '3',
        operationOutcome: 'implant',
        operationOutcomeOtherDetail: '',
        laterality: '8', // not applicable
        clinicians: {
          responsibleConsultant: clinician('1234567'),
          supervisingSurgeon: clinician('5678012'),
          leadSurgeons: [clinician('5678901')]
        },
        devices: [
          device('912312366', { status: 'Implanted' })
        ]
      },
      {
        id: 'proc-2002',
        recordedAt: '2025-09-18T16:05:00.000Z',
        date: '2025-09-18',
        time: '15:20',
        primaryDiagnosisCode: 'M16.9',
        additionalDiagnosisCodes: [],
        asaClassification: '2',
        operationOutcome: 'implant',
        operationOutcomeOtherDetail: '',
        laterality: 'R',
        clinicians: {
          responsibleConsultant: clinician('C234567'),
          supervisingSurgeon: clinician('3456789'),
          leadSurgeons: [clinician('3456789')]
        },
        devices: [
          device('912312377', { status: 'Implanted' })
        ]
      },
      {
        id: 'proc-2003',
        recordedAt: '2025-12-02T11:40:00.000Z',
        date: '2025-12-02',
        time: '11:05',
        primaryDiagnosisCode: 'M17.9',
        additionalDiagnosisCodes: ['I10'],
        asaClassification: '2',
        operationOutcome: 'device-removal',
        operationOutcomeOtherDetail: '',
        laterality: 'L',
        clinicians: {
          responsibleConsultant: clinician('C234567'),
          supervisingSurgeon: clinician('3456789'),
          leadSurgeons: [clinician('4567801')]
        },
        devices: [
          device('912312377', { status: 'Removed' })
        ]
      }
    ]
  }
]

patients.forEach(p => {
  p.procedures ||= []
  p.devices = buildPatientDevices(p.procedures)
})

module.exports = {
  patients
}
