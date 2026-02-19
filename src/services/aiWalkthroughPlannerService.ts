import type { WalkthroughPlan, WalkthroughPrepBrief } from '../data/pipeline';

const PROJECT_TYPE_KEYWORDS: Record<string, string[]> = {
  Roofing: ['roof', 'membrane', 'shingle', 'gutters'],
  HVAC: ['boiler', 'chiller', 'hvac', 'air handler', 'duct'],
  Electrical: ['lighting', 'panel', 'generator', 'power'],
  Interiors: ['paint', 'floor', 'millwork', 'interior'],
  Plumbing: ['plumbing', 'pipe', 'bathroom', 'fixture'],
};

function detectProjectType(summary: string): string {
  const lower = summary.toLowerCase();
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return type;
    }
  }
  return 'General Construction';
}

function buildPrepBrief(summary: string, projectType: string): WalkthroughPrepBrief {
  return {
    projectType,
    summary: `AI classified this as a ${projectType} engagement based on: "${summary}". Use the walkthrough to validate scope, constraints, and long-lead obstacles.`,
    keyQuestions: [
      'What are the shutdown windows or tenant constraints?',
      'What existing conditions could impact the install path?',
      'Where can crews stage materials, dumpsters, or lifts?',
    ],
    recommendedTrades: projectType === 'Roofing'
      ? ['Superintendent', 'Roofing Foreman', 'Rigging Crew', 'Safety Officer']
      : ['Project Manager', 'Lead Technician', 'Safety Officer'],
    supplies: projectType === 'Roofing'
      ? [
          { item: 'Fall protection + safety cart' },
          { item: 'Infrared scanner / moisture meter' },
          { item: 'Core sample kit', quantity: '1 set' },
        ]
      : [
          { item: 'Laser tape + moisture meter' },
          { item: 'Inspection PPE', quantity: 'Per crew' },
        ],
  };
}

function buildWalkthroughPlan(projectType: string, prepBrief: WalkthroughPrepBrief): WalkthroughPlan {
  const baseSteps = [
    {
      title: 'Meet client + confirm logistics',
      instructions: 'Confirm scope intent, sensitive areas, shutdown windows, and key stakeholders.',
      trades: ['Project Manager'],
      materials: [],
      durationHours: 1,
    },
    {
      title: 'Document existing conditions',
      instructions: 'Capture photos, measurements, and material profiles for each impacted area.',
      trades: ['Project Manager', 'Technician'],
      materials: ['Camera', 'Laser tape'],
      durationHours: 2,
    },
  ];
  if (projectType === 'Roofing') {
    baseSteps.push(
      {
        title: 'Perform roof scan & inspection',
        instructions: 'Pull core samples, review flashing, look for ponding, confirm deck type.',
        trades: ['Roofing Foreman'],
        materials: ['Core sample kit', 'Infrared scanner'],
        durationHours: 2,
      },
      {
        title: 'Plan rigging + staging',
        instructions: 'Identify crane access, dumpster placement, and fall protection anchor points.',
        trades: ['Superintendent', 'Safety Officer'],
        materials: ['Site map', 'Safety plan template'],
        durationHours: 1,
      }
    );
  }

  return {
    steps: baseSteps,
    supplyList: prepBrief.supplies,
    laborStack: prepBrief.recommendedTrades.map((role) => ({ role, hours: 4 })),
    checklist: prepBrief.keyQuestions,
  };
}

export const aiWalkthroughPlannerService = {
  detectProjectType,
  generatePrepBrief(summary: string) {
    const projectType = detectProjectType(summary);
    return buildPrepBrief(summary, projectType);
  },
  generateWalkthroughPlan(projectType: string, prepBrief: WalkthroughPrepBrief): WalkthroughPlan {
    return buildWalkthroughPlan(projectType, prepBrief);
  },
  finalizeExecutionPlan(responses: Record<string, string>, existingPlan: WalkthroughPlan): WalkthroughPlan {
    const notes = Object.entries(responses)
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');
    return {
      ...existingPlan,
      supplyList: existingPlan.supplyList.map((item) => ({
        ...item,
        notes: item.notes ? `${item.notes} | ${notes}` : notes,
      })),
    };
  },
};
