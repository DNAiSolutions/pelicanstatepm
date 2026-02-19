import {
  mockWorkOrders,
  type Priority,
  type WorkOrder,
  type WorkOrderCategory,
  type WorkOrderStatus,
  type TaskTemplate,
} from '../data/pipeline';

export type { TaskTemplate } from '../data/pipeline';

const statusColumns: Record<WorkOrderStatus, 'todo' | 'inprogress' | 'done'> = {
  Requested: 'todo',
  Scoped: 'todo',
  AwaitingApproval: 'todo',
  Approved: 'todo',
  Scheduled: 'inprogress',
  InProgress: 'inprogress',
  Blocked: 'inprogress',
  Completed: 'done',
  Invoiced: 'done',
  Paid: 'done',
  Closed: 'done',
};

type WorkOrderMaterial = NonNullable<WorkOrder['materials']>[number];
type WorkOrderLabor = NonNullable<WorkOrder['labor']>[number];

export type TemplateMaterial = Omit<WorkOrderMaterial, 'unitCost'> & { unitCost?: number };
export type TemplateLabor = Omit<WorkOrderLabor, 'rate'> & { rate?: number };

export type TemplateTask = {
  title: string;
  description: string;
  status?: WorkOrderStatus;
  priority?: Priority;
  category?: WorkOrderCategory;
  materials?: TemplateMaterial[];
  labor?: TemplateLabor[];
  phase?: string;
  wbsCode?: string;
  durationHours?: number;
  dependsOn?: string[];
};

export type ProjectPlan = {
  questions: string[];
  materials: string;
  labor: string;
  costHeuristic: string;
  tasks: TemplateTask[];
  templateName: string;
  description: string;
};

type TaskTemplateConfig = {
  id: TaskTemplate;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  walkthroughQuestions: string[];
  materialSummary: string;
  laborSummary: string;
  costHeuristic: string;
  recommendedTasks: TemplateTask[];
};

