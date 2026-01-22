// app/data/devices.js

const devices = [
  {
    deviceCode: '912312311',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)05050474810693(17)290630(10)LOT-ODYSSEY-01(21)SN-ODYSSEY-0001',
    deviceManufacturer: 'Johnson & Johnson Surgical Vision, Inc.',
    medicalDeviceReferenceNumber: 'DRN00V0165',
    medicalDeviceSerialNumber: 'SN-ODYSSEY-0001',
    medicalDeviceLotNumber: 'LOT-ODYSSEY-01',
    medicalDeviceQuantity: 1,
    productDescription: 'TECNIS ODYSSEY SIMPLICITY IOL 16.5D',
    medicalDeviceExpiryDate: '2029-06-30',
    typeOfDeviceDescription: 'Posterior-chamber intraocular lens, pseudophakic',
    typeOfDeviceGmdnDescription: 'Intraocular lens, posterior chamber',
    typeOfDeviceGmdnCode: '35658',
    medicalDeviceBrandOrModelName: 'TECNIS ODYSSEY'
  },
  {
    deviceCode: '912312322',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)05029867006838(17)290531(10)LOT-RAYONE-EMV-02(21)SN-RAYONE-0002',
    deviceManufacturer: 'Rayner Intraocular Lenses Limited',
    medicalDeviceReferenceNumber: 'RAO200E',
    medicalDeviceSerialNumber: 'SN-RAYONE-0002',
    medicalDeviceLotNumber: 'LOT-RAYONE-EMV-02',
    medicalDeviceQuantity: 1,
    productDescription: 'RayOne EMV preloaded posterior chamber IOL',
    medicalDeviceExpiryDate: '2029-05-31',
    typeOfDeviceDescription: 'Posterior-chamber intraocular lens, pseudophakic',
    typeOfDeviceGmdnDescription: 'Intraocular lens, posterior chamber',
    typeOfDeviceGmdnCode: '35658',
    medicalDeviceBrandOrModelName: 'RayOne EMV'
  },
  {
    deviceCode: '912312333',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)10757770611246(17)280812(10)LOT-ENVISTA-03(21)SN-ENVISTA-0003',
    deviceManufacturer: 'Bausch + Lomb Surgical, Inc.',
    medicalDeviceReferenceNumber: 'ETEU125+260',
    medicalDeviceSerialNumber: 'SN-ENVISTA-0003',
    medicalDeviceLotNumber: 'LOT-ENVISTA-03',
    medicalDeviceQuantity: 1,
    productDescription: 'enVista Toric IOL hydrophobic acrylic',
    medicalDeviceExpiryDate: '2028-08-12',
    typeOfDeviceDescription: 'Toric posterior-chamber intraocular lens',
    typeOfDeviceGmdnDescription: 'Intraocular lens, posterior chamber',
    typeOfDeviceGmdnCode: '35658',
    medicalDeviceBrandOrModelName: 'enVista Toric'
  },
  {
    deviceCode: '912312344',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)00380652552424(17)280630(10)LOT-ACRYSOF-04(21)SN-ACRYSOF-0004(240)MA60AC150',
    deviceManufacturer: 'Alcon Laboratories, Inc.',
    medicalDeviceReferenceNumber: 'MA60AC150',
    medicalDeviceSerialNumber: 'SN-ACRYSOF-0004',
    medicalDeviceLotNumber: 'LOT-ACRYSOF-04',
    medicalDeviceQuantity: 1,
    productDescription: 'AcrySof acrylic posterior chamber IOL (example)',
    medicalDeviceExpiryDate: '2028-06-30',
    typeOfDeviceDescription: 'Posterior-chamber intraocular lens, pseudophakic',
    typeOfDeviceGmdnDescription: 'Intraocular lens, posterior chamber',
    typeOfDeviceGmdnCode: '35658',
    medicalDeviceBrandOrModelName: 'AcrySof'
  },
  {
    deviceCode: '912312355',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)05050474657496(17)281231(10)LOT-TECNIS-05(21)SN-TECNIS-0005',
    deviceManufacturer: 'Johnson & Johnson Surgical Vision, Inc.',
    medicalDeviceReferenceNumber: 'ZCU150',
    medicalDeviceSerialNumber: 'SN-TECNIS-0005',
    medicalDeviceLotNumber: 'LOT-TECNIS-05',
    medicalDeviceQuantity: 1,
    productDescription: 'TECNIS Toric IOL (example)',
    medicalDeviceExpiryDate: '2028-12-31',
    typeOfDeviceDescription: 'Toric posterior-chamber intraocular lens',
    typeOfDeviceGmdnDescription: 'Intraocular lens, posterior chamber',
    typeOfDeviceGmdnCode: '35658',
    medicalDeviceBrandOrModelName: 'TECNIS Toric'
  },
  {
    deviceCode: '912312366',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)09501101530012(17)300101(10)LOT-PACE-06(21)SN-PACE-0006',
    deviceManufacturer: 'Medtronic',
    medicalDeviceReferenceNumber: 'AZUREXTDRMRI',
    medicalDeviceSerialNumber: 'SN-PACE-0006',
    medicalDeviceLotNumber: 'LOT-PACE-06',
    medicalDeviceQuantity: 1,
    productDescription: 'Dual chamber pacemaker (example)',
    medicalDeviceExpiryDate: '2030-01-01',
    typeOfDeviceDescription: 'Implantable cardiac pacemaker',
    typeOfDeviceGmdnDescription: 'Cardiac pacemaker, implantable',
    typeOfDeviceGmdnCode: '36576',
    medicalDeviceBrandOrModelName: 'Azure XT'
  },
  {
    deviceCode: '912312377',
    status: 'Implanted',
    uniqueDeviceIdentifier:
      '(01)04012345678901(17)290101(10)LOT-HIP-07(21)SN-HIP-0007',
    deviceManufacturer: 'Stryker',
    medicalDeviceReferenceNumber: 'TRIDENT-II',
    medicalDeviceSerialNumber: 'SN-HIP-0007',
    medicalDeviceLotNumber: 'LOT-HIP-07',
    medicalDeviceQuantity: 1,
    productDescription: 'Acetabular shell (example)',
    medicalDeviceExpiryDate: '2029-01-01',
    typeOfDeviceDescription: 'Hip prosthesis component',
    typeOfDeviceGmdnDescription: 'Hip prosthesis, acetabular component',
    typeOfDeviceGmdnCode: '34931',
    medicalDeviceBrandOrModelName: 'Trident II'
  }
]

/* Function: findDeviceByCode */
function findDeviceByCode(code) {
  const key = String(code || '').trim()
  return devices.find(d => String(d.deviceCode).trim() === key) || null
}

module.exports = {
  devices,
  findDeviceByCode
}
