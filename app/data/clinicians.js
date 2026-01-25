const clinicians = [
  {
    gmc: '1234567',
    title: 'Dr',
    firstName: 'Gregory',
    lastName: 'House',
    role: 'Consultant Physician'
  },
  {
    gmc: '2345678',
    title: 'Dr',
    firstName: 'Amelia',
    lastName: 'Shaw',
    role: 'Anaesthetist'
  },

  // Multiple Patels for demo
  {
    gmc: '3456789',
    title: 'Dr',
    firstName: 'Ravi',
    lastName: 'Patel',
    role: 'Orthopaedic Surgeon'
  },
  {
    gmc: '4567801',
    title: 'Dr',
    firstName: 'Anita',
    lastName: 'Patel',
    role: 'General Surgeon'
  },
  {
    gmc: '5678012',
    title: 'Dr',
    firstName: 'Sanjay',
    lastName: 'Patel',
    role: 'Consultant Anaesthetist'
  },
  {
    gmc: 'C345678',
    title: 'Mr',
    firstName: 'Vikram',
    lastName: 'Patel',
    role: 'Consultant Trauma Surgeon'
  },

  {
    gmc: '4567890',
    title: 'Dr',
    firstName: 'Sarah',
    lastName: 'McIntyre',
    role: 'General Surgeon'
  },
  {
    gmc: '5678901',
    title: 'Dr',
    firstName: 'Daniel',
    lastName: 'Okafor',
    role: 'Vascular Surgeon'
  },

  // Consultants (Mr, GMC starts with C)
  {
    gmc: 'C123456',
    title: 'Mr',
    firstName: 'James',
    lastName: 'Whitaker',
    role: 'Consultant Surgeon'
  },
  {
    gmc: 'C234567',
    title: 'Mr',
    firstName: 'Thomas',
    lastName: 'Ellison',
    role: 'Consultant Orthopaedic Surgeon'
  },

  {
    gmc: '6789012',
    title: 'Dr',
    firstName: 'Aisha',
    lastName: 'Rahman',
    role: 'Neurosurgeon'
  },
  {
    gmc: '7890123',
    title: 'Dr',
    firstName: 'Michael',
    lastName: 'Turner',
    role: 'Plastic Surgeon'
  },
  {
    gmc: '8901234',
    title: 'Dr',
    firstName: 'Emily',
    lastName: 'Chen',
    role: 'ENT Surgeon'
  }
]

function findClinicianByGmc (gmc) {
  if (!gmc) return null
  const normalised = gmc.trim().toUpperCase()
  return clinicians.find(c => String(c.gmc).toUpperCase() === normalised) || null
}

module.exports = {
  clinicians,
  findClinicianByGmc
}
