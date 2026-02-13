import type {
  ConsultationChecklist,
  IntakeChecklistItem,
  IntakeResearchSnippet,
  ScopeAnalysisResult,
} from '../data/pipeline';
import { projectTaskService, type TaskTemplate } from './projectTaskService';
import {
  findMeasurementGuide,
  detectSafetyNotes,
  findCodeReferences,
  matchPermitRules,
  type Jurisdiction,
} from './louisianaKnowledgeBase';

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7)}-${Date.now().toString(36)}`;

function toChecklistItem(text: string, reason?: string): IntakeChecklistItem {
  return {
    id: id('item'),
    text,
    reason,
    required: true,
    checked: false,
  };
}

function buildQuestions(template: TaskTemplate, scopeText: string): IntakeChecklistItem[] {
  const templateLibrary = projectTaskService.getTemplateLibrary();
  const config = templateLibrary.find((tpl) => tpl.id === template) || templateLibrary[0];
  const items = config.walkthroughQuestions.map((question) => toChecklistItem(question));
  if (scopeText) {
    items.push(toChecklistItem(`Clarify scope notes: ${scopeText.slice(0, 120)}${scopeText.length > 120 ? '…' : ''}`, 'Ensure all client constraints are captured.'));
  }
  return items;
}

function buildMeasurements(template: TaskTemplate): { measurements: IntakeChecklistItem[]; photos: IntakeChecklistItem[]; tools: IntakeChecklistItem[] } {
  const guide = findMeasurementGuide(template);
  if (!guide) {
    return { measurements: [], photos: [], tools: [] };
  }
  return {
    measurements: guide.measurements.map((entry) => toChecklistItem(entry.item, entry.reason)),
    photos: guide.photos.map((entry) => toChecklistItem(entry.subject, entry.reason)),
    tools: guide.tools.map((tool) => ({ ...toChecklistItem(tool), reason: 'Recommended to bring', required: false })),
  };
}

function buildResearch(template: TaskTemplate, keywords: string[], jurisdiction?: Jurisdiction): IntakeResearchSnippet[] {
  const snippets: IntakeResearchSnippet[] = [];
  const permits = matchPermitRules(keywords, jurisdiction);
  permits.forEach((rule) => {
    const feeText = rule.feeRange ? `$${rule.feeRange.min}-${rule.feeRange.max}` : 'See jurisdiction fee schedule';
    snippets.push({
      id: `permit-${rule.id}`,
      category: 'Permit',
      title: `${rule.type} permit (${rule.jurisdiction})`,
      content: `${rule.description} Fee estimate ${feeText}. ${rule.notes ?? ''}`.trim(),
      jurisdiction: rule.jurisdiction,
      source: 'KnowledgeBase',
      confidence: 0.9,
    });
  });

  const codes = findCodeReferences(template, jurisdiction);
  codes.forEach((ref) => {
    snippets.push({
      id: `code-${ref.id}`,
      category: 'Code',
      title: ref.name,
      content: `${ref.summary}${ref.section ? ` (See ${ref.section})` : ''}`,
      jurisdiction: ref.jurisdiction,
      source: 'KnowledgeBase',
      confidence: 0.85,
    });
  });

  return snippets;
}

export const consultationPrepService = {
  generateChecklist(analysis: ScopeAnalysisResult, jurisdiction?: Jurisdiction): ConsultationChecklist {
    const questions = buildQuestions(analysis.primaryTemplate, analysis.scopeText);
    const measurementSections = buildMeasurements(analysis.primaryTemplate);
    const safetyNotes = detectSafetyNotes(analysis.detectedKeywords).map((note) => ({
      id: `safety-${note.id}`,
      text: note.note,
      severity: note.severity,
      source: 'Safety guide',
    }));
    const research = buildResearch(analysis.primaryTemplate, analysis.detectedKeywords, jurisdiction);

    return {
      id: id('checklist'),
      jobType: analysis.primaryTemplate,
      questions,
      measurements: measurementSections.measurements,
      photos: measurementSections.photos,
      tools: measurementSections.tools,
      safetyNotes,
      research,
      generatedAt: new Date().toISOString(),
    };
  },

  toggleItem(list: IntakeChecklistItem[], itemId: string): IntakeChecklistItem[] {
    return list.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
  },

  removeItem(list: IntakeChecklistItem[], itemId: string): IntakeChecklistItem[] {
    return list.filter((item) => item.id !== itemId);
  },

  addCustomItem(list: IntakeChecklistItem[], text: string, reason?: string): IntakeChecklistItem[] {
    if (!text.trim()) return list;
    return [...list, { ...toChecklistItem(text.trim(), reason), userAdded: true, required: false }];
  },
};
