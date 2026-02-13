import { aiDecisionService } from './aiDecisionService';
import { type ContractType, type AIPricingSnapshot } from '../data/pipeline';

type LaborClassConfig = {
  baseWage: number;
  payrollTaxRate: number;
  workersCompRate: number;
  benefitsRate: number;
  annualVehicleAllocation: number;
  annualToolAllocation: number;
  supervisionAllocation: number;
  productiveHoursPerYear: number;
};

const LABOR_CLASSES: Record<string, LaborClassConfig> = {
  carpenter: {
    baseWage: 28,
    payrollTaxRate: 0.1,
    workersCompRate: 0.15,
    benefitsRate: 0.2,
    annualVehicleAllocation: 18000,
    annualToolAllocation: 3000,
    supervisionAllocation: 22000,
    productiveHoursPerYear: 1600,
  },
  electrician: {
    baseWage: 32,
    payrollTaxRate: 0.1,
    workersCompRate: 0.12,
    benefitsRate: 0.22,
    annualVehicleAllocation: 16000,
    annualToolAllocation: 3500,
    supervisionAllocation: 20000,
    productiveHoursPerYear: 1600,
  },
  laborer: {
    baseWage: 22,
    payrollTaxRate: 0.1,
    workersCompRate: 0.18,
    benefitsRate: 0.18,
    annualVehicleAllocation: 9500,
    annualToolAllocation: 1500,
    supervisionAllocation: 15000,
    productiveHoursPerYear: 1650,
  },
  pm: {
    baseWage: 40,
    payrollTaxRate: 0.1,
    workersCompRate: 0.05,
    benefitsRate: 0.25,
    annualVehicleAllocation: 8000,
    annualToolAllocation: 2000,
    supervisionAllocation: 0,
    productiveHoursPerYear: 1550,
  },
};

const DEFAULT_OVERHEAD = {
  annualOverhead: 750000,
  revenueTarget: 5000000,
};

type LaborMixInput = { laborClass: string; hours: number };
type MaterialInput = { name: string; quantity: number; unitCost: number; escalationPercent?: number };
type SubcontractorInput = { name: string; quote: number; markupPercent?: number };
type EquipmentInput = { description: string; hours: number; rate: number };
type PermitInput = { description: string; cost: number };

export type PricingInput = {
  contractId?: string;
  scopeClarity: number; // 1-5
  projectSize: number;
  historicFlag?: boolean;
  permitComplexity?: 'Low' | 'Medium' | 'High';
  durationDays: number;
  laborMix: LaborMixInput[];
  materials: MaterialInput[];
  subcontractors: SubcontractorInput[];
  equipment?: EquipmentInput[];
  permits?: PermitInput[];
  overheadRate?: number;
  baseMargin?: number;
  contingencyPercent?: number;
};

export type PricingResult = {
  snapshot: AIPricingSnapshot;
  totalPrice: number;
  directCost: number;
  grossProfit: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function computeBurdenedRate(laborClass: string): number {
  const config = LABOR_CLASSES[laborClass] || LABOR_CLASSES.carpenter;
  const base = config.baseWage;
  const payroll = base * config.payrollTaxRate;
  const workersComp = base * config.workersCompRate;
  const benefits = base * config.benefitsRate;
  const allocation = (config.annualVehicleAllocation + config.annualToolAllocation + config.supervisionAllocation) / config.productiveHoursPerYear;
  return base + payroll + workersComp + benefits + allocation;
}

function pickContractType(scopeClarity: number, historicFlag?: boolean): ContractType {
  if (scopeClarity <= 2) return 'CostPlus';
  if (historicFlag) return 'Fixed';
  return 'Fixed';
}

function computeRiskScore(input: PricingInput): number {
  let score = 30;
  score += (5 - input.scopeClarity) * 7;
  if (input.historicFlag) score += 12;
  if (input.permitComplexity === 'High') score += 10;
  if (input.durationDays > 210) score += 5;
  if (input.projectSize > 250000) score += 6;
  return clamp(score, 0, 100);
}

function contingencyFromRisk(riskScore: number): number {
  if (riskScore >= 80) return 0.15;
  if (riskScore >= 60) return 0.12;
  if (riskScore >= 40) return 0.1;
  if (riskScore >= 20) return 0.08;
  return 0.05;
}

function marginAdjustment(riskScore: number): number {
  if (riskScore >= 80) return 0.12;
  if (riskScore >= 60) return 0.08;
  if (riskScore >= 40) return 0.05;
  if (riskScore >= 20) return 0.03;
  return 0;
}

export const aiPricingEngine = {
  generatePricing(projectId: string, input: PricingInput): PricingResult {
    const laborRateSnapshot: Record<string, number> = {};
    const laborCost = input.laborMix.reduce((sum, mix) => {
      const hours = Math.max(mix.hours, 0);
      const rate = computeBurdenedRate(mix.laborClass);
      laborRateSnapshot[mix.laborClass] = rate;
      return sum + hours * rate;
    }, 0);

    const materialCost = input.materials.reduce((sum, material) => {
      const escalation = material.escalationPercent ?? 0;
      return sum + material.quantity * material.unitCost * (1 + escalation);
    }, 0);

    const subcontractorCost = input.subcontractors.reduce((sum, sub) => sum + sub.quote * (1 + (sub.markupPercent ?? 0.1)), 0);
    const equipmentCost = (input.equipment || []).reduce((sum, equip) => sum + equip.hours * equip.rate, 0);
    const permitCost = (input.permits || []).reduce((sum, permit) => sum + permit.cost, 0);

    const directCost = laborCost + materialCost + subcontractorCost + equipmentCost + permitCost;

    const overheadRate = input.overheadRate ?? DEFAULT_OVERHEAD.annualOverhead / DEFAULT_OVERHEAD.revenueTarget;
    const overheadAllocated = directCost * overheadRate;

    const riskScore = computeRiskScore(input);
    const contingencyPercent = input.contingencyPercent ?? contingencyFromRisk(riskScore);
    const contingency = directCost * contingencyPercent;

    const minMargin = 0.18;
    const baseMargin = input.baseMargin ?? 0.28;
    const adjustedMargin = clamp(baseMargin + marginAdjustment(riskScore), minMargin, 0.6);
    const grossProfitBase = directCost + overheadAllocated + contingency;
    const grossProfit = grossProfitBase * adjustedMargin;
    const totalPrice = directCost + overheadAllocated + contingency + grossProfit;

    if (totalPrice < directCost + overheadAllocated) {
      throw new Error('Pricing below direct cost + overhead.');
    }

    const suggestedContractType = pickContractType(input.scopeClarity, input.historicFlag);

    const snapshot = aiDecisionService.recordPricingSnapshot({
      projectId,
      contractId: input.contractId,
      directCost,
      overheadAllocated,
      contingency,
      grossProfit,
      projectedMargin: adjustedMargin,
      riskScore,
      suggestedContractType,
      pricingVersion: 'v1.1.0',
      laborRateSnapshot,
      overheadRateSnapshot: {
        annualOverhead: DEFAULT_OVERHEAD.annualOverhead,
        revenueTarget: DEFAULT_OVERHEAD.revenueTarget,
        overheadRate,
      },
      contingencyNotes: `Risk score ${riskScore} -> ${Math.round(contingencyPercent * 100)}% contingency`,
      createdBy: 'system-ai',
    });

    return {
      snapshot,
      totalPrice,
      directCost,
      grossProfit,
    };
  },
};
