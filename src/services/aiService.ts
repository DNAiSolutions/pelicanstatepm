import { aiWalkthroughPlannerService } from './aiWalkthroughPlannerService';
import { aiTaskPlannerService } from './aiTaskPlannerService';
import { aiEstimateService } from './aiEstimateService';
import { aiDecisionService } from './aiDecisionService';
import { aiPricingEngine } from './aiPricingEngine';

export const aiService = {
  walkthroughPlanner: aiWalkthroughPlannerService,
  taskPlanner: aiTaskPlannerService,
  estimate: aiEstimateService,
  decision: aiDecisionService,
  pricing: aiPricingEngine,
};

export type { PricingInput, PricingResult } from './aiPricingEngine';
export type { AiEstimateService } from './aiEstimateService';