const TEMPLATE_LIBRARY: TaskTemplateConfig[] = [
  {
    id: 'default',
    name: 'General Service',
    category: 'General Contracting',
    description: 'Small repairs or light improvements across trades.',
    keywords: ['general', 'service', 'repair'],
    walkthroughQuestions: [
      'What are the site access constraints?',
      'Are permits or inspections required?',
      'What schedule blackouts do we need to respect?',
    ],
    materialSummary: 'Standard consumables, protective coverings, disposal logistics.',
    laborSummary: 'Crew of 2-3 technicians plus PM oversight.',
    costHeuristic: 'Use blended $65/hr labor with 15% material markup.',
    recommendedTasks: [
      {
        title: 'Mobilize & Site Prep',
        description: 'Walk site, lay protection, verify utilities.',
        status: 'Requested',
        priority: 'Medium',
        category: 'Planning',
      },
      {
        title: 'Execute Scope',
        description: 'Perform repair or install per spec.',
        status: 'Requested',
        priority: 'High',
        category: 'Construction',
      },
      {
        title: 'Closeout & Photos',
        description: 'QC, cleanup, capture photos.',
        status: 'Requested',
        priority: 'Medium',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'historicRestoration',
    name: 'Historic Restoration',
    category: 'Conservation',
    description: 'Work on SHPO/NRHP-listed assets requiring documentation.',
    keywords: ['historic', 'shpo', 'museum', 'restoration'],
    walkthroughQuestions: [
      'Do we have SHPO-approved materials and methods?',
      'What elements must be preserved in place?',
      'Need humidity/UV controls or temporary enclosures?',
    ],
    materialSummary: 'Historic-grade plaster/wood, reversible fasteners, documentation supplies.',
    laborSummary: 'Skilled artisans, conservation PM, documentation assistant.',
    costHeuristic: 'Track artisan hours separately; allow 20% contingency for discoveries.',
    recommendedTasks: [
      {
        title: 'Historic Survey & Mockups',
        description: 'Document conditions, create mockups for approval.',
        category: 'Planning',
        priority: 'High',
      },
      {
        title: 'Restoration Execution',
        description: 'Perform repairs per SHPO-approved methods.',
        category: 'Construction',
        priority: 'High',
      },
      {
        title: 'Documentation & Signoff',
        description: 'Capture photos, update logbooks, coordinate SHPO visit.',
        category: 'Closeout',
        priority: 'Medium',
      },
    ],
  },
  {
    id: 'eventSetup',
    name: 'FF&E / Event Setup',
    category: 'Events',
    description: 'Temporary event infrastructure, FF&E installs.',
    keywords: ['event', 'ff&e', 'setup', 'holiday'],
    walkthroughQuestions: [
      'Expected guest count and seating layout?',
      'Power, lighting, and sound requirements?',
      'Weather contingency and ADA paths?',
    ],
    materialSummary: 'Tent flooring, lighting, generators, décor hardware.',
    laborSummary: 'Event setup crew, electrician, PM for client coordination.',
    costHeuristic: 'Use per-event pricing plus 10% contingency for weather gear.',
    recommendedTasks: [
      {
        title: 'Design & Logistics',
        description: 'Confirm layout, coordinate rentals, create schedule.',
        category: 'Planning',
      },
      {
        title: 'Install & Test',
        description: 'Install FF&E, run power, test AV.',
        category: 'Construction',
      },
      {
        title: 'Event Support & Strike',
        description: 'Provide on-call support, strike and cleanup.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'lightingUpgrade',
    name: 'Lighting Upgrade',
    category: 'Electrical',
    description: 'LED retrofits, gallery/museum lighting, controls.',
    keywords: ['lighting', 'led', 'gallery', 'control'],
    walkthroughQuestions: [
      'Lux/UV limits for artifacts?',
      'Existing electrical capacity/controls?',
      'Night work or shutdown windows?',
    ],
    materialSummary: 'Track heads, low-UV lamps, dimming controls, wiring kits.',
    laborSummary: 'Electricians + PM for museum approvals.',
    costHeuristic: '$18-$25/sqft typical for gallery upgrades.',
    recommendedTasks: [
      {
        title: 'Mockups & Controls Review',
        description: 'Install sample fixtures, coordinate with curator.',
        category: 'Planning',
      },
      {
        title: 'Install Lighting Package',
        description: 'Demo old fixtures, install new, program controls.',
        category: 'Electrical',
      },
      {
        title: 'Commission & Training',
        description: 'Aim lights, provide staff training, deliver O&M.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'hvacRepair',
    name: 'HVAC Upgrade/Repair',
    category: 'Mechanical',
    description: 'Chillers, RTUs, ductwork, controls.',
    keywords: ['hvac', 'chiller', 'controls'],
    walkthroughQuestions: [
      'System capacity and age?',
      'Critical uptime requirements?',
      'Refrigerant handling permits?',
    ],
    materialSummary: 'Compressors, refrigerant, sensors, filters.',
    laborSummary: 'HVAC tech pair with helper, PM for scheduling.',
    costHeuristic: 'Budget $7-$12/sqft for major replacements.',
    recommendedTasks: [
      {
        title: 'Assessment & Temp Cooling Plan',
        description: 'Log data, plan temp systems, order long-lead parts.',
        category: 'Planning',
      },
      {
        title: 'Mechanical Installation',
        description: 'Replace equipment, flush lines, tie controls.',
        category: 'Construction',
      },
      {
        title: 'Commissioning & Turnover',
        description: 'Start-up, BAS tuning, training.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'tenantFinish',
    name: 'Tenant Finish / TI',
    category: 'Interiors',
    description: 'Interior build-outs for commercial tenants.',
    keywords: ['tenant', 'finish', 'interior', 'ti'],
    walkthroughQuestions: [
      'Are there existing drawings and specs?',
      'What are the building quiet hours?',
      'Need landlord approvals for finishes?',
    ],
    materialSummary: 'Metal studs, drywall, ceilings, flooring, millwork.',
    laborSummary: 'Carpenters, electricians, plumbers, PM.',
    costHeuristic: '$55-$95/sqft typical in Louisiana for Class B spaces.',
    recommendedTasks: [
      {
        title: 'Demo & Layout',
        description: 'Demo existing, snap lines, coordinate MEP rough-ins.',
        category: 'Demolition',
      },
      {
        title: 'Build-Out',
        description: 'Framing, MEP rough, drywall, ceilings.',
        category: 'Construction',
      },
      {
        title: 'Finishes & Punch',
        description: 'Flooring, millwork, paint, punchlist.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'roofing',
    name: 'Roofing / Envelope',
    category: 'Envelope',
    description: 'Roof replacements, waterproofing, envelope repairs.',
    keywords: ['roof', 'waterproof', 'envelope'],
    walkthroughQuestions: [
      'Roof area and slopes?',
      'Access for crane or hoist?',
      'Weather buffer and temporary protection?',
    ],
    materialSummary: 'Membrane, insulation, flashing, sealants.',
    laborSummary: 'Roof crew plus safety monitor.',
    costHeuristic: '$10-$18/sqft for TPO reroofs in LA gulf climate.',
    recommendedTasks: [
      {
        title: 'Tear-off & Dry-in',
        description: 'Remove existing, install temporary dry-in.',
        category: 'Demolition',
      },
      {
        title: 'Install Roofing System',
        description: 'Lay insulation, membrane, flashing, curbs.',
        category: 'Construction',
      },
      {
        title: 'QA + Warranty',
        description: 'Perform pull tests, warranty inspection, final cleanup.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'sitework',
    name: 'Sitework / Civil',
    category: 'Civil',
    description: 'Grading, drainage, paving, utilities.',
    keywords: ['sitework', 'civil', 'paving', 'drainage'],
    walkthroughQuestions: [
      'Need survey or layout stakes?',
      'Soil type and compaction requirements?',
      'Traffic control plan needed?',
    ],
    materialSummary: 'Aggregate, concrete, pipe, erosion control.',
    laborSummary: 'Equipment operators, laborers, survey crew.',
    costHeuristic: 'Allow $35-$60/lf for basic drainage improvements.',
    recommendedTasks: [
      {
        title: 'Mobilize & Erosion Control',
        description: 'Install silt fence, layout, locate utilities.',
        category: 'Planning',
      },
      {
        title: 'Earthwork & Utilities',
        description: 'Excavate, install pipe, backfill.',
        category: 'Construction',
      },
      {
        title: 'Pave/Restore',
        description: 'Pour slabs/asphalt, restore landscaping.',
        category: 'Construction',
      },
    ],
  },
  {
    id: 'plumbing',
    name: 'Plumbing Upgrade',
    category: 'Plumbing',
    description: 'Domestic water, waste, fixture upgrades.',
    keywords: ['plumbing', 'water', 'fixture'],
    walkthroughQuestions: [
      'Shut-down windows for water service?',
      'Need camera inspection for existing waste lines?',
      'Coordinate with health inspections?',
    ],
    materialSummary: 'Copper/PVC, fixtures, valves, supports.',
    laborSummary: 'Licensed plumbers plus helper.',
    costHeuristic: 'Budget $4-$8/sqft for full restroom upgrade.',
    recommendedTasks: [
      {
        title: 'Rough-in & Demo',
        description: 'Cap services, demo fixtures, rough new lines.',
        category: 'Demolition',
      },
      {
        title: 'Set Fixtures & Trim',
        description: 'Install fixtures, trim out, test.',
        category: 'Construction',
      },
      {
        title: 'Inspection & Turnover',
        description: 'Coordinate inspections, provide O&M.',
        category: 'Closeout',
      },
    ],
  },
  {
    id: 'concrete',
    name: 'Concrete / Structural',
    category: 'Structural',
    description: 'Foundations, slabs, structural repairs.',
    keywords: ['concrete', 'foundation', 'structural'],
    walkthroughQuestions: [
      'Rebar design and testing requirements?',
      'Access for pump truck?',
      'Weather/temperature plan for pours?',
    ],
    materialSummary: 'Ready-mix, rebar, forms, curing blankets.',
    laborSummary: 'Form carpenters, finishers, testing lab.',
    costHeuristic: '$8-$12/sqft for slab-on-grade, excluding demo.',
    recommendedTasks: [
      {
        title: 'Layout & Forms',
        description: 'Survey, set forms, install reinforcement.',
        category: 'Planning',
      },
      {
        title: 'Pour Concrete',
        description: 'Place, finish, sawcut, cure.',
        category: 'Construction',
      },
      {
        title: 'Quality & Strip Forms',
        description: 'Break tests, strip forms, backfill.',
        category: 'Closeout',
      },
    ],
  },
];


export const projectTaskService = {
  getByProject(projectId: string): WorkOrder[] {
    return mockWorkOrders.filter((task) => task.projectId === projectId);
  },

  createTask(
    projectId: string,
    payload: Partial<Omit<WorkOrder, 'materials' | 'labor'>> & {
      materials?: TemplateMaterial[];
      labor?: TemplateLabor[];
    }
  ): WorkOrder {
    const normalizedMaterials: WorkOrderMaterial[] = (payload.materials || []).map((material) => ({
      ...material,
      unitCost: material.unitCost ?? 0,
    }));
    const normalizedLabor: WorkOrderLabor[] = (payload.labor || []).map((entry) => ({
      ...entry,
      rate: entry.rate ?? 0,
    }));
    const newTask: WorkOrder = {
      id: `wo-${Date.now()}`,
      projectId,
      siteId: payload.siteId || 'site-1',
      requestNumber: `WO-${Date.now()}`,
      title: payload.title || 'Untitled Task',
      description: payload.description || '',
      locationDetail: payload.locationDetail || '',
      priority: payload.priority || 'Medium',
      category: payload.category || 'Repair',
      status: payload.status || 'Requested',
      requestedById: payload.requestedById || 'user-1',
      requestedDate: new Date().toISOString(),
      percentComplete: payload.percentComplete || 0,
      completionChecklistDone: false,
      completionPhotoUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: normalizedMaterials,
      labor: normalizedLabor,
      aiQuestions: payload.aiQuestions || [],
      aiMaterialSummary: payload.aiMaterialSummary,
      aiLaborSummary: payload.aiLaborSummary,
    } as WorkOrder;

    mockWorkOrders.push(newTask);
    return newTask;
  },

  updateStatus(taskId: string, status: WorkOrderStatus): WorkOrder | undefined {
    const task = mockWorkOrders.find((t) => t.id === taskId);
    if (!task) return undefined;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  },

  getColumnForStatus(status: WorkOrderStatus): 'todo' | 'inprogress' | 'done' {
    return statusColumns[status] || 'todo';
  },

  generateSuggestions(template: TaskTemplate, description: string): ProjectPlan {
    const config = TEMPLATE_LIBRARY.find((tpl) => tpl.id === template) || TEMPLATE_LIBRARY[0];
    const questions = [...config.walkthroughQuestions];
    if (description) {
      questions.push(`Client notes: ${description}`);
    }
    return {
      questions,
      materials: `${config.materialSummary}`,
      labor: `${config.laborSummary}`,
      costHeuristic: config.costHeuristic,
      tasks: config.recommendedTasks,
      templateName: config.name,
      description: config.description,
    };
  },

  generateProjectPlan(template: TaskTemplate, description: string): ProjectPlan {
    const suggestion = projectTaskService.generateSuggestions(template, description);
    return suggestion;
  },

  getTemplateLibrary(): TaskTemplateConfig[] {
    return TEMPLATE_LIBRARY;
  },

  matchTemplateFromDescription(description: string): TaskTemplate {
    if (!description) return 'default';
    const lower = description.toLowerCase();
    const match = TEMPLATE_LIBRARY.find((tpl) => tpl.keywords.some((keyword) => lower.includes(keyword)));
    return match ? match.id : 'default';
  },
};

export type ProjectTaskService = typeof projectTaskService;
