import type { TaskTemplate } from './projectTaskService';

export type Jurisdiction = 'Louisiana' | 'NewOrleans' | 'BatonRouge';

export type PermitType = 'Mechanical' | 'Electrical' | 'Plumbing' | 'Building' | 'Gas' | 'Historic' | 'Environmental';

export type PermitRule = {
  id: string;
  type: PermitType;
  triggers: string[];
  description: string;
  jurisdiction: Jurisdiction;
  feeRange?: { min: number; max: number };
  inspectionRequired: boolean;
  contact?: { name: string; phone: string; url?: string };
  codeReference?: string;
  notes?: string;
};

export type MeasurementGuide = {
  jobTypes: TaskTemplate[];
  measurements: { item: string; reason: string }[];
  photos: { subject: string; reason: string }[];
  tools: string[];
};

export type SafetyGuide = {
  id: string;
  triggers: string[];
  severity: 'Info' | 'Caution' | 'Warning' | 'Danger';
  note: string;
};

export type CodeReference = {
  id: string;
  name: string;
  section?: string;
  jurisdiction: Jurisdiction;
  summary: string;
  applicableTo: TaskTemplate[];
};

export const permitRules: PermitRule[] = [
  {
    id: 'la-mechanical',
    type: 'Mechanical',
    triggers: ['hvac', 'boiler', 'chiller', 'rtu', 'air handler', 'duct'],
    description: 'Mechanical permit required for HVAC equipment installation, replacement, or major modifications.',
    jurisdiction: 'Louisiana',
    feeRange: { min: 75, max: 300 },
    inspectionRequired: true,
    codeReference: '2021 IMC (LA Uniform Construction Code)',
    notes: 'Covers equipment swaps, ductwork alterations, and controls upgrades.',
  },
  {
    id: 'la-gas',
    type: 'Gas',
    triggers: ['gas', 'propane', 'lp', 'fuel', 'boiler', 'water heater'],
    description: 'LP/Gas permit with State Fire Marshal inspection for new or modified fuel-fired equipment.',
    jurisdiction: 'Louisiana',
    feeRange: { min: 50, max: 150 },
    inspectionRequired: true,
    contact: { name: 'State Fire Marshal', phone: '(225) 925-4911', url: 'https://lasfm.org' },
    codeReference: 'NFPA 54 & NFPA 58',
  },
  {
    id: 'la-electrical-service',
    type: 'Electrical',
    triggers: ['panel', 'service', 'lighting', 'generator', 'feeder'],
    description: 'Electrical permit required for service changes, panel replacements, or new branch circuits.',
    jurisdiction: 'Louisiana',
    inspectionRequired: true,
    codeReference: '2020 NEC (adopted by Louisiana)',
  },
  {
    id: 'la-plumbing',
    type: 'Plumbing',
    triggers: ['water heater', 'domestic water', 'sanitary', 'storm', 'backflow'],
    description: 'Plumbing permit required for water heater changes, new piping, or backflow device work.',
    jurisdiction: 'Louisiana',
    inspectionRequired: true,
    codeReference: '2021 IPC (LA Uniform Construction Code)',
  },
  {
    id: 'la-historic-state',
    type: 'Historic',
    triggers: ['historic', 'shpo', 'nrhp', 'preservation'],
    description: 'State Historic Preservation Office review when working on registered historic assets.',
    jurisdiction: 'Louisiana',
    inspectionRequired: false,
    contact: { name: 'Louisiana SHPO', phone: '(225) 342-8160' },
    notes: 'Scope documentation, photos, and material submittals required.',
  },
  {
    id: 'nola-safety-permits',
    type: 'Building',
    triggers: ['new orleans', 'nola', 'construction', 'renovation'],
    description: 'Safety & Permits approval for building, mechanical, electrical, and other work inside Orleans Parish.',
    jurisdiction: 'NewOrleans',
    inspectionRequired: true,
    contact: { name: 'NOLA Safety & Permits', phone: '(504) 658-7100', url: 'https://nola.gov/safety-and-permits' },
  },
  {
    id: 'nola-hdlc',
    type: 'Historic',
    triggers: ['french quarter', 'hdlc', 'vieux carre', 'garden district', 'historic'],
    description: 'HDLC or VCC review required for exterior or visible changes in protected districts.',
    jurisdiction: 'NewOrleans',
    inspectionRequired: false,
    contact: { name: 'HDLC', phone: '(504) 658-7040', url: 'https://nola.gov/hdlc' },
    notes: 'Allow 2-4 weeks for review; shop drawings/photos required.',
  },
  {
    id: 'nola-vcc',
    type: 'Historic',
    triggers: ['french quarter', 'vcc', 'royal street'],
    description: 'Vieux Carré Commission approval for all work in the French Quarter, inside and out.',
    jurisdiction: 'NewOrleans',
    inspectionRequired: true,
    contact: { name: 'VCC', phone: '(504) 658-1420' },
  },
  {
    id: 'br-permits',
    type: 'Building',
    triggers: ['baton rouge', 'ebr', 'renovation', 'construction'],
    description: 'Permit & Inspection Division review for construction inside East Baton Rouge Parish.',
    jurisdiction: 'BatonRouge',
    inspectionRequired: true,
    contact: { name: 'Permit & Inspection', phone: '(225) 389-3181' },
  },
  {
    id: 'br-historic',
    type: 'Historic',
    triggers: ['old south', 'spanishtown', 'historic district', 'baton rouge'],
    description: 'Local historic district review when working in Old South Baton Rouge, Spanish Town, and other overlays.',
    jurisdiction: 'BatonRouge',
    inspectionRequired: false,
    notes: 'Coordinate with local preservation commission prior to demolition or major changes.',
  },
];

