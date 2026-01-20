/* 
  Prototype ICD-10 lookup
  Large, non-exhaustive, device- and procedure-relevant subset
  Suitable for autocomplete and summaries
*/

module.exports = {
  // --- Ophthalmology ---
  'H25.0': 'Senile incipient cataract',
  'H25.1': 'Senile nuclear cataract',
  'H25.2': 'Senile cortical cataract',
  'H25.8': 'Other senile cataract',
  'H25.9': 'Senile cataract, unspecified',
  'H26.0': 'Infantile, juvenile and presenile cataract',
  'H26.8': 'Other specified cataract',
  'H26.9': 'Cataract, unspecified',
  'H40.0': 'Glaucoma suspect',
  'H40.1': 'Primary open-angle glaucoma',
  'H40.2': 'Primary angle-closure glaucoma',
  'H40.3': 'Glaucoma secondary to eye trauma',
  'H40.4': 'Glaucoma secondary to eye inflammation',
  'H40.5': 'Glaucoma secondary to other eye disorders',
  'H40.8': 'Other glaucoma',
  'H40.9': 'Glaucoma, unspecified',
  'H33.0': 'Retinal detachment with retinal break',
  'H33.2': 'Serous retinal detachment',
  'H33.3': 'Retinal breaks without detachment',

  // --- Musculoskeletal / Orthopaedics ---
  'M15.0': 'Primary generalized osteoarthritis',
  'M16.0': 'Primary coxarthrosis, bilateral',
  'M16.1': 'Other primary coxarthrosis',
  'M16.9': 'Osteoarthritis of hip, unspecified',
  'M17.0': 'Primary gonarthrosis, bilateral',
  'M17.1': 'Other primary gonarthrosis',
  'M17.9': 'Osteoarthritis of knee, unspecified',
  'M19.0': 'Primary osteoarthritis of other joints',
  'M19.9': 'Osteoarthritis, unspecified',
  'M20.1': 'Hallux valgus (acquired)',
  'M23.2': 'Derangement of meniscus due to old tear or injury',
  'M48.0': 'Spinal stenosis',
  'M50.0': 'Cervical disc disorder with myelopathy',
  'M51.1': 'Lumbar and other intervertebral disc disorders with radiculopathy',
  'M75.0': 'Adhesive capsulitis of shoulder',
  'M75.1': 'Rotator cuff syndrome',
  'M75.4': 'Impingement syndrome of shoulder',
  'S72.0': 'Fracture of neck of femur',
  'S82.1': 'Fracture of upper end of tibia',

  // --- Cardiovascular ---
  'I10': 'Essential (primary) hypertension',
  'I20.0': 'Unstable angina',
  'I21.0': 'Acute transmural myocardial infarction of anterior wall',
  'I21.9': 'Acute myocardial infarction, unspecified',
  'I25.1': 'Atherosclerotic heart disease',
  'I34.0': 'Mitral valve insufficiency',
  'I35.0': 'Aortic valve stenosis',
  'I42.0': 'Dilated cardiomyopathy',
  'I44.2': 'Atrioventricular block, complete',
  'I47.2': 'Ventricular tachycardia',
  'I48.0': 'Paroxysmal atrial fibrillation',
  'I48.9': 'Atrial fibrillation and flutter, unspecified',
  'I50.0': 'Congestive heart failure',
  'I50.9': 'Heart failure, unspecified',
  'I70.2': 'Atherosclerosis of arteries of extremities',

  // --- General surgery / GI ---
  'K21.0': 'Gastro-oesophageal reflux disease with oesophagitis',
  'K21.9': 'Gastro-oesophageal reflux disease without oesophagitis',
  'K35.2': 'Acute appendicitis with generalized peritonitis',
  'K35.9': 'Acute appendicitis, unspecified',
  'K40.2': 'Bilateral inguinal hernia, without obstruction or gangrene',
  'K40.9': 'Inguinal hernia, unspecified',
  'K57.3': 'Diverticular disease of large intestine without perforation or abscess',
  'K80.0': 'Calculus of gallbladder with acute cholecystitis',
  'K80.2': 'Calculus of gallbladder without cholecystitis',
  'K81.0': 'Acute cholecystitis',
  'K92.2': 'Gastrointestinal haemorrhage, unspecified',

  // --- Urology ---
  'N20.0': 'Calculus of kidney',
  'N20.1': 'Calculus of ureter',
  'N32.0': 'Bladder-neck obstruction',
  'N39.0': 'Urinary tract infection, site not specified',
  'N40.0': 'Benign prostatic hyperplasia',
  'N43.3': 'Hydrocele',
  'N45.1': 'Orchitis, epididymitis and epididymo-orchitis with abscess',

  // --- Gynaecology ---
  'N80.0': 'Endometriosis of uterus',
  'N80.9': 'Endometriosis, unspecified',
  'N81.1': 'Cystocele',
  'N84.0': 'Polyp of corpus uteri',
  'D25.0': 'Submucous leiomyoma of uterus',
  'D25.9': 'Leiomyoma of uterus, unspecified',

  // --- Neurology ---
  'G20': 'Parkinson’s disease',
  'G35': 'Multiple sclerosis',
  'G40.9': 'Epilepsy, unspecified',
  'G56.0': 'Carpal tunnel syndrome',
  'G95.9': 'Disease of spinal cord, unspecified',

  // --- Respiratory ---
  'J44.0': 'Chronic obstructive pulmonary disease with acute lower respiratory infection',
  'J44.9': 'Chronic obstructive pulmonary disease, unspecified',
  'J45.9': 'Asthma, unspecified',
  'J93.9': 'Pneumothorax, unspecified',

  // --- Oncology (device-adjacent) ---
  'C18.9': 'Malignant neoplasm of colon, unspecified',
  'C50.9': 'Malignant neoplasm of breast, unspecified',
  'C61': 'Malignant neoplasm of prostate',
  'C71.9': 'Malignant neoplasm of brain, unspecified',

  // --- Vascular ---
  'I83.9': 'Varicose veins of lower extremities without ulcer or inflammation',
  'I87.2': 'Venous insufficiency (chronic) (peripheral)',
  'I74.3': 'Embolism and thrombosis of arteries of the lower extremities',

  // --- Trauma ---
  'S06.0': 'Concussion',
  'S42.2': 'Fracture of upper end of humerus',
  'S52.5': 'Fracture of lower end of radius',
  'S83.5': 'Sprain and strain involving cruciate ligament of knee',

  // --- Catch-all / common unspecified ---
  'R10.4': 'Other and unspecified abdominal pain',
  'R55': 'Syncope and collapse',
  'R69': 'Unknown and unspecified causes of morbidity'
}
