import type {
  IntakeConversationMessage,
  IntakeConversationState,
  ScopeAnalysisResult,
  WbsPhase,
  WorkOrderCategory,
} from '../data/pipeline';
import { projectTaskService, type TaskTemplate, type ProjectPlan } from './projectTaskService';
import { scopeAnalysisService } from './scopeAnalysisService';

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const WBS_LIBRARY: Record<TaskTemplate | 'default', WbsPhase[]> = {
  default: [
    {
      phase: '01 Discovery',
      summary: 'Kickoff, documentation, and constraints.',
      tasks: [
        { code: '1.1', title: 'Project kickoff + intent capture', description: 'Meet client, confirm goals, constraints, and schedule blackouts.', category: 'Planning', durationHours: 6 },
        { code: '1.2', title: 'Site walkthrough & documentation', description: 'Capture measurements, photos, and existing condition notes.', category: 'Planning', durationHours: 10 },
      ],
    },
    {
      phase: '02 Planning',
      summary: 'Scope validation, pricing, procurement path.',
      tasks: [
        { code: '2.1', title: 'Finalize scope + responsibilities matrix', description: 'Translate walkthrough notes into actionable scope map with stakeholders.', category: 'Planning', durationHours: 8, dependsOn: ['1.1', '1.2'] },
        { code: '2.2', title: 'Procurement + schedule strategy', description: 'Identify long-lead items, create phasing/milestone dates.', category: 'Planning', durationHours: 6, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Execution',
      summary: 'Perform field work per scope.',
      tasks: [
        { code: '3.1', title: 'Mobilize + site prep', description: 'Permitting, safety plan, temp protection, clear logistics zones.', category: 'Construction', durationHours: 12, dependsOn: ['2.2'] },
        { code: '3.2', title: 'Execute field scope', description: 'Perform work per drawings/spec, coordinate with stakeholders daily.', category: 'Construction', durationHours: 40, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 QA/QC',
      summary: 'Punch + client alignment.',
      tasks: [
        { code: '4.1', title: 'Quality control + punchlist', description: 'Self-perform punchlist, document outstanding items with photos.', category: 'Closeout', durationHours: 8, dependsOn: ['3.2'] },
      ],
    },
    {
      phase: '05 Closeout',
      summary: 'Turnover + financial wrap.',
      tasks: [
        { code: '5.1', title: 'Client sign-off + deliverables', description: 'Collect approvals, warranties, O&M, and final photos.', category: 'Closeout', durationHours: 6, dependsOn: ['4.1'] },
      ],
    },
  ],
  hvacRepair: [
    {
      phase: '01 Assessment',
      summary: 'Verify loads, equipment condition, and shutdown plan.',
      tasks: [
        { code: '1.1', title: 'Mechanical assessment', description: 'Document existing equipment, utilities, and control integration.', category: 'Mechanical', durationHours: 12 },
        { code: '1.2', title: 'Temporary conditioning plan', description: 'Model load during outage, coordinate with facilities.', category: 'Planning', durationHours: 6 },
      ],
    },
    {
      phase: '02 Engineering + Submittals',
      summary: 'Finalize tech submittals, permit package, and procurement.',
      tasks: [
        { code: '2.1', title: 'Equipment selection + submittals', description: 'Finalize AHRI selections, coordinate controls package.', category: 'Mechanical', durationHours: 10, dependsOn: ['1.1'] },
        { code: '2.2', title: 'Permit + inspection coordination', description: 'Upload drawings to jurisdiction, schedule State Fire Marshal if gas.', category: 'Planning', durationHours: 4, dependsOn: ['2.1'] },
        { code: '2.3', title: 'Order long-lead equipment', description: 'Release chillers/RTUs and confirm ship dates.', category: 'Mechanical', durationHours: 3, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Installation',
      summary: 'Demo, rigging, install, and rough-in.',
      tasks: [
        { code: '3.1', title: 'Demo + rigging', description: 'Isolate utilities, remove old units, rig new gear.', category: 'Mechanical', durationHours: 24, dependsOn: ['2.2', '2.3'] },
        { code: '3.2', title: 'Mechanical install + tie-ins', description: 'Set equipment, connect piping, controls, and electrical feeds.', category: 'Mechanical', durationHours: 32, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 Commissioning',
      summary: 'Startup, balancing, and owner training.',
      tasks: [
        { code: '4.1', title: 'Startup + TAB', description: 'Run manufacturer startup, test alarms, balance systems.', category: 'Mechanical', durationHours: 12, dependsOn: ['3.2'] },
        { code: '4.2', title: 'Owner training + turnover', description: 'Deliver O&M manuals, conduct hands-on training.', category: 'Closeout', durationHours: 6, dependsOn: ['4.1'] },
      ],
    },
  ],
  historicRestoration: [
    {
      phase: '01 Documentation',
      summary: 'Historic research, SHPO approvals, and mockups.',
      tasks: [
        { code: '1.1', title: 'Historic survey', description: 'Photograph, trace profiles, and log existing fabric.', category: 'Conservation', durationHours: 16 },
        { code: '1.2', title: 'SHPO coordination', description: 'Submit methods/materials for approval.', category: 'Conservation', durationHours: 8, dependsOn: ['1.1'] },
      ],
    },
    {
      phase: '02 Stabilization',
      summary: 'Protect artifacts and set up environmental controls.',
      tasks: [
        { code: '2.1', title: 'Protection + containment', description: 'Install barriers, humidity control, and monitoring.', category: 'Conservation', durationHours: 10, dependsOn: ['1.2'] },
      ],
    },
    {
      phase: '03 Restoration',
      summary: 'Perform detailed repairs by craft type.',
      tasks: [
        { code: '3.1', title: 'Conservation scope execution', description: 'Repair, replicate, and document per approvals.', category: 'Construction', durationHours: 40, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '04 Review + Records',
      summary: 'Final approvals and archiving.',
      tasks: [
        { code: '4.1', title: 'Final review with SHPO/architect', description: 'Host site walk, log any changes.', category: 'Conservation', durationHours: 6, dependsOn: ['3.1'] },
        { code: '4.2', title: 'Archive documentation', description: 'Package drawings, photos, approvals into digital binder.', category: 'Closeout', durationHours: 4, dependsOn: ['4.1'] },
      ],
    },
  ],
  lightingUpgrade: [
    {
      phase: '01 Concept + Mockups',
      summary: 'Define lighting intent and approvals.',
      tasks: [
        { code: '1.1', title: 'Lighting concept workshop', description: 'Review artifacts, lux limits, and aiming diagrams.', category: 'Electrical', durationHours: 8 },
        { code: '1.2', title: 'Mockup install + approval', description: 'Install sample fixtures, capture curator feedback.', category: 'Electrical', durationHours: 10, dependsOn: ['1.1'] },
      ],
    },
    {
      phase: '02 Procurement + Controls',
      summary: 'Finalize fixture schedule, controls, and phasing.',
      tasks: [
        { code: '2.1', title: 'Fixture submittals + ordering', description: 'Release long-lead lighting packages.', category: 'Electrical', durationHours: 6, dependsOn: ['1.2'] },
        { code: '2.2', title: 'Controls integration plan', description: 'Coordinate dimming zones, tie-ins, programming plan.', category: 'Electrical', durationHours: 6, dependsOn: ['1.2'] },
      ],
    },
    {
      phase: '03 Installation',
      summary: 'Night work / phased install.',
      tasks: [
        { code: '3.1', title: 'Demo + wiring adjustments', description: 'Remove legacy fixtures, rough new circuits.', category: 'Electrical', durationHours: 16, dependsOn: ['2.1'] },
        { code: '3.2', title: 'Install fixtures + aiming', description: 'Install fixtures, aim, label circuits.', category: 'Electrical', durationHours: 24, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 Commissioning',
      summary: 'Program scenes and train staff.',
      tasks: [
        { code: '4.1', title: 'Controls programming + QA', description: 'Program presets, verify code compliance.', category: 'Electrical', durationHours: 10, dependsOn: ['3.2'] },
        { code: '4.2', title: 'Owner training + turnover', description: 'Deliver aiming charts, O&M manuals.', category: 'Closeout', durationHours: 4, dependsOn: ['4.1'] },
      ],
    },
  ],
  tenantFinish: [
    {
      phase: '01 Design Assist',
      summary: 'Validate drawings, landlord approvals.',
      tasks: [
        { code: '1.1', title: 'Design coordination workshop', description: 'Review drawings, identify gaps, confirm landlord rules.', category: 'Planning', durationHours: 10 },
        { code: '1.2', title: 'Logistics + phasing plan', description: 'Noise restrictions, freight elevator schedule, temp walls.', category: 'Planning', durationHours: 8, dependsOn: ['1.1'] },
      ],
    },
    {
      phase: '02 Permits + Procurement',
      summary: 'Submit permit set, order finish materials.',
      tasks: [
        { code: '2.1', title: 'Permit submission package', description: 'Assemble drawings, energy forms, code summary.', category: 'Planning', durationHours: 6, dependsOn: ['1.1'] },
        { code: '2.2', title: 'Order long-lead finishes', description: 'Millwork, lighting, specialty items.', category: 'Interiors', durationHours: 5, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Build-Out',
      summary: 'Framing, MEP rough, drywall, finishes.',
      tasks: [
        { code: '3.1', title: 'Demolition + layout', description: 'Demo existing, snap layout, rough openings.', category: 'Construction', durationHours: 18, dependsOn: ['2.1'] },
        { code: '3.2', title: 'MEP rough-in + inspections', description: 'Run new feeders, plumbing stacks, ductwork.', category: 'Construction', durationHours: 32, dependsOn: ['3.1'] },
        { code: '3.3', title: 'Drywall + finishes install', description: 'Hang drywall, install ceilings, flooring, millwork.', category: 'Construction', durationHours: 40, dependsOn: ['3.2'] },
      ],
    },
    {
      phase: '04 Closeout',
      summary: 'Punch, commissioning, tenant move-in support.',
      tasks: [
        { code: '4.1', title: 'Punch + inspections', description: 'Architect/owner punchlist, AHJ sign-offs.', category: 'Closeout', durationHours: 10, dependsOn: ['3.3'] },
        { code: '4.2', title: 'Turnover + manuals', description: 'As-builts, O&M, keys/badges.', category: 'Closeout', durationHours: 6, dependsOn: ['4.1'] },
      ],
    },
  ],
  roofing: [
    {
      phase: '01 Investigation',
      summary: 'Core samples, infrared scans, warranty status.',
      tasks: [
        { code: '1.1', title: 'Roof survey + testing', description: 'Document slope, drains, membrane condition.', category: 'Envelope', durationHours: 12 },
      ],
    },
    {
      phase: '02 Design + Approvals',
      summary: 'Assembly selection, uplift calculations, NOA.',
      tasks: [
        { code: '2.1', title: 'Assembly selection + details', description: 'Select membrane, insulation, attachment pattern.', category: 'Envelope', durationHours: 8, dependsOn: ['1.1'] },
        { code: '2.2', title: 'Permit + manufacturer warranty', description: 'Submit drawings, pre-install conference.', category: 'Planning', durationHours: 4, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Production',
      summary: 'Tear-off, substrate prep, new roofing.',
      tasks: [
        { code: '3.1', title: 'Tear-off + substrate repair', description: 'Remove membrane, fix deck, address hidden issues.', category: 'Construction', durationHours: 32, dependsOn: ['2.2'] },
        { code: '3.2', title: 'Install new roofing system', description: 'Adhere insulation, membrane, flashing, sheet metal.', category: 'Construction', durationHours: 40, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 Finalization',
      summary: 'Punch, inspection, warranty registration.',
      tasks: [
        { code: '4.1', title: 'Final inspection + punch', description: 'Manufacturer and AHJ inspections.', category: 'Closeout', durationHours: 8, dependsOn: ['3.2'] },
      ],
    },
  ],
  sitework: [
    {
      phase: '01 Survey + Permits',
      summary: 'Topo, utilities, permit strategy.',
      tasks: [
        { code: '1.1', title: 'Survey + locates', description: 'Topo survey, utility locates, soil borings as needed.', category: 'Civil', durationHours: 16 },
        { code: '1.2', title: 'Permit coordination', description: 'Stormwater, erosion control, traffic control approvals.', category: 'Planning', durationHours: 8, dependsOn: ['1.1'] },
      ],
    },
    {
      phase: '02 Earthwork',
      summary: 'Clearing, grading, base prep.',
      tasks: [
        { code: '2.1', title: 'Clearing + demo', description: 'Remove vegetation/obstructions, export debris.', category: 'Civil', durationHours: 20, dependsOn: ['1.2'] },
        { code: '2.2', title: 'Rough grading + base prep', description: 'Cut/fill to subgrade, stabilize base.', category: 'Civil', durationHours: 24, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Utilities + Surfaces',
      summary: 'Undergrounds, paving, striping.',
      tasks: [
        { code: '3.1', title: 'Utility install', description: 'Storm, water, power, lighting conduits.', category: 'Civil', durationHours: 28, dependsOn: ['2.2'] },
        { code: '3.2', title: 'Paving + finishes', description: 'Place asphalt/concrete, striping, signage.', category: 'Civil', durationHours: 32, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 Punch + Turnover',
      summary: 'Final QA and documentation.',
      tasks: [
        { code: '4.1', title: 'Punchlist + stabilization', description: 'Fine grade, seed, correct punch items.', category: 'Closeout', durationHours: 10, dependsOn: ['3.2'] },
      ],
    },
  ],
  plumbing: [
    {
      phase: '01 Investigation',
      tasks: [
        { code: '1.1', title: 'Fixture + piping survey', description: 'Document fixture counts, riser routing, code gaps.', category: 'Plumbing', durationHours: 10 },
      ],
      summary: 'Understand existing conditions.',
    },
    {
      phase: '02 Design & Permitting',
      tasks: [
        { code: '2.1', title: 'Code review + drawing updates', description: 'Coordinate code updates, backflow, cleanouts.', category: 'Plumbing', durationHours: 8, dependsOn: ['1.1'] },
        { code: '2.2', title: 'Permitting + inspection plan', description: 'Submit drawings, schedule inspections.', category: 'Plumbing', durationHours: 4, dependsOn: ['2.1'] },
      ],
      summary: 'Finalize design & approvals.',
    },
    {
      phase: '03 Installation',
      tasks: [
        { code: '3.1', title: 'Rough-in + tie-ins', description: 'Shut downs, demo, and install new piping.', category: 'Plumbing', durationHours: 24, dependsOn: ['2.2'] },
        { code: '3.2', title: 'Fixture set + trim', description: 'Set fixtures, sealants, accessories.', category: 'Plumbing', durationHours: 12, dependsOn: ['3.1'] },
      ],
      summary: 'Field work execution.',
    },
    {
      phase: '04 Testing + Closeout',
      tasks: [
        { code: '4.1', title: 'Testing + inspections', description: 'Pressure test, insulation, AHJ inspections.', category: 'Plumbing', durationHours: 8, dependsOn: ['3.2'] },
      ],
      summary: 'Validation + turnover.',
    },
  ],
  concrete: [
    {
      phase: '01 Engineering',
      summary: 'Structural calcs, mix design.',
      tasks: [
        { code: '1.1', title: 'Engineering coordination', description: 'Review loads, rebar schedules, mix design.', category: 'Structural', durationHours: 10 },
      ],
    },
    {
      phase: '02 Formwork + Rebar',
      summary: 'Prep for pour.',
      tasks: [
        { code: '2.1', title: 'Layout + formwork', description: 'Set forms, embeds, sleeves.', category: 'Structural', durationHours: 16, dependsOn: ['1.1'] },
        { code: '2.2', title: 'Install reinforcing', description: 'Place rebar per schedules.', category: 'Structural', durationHours: 14, dependsOn: ['2.1'] },
      ],
    },
    {
      phase: '03 Placement',
      summary: 'Concrete placement & finishing.',
      tasks: [
        { code: '3.1', title: 'Concrete pour + finish', description: 'Coordinate trucks, place, vibrate, finish, cure.', category: 'Structural', durationHours: 20, dependsOn: ['2.2'] },
      ],
    },
    {
      phase: '04 Cure + Turnover',
      summary: 'Strip, cure, punch.',
      tasks: [
        { code: '4.1', title: 'Strip forms + punchlist', description: 'Remove forms, patch, cure monitoring.', category: 'Closeout', durationHours: 10, dependsOn: ['3.1'] },
      ],
    },
  ],
  eventSetup: [
    {
      phase: '01 Concept + Logistics',
      summary: 'Understand event program and constraints.',
      tasks: [
        { code: '1.1', title: 'Program + layout workshop', description: 'Confirm guest count, layout, ADA, weather plan.', category: 'Events', durationHours: 6 },
        { code: '1.2', title: 'Logistics + vendor coordination', description: 'Plan deliveries, temp power, rentals.', category: 'Events', durationHours: 5, dependsOn: ['1.1'] },
      ],
    },
    {
      phase: '02 Procurement',
      summary: 'Secure rentals and specialty vendors.',
      tasks: [
        { code: '2.1', title: 'Rental + décor orders', description: 'Reserve tenting, FF&E, décor, AV.', category: 'Events', durationHours: 4, dependsOn: ['1.2'] },
        { code: '2.2', title: 'Staffing + run of show', description: 'Build staffing plan, sequence, call sheets.', category: 'Events', durationHours: 4, dependsOn: ['1.2'] },
      ],
    },
    {
      phase: '03 Install',
      summary: 'On-site build + tech rehearsal.',
      tasks: [
        { code: '3.1', title: 'Install FF&E + décor', description: 'Build staging, lighting, décor elements.', category: 'Events', durationHours: 18, dependsOn: ['2.1'] },
        { code: '3.2', title: 'AV + lighting rehearsal', description: 'Sound check, lighting focus, run-through.', category: 'Events', durationHours: 8, dependsOn: ['3.1'] },
      ],
    },
    {
      phase: '04 Event Support + Strike',
      summary: 'Live event and teardown.',
      tasks: [
        { code: '4.1', title: 'Show call + client support', description: 'Manage show, troubleshoot issues.', category: 'Events', durationHours: 10, dependsOn: ['3.2'] },
        { code: '4.2', title: 'Strike + restoration', description: 'Remove rentals, clean site, restore conditions.', category: 'Events', durationHours: 12, dependsOn: ['4.1'] },
      ],
    },
  ],
};

function createMessage(role: 'User' | 'Assistant', content: string): IntakeConversationMessage {
  return { id: id('msg'), role, content, timestamp: new Date().toISOString() };
}

function buildQuestions(template: TaskTemplate): string[] {
  const templateConfig = projectTaskService.getTemplateLibrary().find((tpl) => tpl.id === template);
  const defaults = ['Any hard deadlines or shutdown windows?', 'Do we have drawings/specs or should we survey from scratch?', 'List any known constraints (budget caps, historic rules, sensitive occupants).'];
  if (!templateConfig) return defaults;
  return [...templateConfig.walkthroughQuestions.slice(0, 3), ...defaults];
}

function flattenWbs(phases: WbsPhase[]) {
  return phases.flatMap((phase) =>
    phase.tasks.map((task) => ({
      title: `${task.code} ${task.title}`,
      description: `[${phase.phase}] ${task.description}`,
      category: task.category as WorkOrderCategory,
      status: 'Requested' as const,
      priority: 'Medium' as const,
      phase: phase.phase,
      wbsCode: task.code,
      durationHours: task.durationHours,
      dependsOn: task.dependsOn,
    }))
  );
}

export const aiTaskPlannerService = {
  beginConversation(scopeSummary: string): { conversation: IntakeConversationState; analysis: ScopeAnalysisResult } {
    const cleaned = scopeSummary.trim();
    const analysis = scopeAnalysisService.analyze(cleaned, undefined);
    const template = analysis.primaryTemplate;
    const questions = buildQuestions(template);
    const firstResponse = questions.length > 0 ? `To dial this in, let me confirm a few points:\n• ${questions.slice(0, 3).join('\n• ')}` : 'I have what I need. Ready when you are!';
    const messages: IntakeConversationMessage[] = [createMessage('User', cleaned), createMessage('Assistant', `Sounds like a ${analysis.primaryTemplate} style project. ${firstResponse}`)];
    const conversation: IntakeConversationState = {
      id: id('intake'),
      scopeSummary: cleaned,
      messages,
      pendingQuestions: questions,
      responses: {},
      recommendedTemplate: template,
      readyForPlan: questions.length === 0,
    };
    return { conversation, analysis };
  },

  recordAnswer(state: IntakeConversationState, answer: string): IntakeConversationState {
    if (!state.pendingQuestions.length) {
      const updatedMessages = [...state.messages, createMessage('User', answer.trim())];
      return { ...state, messages: updatedMessages, readyForPlan: true };
    }
    const [currentQuestion, ...rest] = state.pendingQuestions;
    const responses = { ...state.responses, [currentQuestion]: answer.trim() };
    const updatedMessages = [...state.messages, createMessage('User', answer.trim())];
    let reply = 'Noted.';
    if (rest.length > 0) {
      reply = `Great. ${rest[0]}`;
    } else {
      reply = 'Perfect. I have what I need to build a full work plan.';
    }
    updatedMessages.push(createMessage('Assistant', reply));
    return {
      ...state,
      messages: updatedMessages,
      pendingQuestions: rest,
      responses,
      readyForPlan: rest.length === 0,
    };
  },

  buildPlan(state: IntakeConversationState): { plan: ProjectPlan; phases: WbsPhase[] } {
    const template = state.recommendedTemplate;
    const templateConfig = projectTaskService.getTemplateLibrary().find((tpl) => tpl.id === template);
    const phases = WBS_LIBRARY[template] || WBS_LIBRARY.default;
    const flattenedTasks = flattenWbs(phases);
    const responseSummary = Object.entries(state.responses)
      .map(([question, response]) => `${question} → ${response}`)
      .join('\n');
    const narrative = responseSummary ? `${state.scopeSummary}\n\nClarifications:\n${responseSummary}` : state.scopeSummary;
    const plan = {
      questions: templateConfig ? templateConfig.walkthroughQuestions : [],
      materials: templateConfig?.materialSummary ?? 'Materials will be confirmed after detailed takeoff.',
      labor: templateConfig?.laborSummary ?? 'Use blended crew with PM oversight.',
      costHeuristic: templateConfig?.costHeuristic ?? 'Track actuals vs. budget each phase.',
      tasks: flattenedTasks,
      templateName: `${templateConfig?.name ?? 'Custom'} WBS`,
      description: narrative,
    };
    return { plan, phases };
  },
};