export const measurementGuides: MeasurementGuide[] = [
  {
    jobTypes: ['hvacRepair', 'default'],
    measurements: [
      { item: 'Equipment room length/width/height', reason: 'Verify clearance for replacement units.' },
      { item: 'Existing duct dimensions & main trunk sizes', reason: 'Confirm airflow and fabrication needs.' },
      { item: 'Electrical panel amperage and space count', reason: 'Ensure capacity for new mechanical feeds.' },
    ],
    photos: [
      { subject: 'Equipment nameplate', reason: 'Capture model, serial, and BTU data.' },
      { subject: 'Utility connections (gas, electric, water)', reason: 'Document tie-in points and condition.' },
    ],
    tools: ['Laser distance meter', 'Clamp meter', 'Flue gas analyzer', 'Flexible camera'],
  },
  {
    jobTypes: ['historicRestoration'],
    measurements: [
      { item: 'Area of historic surfaces', reason: 'Quantify restoration scope and materials.' },
      { item: 'Ambient humidity & temperature', reason: 'Check conservation environment.' },
    ],
    photos: [
      { subject: 'Detail shots of deteriorated elements', reason: 'Provide evidence for SHPO approvals.' },
      { subject: 'Adjacent finishes', reason: 'Ensure visual match for repairs.' },
    ],
    tools: ['Moisture meter', 'Color reference card', 'Tripod with diffuse lighting'],
  },
  {
    jobTypes: ['lightingUpgrade'],
    measurements: [
      { item: 'Existing foot-candles/lux levels', reason: 'Establish baseline vs. desired lighting performance.' },
      { item: 'Ceiling heights and mounting types', reason: 'Plan fixture selection and install method.' },
    ],
    photos: [
      { subject: 'Existing controls and dimming racks', reason: 'Identify integration requirements.' },
      { subject: 'Representative spaces (wide + detail)', reason: 'Support aiming plans and approvals.' },
    ],
    tools: ['Light meter', 'Boom lift plan', 'Control interface tester'],
  },
];

export const safetyGuides: SafetyGuide[] = [
  {
    id: 'asbestos-legacy',
    triggers: ['1930', '1920', 'boiler', 'steam', 'insulation', 'pipe wrap'],
    severity: 'Warning',
    note: 'Likely asbestos insulation on legacy piping. Require AHERA survey before disturbance.',
  },
  {
    id: 'confined-space',
    triggers: ['vault', 'pit', 'tank', 'manhole'],
    severity: 'Caution',
    note: 'Possible confined space entry. Follow OSHA 1910.146 with permits and monitoring.',
  },
  {
    id: 'lead-paint',
    triggers: ['historic', 'pre-1978', 'window', 'door', 'paint'],
    severity: 'Caution',
    note: 'Test for lead paint. Follow EPA RRP rules for disturbance or removal.',
  },
  {
    id: 'elevated-work',
    triggers: ['roof', 'high bay', 'scaffold', 'lift'],
    severity: 'Info',
    note: 'Plan fall protection and lift certifications for elevated work areas.',
  },
];

export const codeReferences: CodeReference[] = [
  {
    id: 'imc-2021',
    name: 'International Mechanical Code 2021',
    section: 'Ch. 9, Boilers & Water Heaters',
    jurisdiction: 'Louisiana',
    summary: 'Governs installation of boilers, hydronic systems, and mechanical equipment statewide.',
    applicableTo: ['hvacRepair', 'default'],
  },
  {
    id: 'ipc-2021',
    name: 'International Plumbing Code 2021',
    section: 'Ch. 6 Water Supply & Distribution',
    jurisdiction: 'Louisiana',
    summary: 'Regulates water piping, water heaters, and fixtures.',
    applicableTo: ['plumbing', 'hvacRepair'],
  },
  {
    id: 'nec-2020',
    name: 'National Electrical Code 2020',
    section: 'Article 424 Fixed Electric Heating',
    jurisdiction: 'Louisiana',
    summary: 'Electrical requirements for heating equipment, branch circuits, and disconnects.',
    applicableTo: ['lightingUpgrade', 'hvacRepair'],
  },
  {
    id: 'hdlc-guidelines',
    name: 'HDLC Design Guidelines',
    jurisdiction: 'NewOrleans',
    summary: 'Exterior/interior work in historic districts requires HDLC approval with submittals.',
    applicableTo: ['historicRestoration', 'tenantFinish'],
  },
  {
    id: 'br-historic-guidelines',
    name: 'Baton Rouge Historic Preservation Guidelines',
    jurisdiction: 'BatonRouge',
    summary: 'Review process for designated local districts (Spanish Town, Beauregard Town, etc.).',
    applicableTo: ['historicRestoration'],
  },
];

export function matchPermitRules(keywords: string[], jurisdiction?: Jurisdiction) {
  return permitRules.filter((rule) => {
    const jurisdictionMatch = !jurisdiction || rule.jurisdiction === jurisdiction || rule.jurisdiction === 'Louisiana';
    const triggerMatch = rule.triggers.some((trigger) => keywords.some((keyword) => keyword.includes(trigger)));
    return jurisdictionMatch && triggerMatch;
  });
}

export function findMeasurementGuide(template: TaskTemplate) {
  return measurementGuides.find((guide) => guide.jobTypes.includes(template));
}

export function detectSafetyNotes(keywords: string[]) {
  return safetyGuides.filter((guide) => guide.triggers.some((trigger) => keywords.some((keyword) => keyword.includes(trigger))));
}

export function findCodeReferences(template: TaskTemplate, jurisdiction?: Jurisdiction) {
  return codeReferences.filter((ref) => ref.applicableTo.includes(template) && (!jurisdiction || ref.jurisdiction === jurisdiction || ref.jurisdiction === 'Louisiana'));
}
