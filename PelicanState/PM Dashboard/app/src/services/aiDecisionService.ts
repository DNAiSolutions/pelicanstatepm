import {
  mockAIContractRecommendations,
  mockAIPricingSnapshots,
  type AIContractRecommendation,
  type AIPricingSnapshot,
  type ContractType,
  type BillingMethod,
} from '../data/pipeline';

type RecommendationInput = {
  scopeClarity: number; // 1-5
  estimatedValue: number;
  historicFlag?: boolean;
  permitComplexity?: 'Low' | 'Medium' | 'High';
  durationDays?: number;
  clientType?: string;
  riskTolerance?: 'Low' | 'Medium' | 'High';
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function pickContractType(input: RecommendationInput): ContractType {
  if (input.scopeClarity <= 2) return 'CostPlus';
  if (input.historicFlag) return 'Fixed';
  if ((input.permitComplexity === 'High' || input.durationDays && input.durationDays > 210) && input.riskTolerance === 'Low') {
    return 'CostPlus';
  }
  if (input.estimatedValue < 25000) return 'T&M';
  return 'Fixed';
}

function pickBillingMethod(contractType: ContractType): BillingMethod {
  switch (contractType) {
    case 'Fixed':
      return 'Milestone';
    case 'CostPlus':
      return 'Progress';
    case 'Retainer':
      return 'Simple';
    default:
      return 'Simple';
  }
}

function computeRiskScore(input: RecommendationInput): number {
  let score = 40;
  score += (5 - input.scopeClarity) * 6;
  if (input.historicFlag) score += 12;
  if (input.permitComplexity === 'High') score += 10;
  if (input.durationDays && input.durationDays > 200) score += 5;
  if (input.riskTolerance === 'High') score -= 5;
  return Math.min(100, Math.max(0, score));
}

export const aiDecisionService = {
  listContractRecommendations(projectId: string): AIContractRecommendation[] {
    return mockAIContractRecommendations.filter((rec) => rec.projectId === projectId);
  },

  listPricingSnapshots(projectId: string): AIPricingSnapshot[] {
    return mockAIPricingSnapshots.filter((snapshot) => snapshot.projectId === projectId);
  },

  recordRecommendation(rec: Omit<AIContractRecommendation, 'id' | 'createdAt'>): AIContractRecommendation {
    const recommendation: AIContractRecommendation = {
      ...rec,
      id: `ai-rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockAIContractRecommendations.push(recommendation);
    return recommendation;
  },

  generateRecommendation(projectId: string, input: RecommendationInput): AIContractRecommendation {
    const suggestedContract = pickContractType(input);
    const suggestedBilling = pickBillingMethod(suggestedContract);
    const riskScore = computeRiskScore(input);
    const confidenceScore = clamp(0.9 - riskScore / 200);

    const recommendation: AIContractRecommendation = {
      id: `ai-rec-${Date.now()}`,
      projectId,
      suggestedContract,
      suggestedBilling,
      rationale: this.buildRationale(suggestedContract, input),
      riskScore,
      confidenceScore,
      aiInputSnapshot: input,
      aiOutputSnapshot: { suggestedContract, suggestedBilling, riskScore },
      createdAt: new Date().toISOString(),
      createdBy: 'system-ai',
    };

    mockAIContractRecommendations.push(recommendation);
    return recommendation;
  },

  buildRationale(contractType: ContractType, input: RecommendationInput): string {
    switch (contractType) {
      case 'CostPlus':
        return 'Low scope clarity and high unknowns favor cost-plus with shared risk.';
      case 'T&M':
        return 'Smaller scope benefits from flexible time-and-materials billing.';
      case 'Retainer':
        return 'Ongoing maintenance scope is best captured as a retainer with simple billing.';
      default:
        return input.historicFlag
          ? 'Historic compliance scope is well-defined; fixed contract protects margin.'
          : 'Defined scope supports fixed fee + milestone billing.';
    }
  },

  recordPricingSnapshot(snapshot: Omit<AIPricingSnapshot, 'id' | 'createdAt'>): AIPricingSnapshot {
    const entry: AIPricingSnapshot = {
      ...snapshot,
      id: `ai-price-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockAIPricingSnapshots.push(entry);
    return entry;
  },
};
