import type { IntakeChannel, LeadNextStep, Priority, WalkthroughPrepBrief } from '../data/pipeline';
import { aiService } from './aiService';

export type IntakeDecisionInput = {
  issueSummary: string;
  urgency?: Priority;
  intakeChannel?: IntakeChannel;
  accessNotes?: string;
};

export type IntakeDecision = {
  nextStep: LeadNextStep;
  confidence: number;
  rationale: string;
  requiresWalkthrough: boolean;
  projectType: string;
  prepBrief: WalkthroughPrepBrief;
};

const EMERGENCY_KEYWORDS = ['leak', 'burst', 'flood', 'fire', 'gas', 'boiler', 'chiller down', 'power outage'];
const NURTURE_KEYWORDS = ['idea', 'concept', 'maybe', 'future', 'budgetary', 'planning'];

function computeScore(summary: string, urgency?: Priority) {
  const lower = summary.toLowerCase();
  if (urgency === 'Critical') return 0.95;
  if (EMERGENCY_KEYWORDS.some((keyword) => lower.includes(keyword))) return 0.9;
  if (urgency === 'High') return 0.75;
  if (NURTURE_KEYWORDS.some((keyword) => lower.includes(keyword))) return 0.35;
  return 0.55;
}

function detectNextStep(summary: string, urgency?: Priority): IntakeDecision {
  const score = computeScore(summary, urgency);
  const projectType = aiService.walkthroughPlanner.detectProjectType(summary);
  const prepBrief = aiService.walkthroughPlanner.generatePrepBrief(summary);
  if (score >= 0.85) {
    return {
      nextStep: 'DispatchCrew',
      confidence: score,
      rationale: 'Critical language detected. Recommend immediate dispatch or emergency walkthrough.',
      requiresWalkthrough: true,
      projectType,
      prepBrief,
    };
  }
  if (score >= 0.6) {
    return {
      nextStep: 'ScheduleWalkthrough',
      confidence: score,
      rationale: 'High urgency scope. Schedule a walkthrough to build scope of work.',
      requiresWalkthrough: true,
      projectType,
      prepBrief,
    };
  }
  if (score >= 0.45) {
    return {
      nextStep: 'EstimateOnly',
      confidence: score,
      rationale: 'Moderate request. Prepare estimate/rough order of magnitude and follow up.',
      requiresWalkthrough: false,
      projectType,
      prepBrief,
    };
  }
  return {
    nextStep: 'NurtureSequence',
    confidence: score,
    rationale: 'Exploratory language detected. Enroll in nurture sequence until scope is ready.',
    requiresWalkthrough: false,
    projectType,
    prepBrief,
  };
}

export const intakeDecisionService = {
  evaluate(input: IntakeDecisionInput): IntakeDecision {
    return detectNextStep(input.issueSummary || '', input.urgency);
  },
};
