import { projectTaskService, type TaskTemplate } from './projectTaskService';
import type { ScopeAnalysisResult, ScopeComplianceFlag } from '../data/pipeline';
import { matchPermitRules, type Jurisdiction } from './louisianaKnowledgeBase';

const STOPWORDS = new Set([
  'the',
  'and',
  'or',
  'of',
  'a',
  'to',
  'for',
  'in',
  'on',
  'at',
  'with',
  'by',
  'an',
  'be',
  'is',
  'are',
  'this',
  'that',
  'it',
  'from',
  'as',
  'we',
]);

const COMPLIANCE_KEYWORDS: Record<string, { type: ScopeComplianceFlag['type']; message: string; severity: ScopeComplianceFlag['severity']; source: string }> = {
  historic: {
    type: 'Historic',
    message: 'Historic keywords detected. SHPO/HDLC review may be required.',
    severity: 'Warning',
    source: 'Scope keywords',
  },
  shpo: {
    type: 'Historic',
    message: 'SHPO referenced. Ensure documentation package is prepared.',
    severity: 'Info',
    source: 'Scope keywords',
  },
  boiler: {
    type: 'Permit',
    message: 'Boiler replacements require mechanical + fuel permits in Louisiana.',
    severity: 'Warning',
    source: 'Scope keywords',
  },
  gas: {
    type: 'Safety',
    message: 'Gas work requires lockout/tagout and leak checks.',
    severity: 'Info',
    source: 'Scope keywords',
  },
  asbestos: {
    type: 'Environmental',
    message: 'Asbestos mention triggers AHERA survey requirements.',
    severity: 'Critical',
    source: 'Scope keywords',
  },
  roof: {
    type: 'Safety',
    message: 'Roof access requires fall protection planning.',
    severity: 'Info',
    source: 'Scope keywords',
  },
};

const JURISDICTION_HINTS: Record<Jurisdiction, string[]> = {
  Louisiana: ['louisiana', 'la'],
  NewOrleans: ['new orleans', 'nola', 'orleans parish', 'french quarter', 'marigny', 'garden district'],
  BatonRouge: ['baton rouge', 'ebr', 'east baton rouge', 'mid city', 'spanish town'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token));
}

function detectJurisdiction(tokens: string[]): Jurisdiction | undefined {
  const joined = tokens.join(' ');
  for (const [jurisdiction, hints] of Object.entries(JURISDICTION_HINTS) as [Jurisdiction, string[]][]) {
    if (hints.some((hint) => joined.includes(hint))) {
      return jurisdiction;
    }
  }
  return undefined;
}

function buildComplianceFlags(tokens: string[]): ScopeComplianceFlag[] {
  const flags: ScopeComplianceFlag[] = [];
  const usedKeys = new Set<string>();
  tokens.forEach((token) => {
    const entry = COMPLIANCE_KEYWORDS[token];
    if (entry && !usedKeys.has(token)) {
      flags.push({ id: `flag-${token}`, ...entry });
      usedKeys.add(token);
    }
  });
  return flags;
}

function scoreTemplate(keywords: string[], templateKeywords: string[]): number {
  if (!keywords.length) return 0;
  const matches = templateKeywords.reduce((score, keyword) => {
    const directMatch = keywords.includes(keyword);
    if (directMatch) return score + 2;
    const fuzzyMatch = keywords.some((token) => token.startsWith(keyword.slice(0, Math.max(3, keyword.length - 2))));
    return fuzzyMatch ? score + 1 : score;
  }, 0);
  return Math.min(1, matches / Math.max(templateKeywords.length, 1));
}

export const scopeAnalysisService = {
  analyze(scopeText: string, selectedTemplate?: TaskTemplate): ScopeAnalysisResult {
    const tokens = tokenize(scopeText || '');
    const keywords = tokens.slice(0, 50);
    const templateLibrary = projectTaskService.getTemplateLibrary();
    const scored = templateLibrary.map((template) => ({
      template: template.id,
      confidence: scoreTemplate(keywords, template.keywords),
    }));

    scored.sort((a, b) => b.confidence - a.confidence);
    const fallbackTemplate = selectedTemplate || scored[0]?.template || 'default';
    const primaryEntry = scored.find((entry) => entry.confidence > 0.1) || { template: fallbackTemplate, confidence: 0.4 };

    if (selectedTemplate && primaryEntry.template !== selectedTemplate) {
      scored.unshift({ template: selectedTemplate, confidence: Math.max(primaryEntry.confidence, 0.7) });
    }

    const jurisdiction = detectJurisdiction(tokens);
    const complianceFlags = [...buildComplianceFlags(tokens)];
    const permitMatches = matchPermitRules(keywords, jurisdiction);
    permitMatches.forEach((rule) => {
      complianceFlags.push({
        id: `permit-${rule.id}`,
        type: 'Permit',
        severity: 'Warning',
        message: `${rule.type} permit likely required in ${rule.jurisdiction}.`,
        source: rule.description,
      });
    });

    const secondarySuggestions = scored
      .filter((entry) => entry.template !== primaryEntry.template)
      .slice(0, 3)
      .map((entry) => ({ template: entry.template, confidence: Math.round(entry.confidence * 100) / 100 }));

    return {
      scopeText,
      primaryTemplate: primaryEntry.template,
      primaryConfidence: Math.round(primaryEntry.confidence * 100) / 100,
      secondarySuggestions,
      complianceFlags,
      detectedKeywords: keywords,
      suggestedJurisdiction: jurisdiction,
      rationale:
        primaryEntry.confidence > 0.6
          ? 'Strong keyword alignment with selected template.'
          : 'Moderate match. Consider reviewing alternative templates.',
    };
  },
};
