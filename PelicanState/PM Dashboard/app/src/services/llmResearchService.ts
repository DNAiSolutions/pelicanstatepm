import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { IntakeResearchSnippet } from '../data/pipeline';
import type { Jurisdiction } from './louisianaKnowledgeBase';

type ResearchQuery = {
  scope: string;
  jobType: string;
  jurisdiction: Jurisdiction;
};

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const openaiClient = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
const anthropicClient = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

const PROMPT_TEMPLATE = `You are a Louisiana construction compliance expert. Given the following project details, respond with strict JSON.

Fields:
- permits: array of { "type": string, "required": boolean, "description": string, "feeEstimate": string }
- codeReferences: array of { "code": string, "section": string, "relevance": string }
- keyConsiderations: array of strings

Always reference Louisiana, New Orleans, or Baton Rouge regulations as appropriate. If uncertain, note "verification required" in the description.
`;

type CachedResearch = { snippets: IntakeResearchSnippet[]; timestamp: number };
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache = new Map<string, CachedResearch>();

function buildCacheKey(query: ResearchQuery) {
  return `${query.jobType}-${query.jurisdiction}-${query.scope.toLowerCase().slice(0, 120)}`;
}

function parseLLMJson(responseText: string) {
  try {
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const payload = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
    return payload as {
      permits?: { type: string; required: boolean; description: string; feeEstimate?: string }[];
      codeReferences?: { code: string; section?: string; relevance: string }[];
      keyConsiderations?: string[];
    };
  } catch (error) {
    console.warn('Failed to parse LLM response', error);
    return null;
  }
}

function toSnippets(payload: NonNullable<ReturnType<typeof parseLLMJson>>, jurisdiction: Jurisdiction): IntakeResearchSnippet[] {
  const snippets: IntakeResearchSnippet[] = [];
  payload.permits?.forEach((permit, idx) => {
    snippets.push({
      id: `llm-permit-${idx}`,
      category: 'Permit',
      title: `${permit.type} (${jurisdiction})`,
      content: `${permit.description}${permit.feeEstimate ? ` Fee: ${permit.feeEstimate}` : ''}${permit.required ? '' : ' (verification required)'}`,
      jurisdiction,
      source: 'LLM',
      confidence: 0.7,
    });
  });
  payload.codeReferences?.forEach((ref, idx) => {
    snippets.push({
      id: `llm-code-${idx}`,
      category: 'Code',
      title: `${ref.code}${ref.section ? ` ${ref.section}` : ''}`,
      content: ref.relevance,
      jurisdiction,
      source: 'LLM',
      confidence: 0.65,
    });
  });
  payload.keyConsiderations?.forEach((item, idx) => {
    snippets.push({
      id: `llm-consideration-${idx}`,
      category: 'Material',
      title: 'Field Consideration',
      content: item,
      jurisdiction,
      source: 'LLM',
      confidence: 0.6,
    });
  });
  return snippets;
}

async function callOpenAI(query: ResearchQuery) {
  if (!openaiClient) return null;
  try {
    const response = await openaiClient.responses.create({
      model: 'gpt-4o-mini',
      input: `${PROMPT_TEMPLATE}\nJurisdiction: ${query.jurisdiction}\nJob Type: ${query.jobType}\nScope: ${query.scope}`,
      temperature: 0.2,
    });
    const textOutput = response.output?.map((chunk) => ('content' in chunk ? chunk.content?.map((item) => ('text' in item ? item.text : '')).join('\n') : '')).join('\n');
    if (!textOutput) return null;
    const parsed = parseLLMJson(textOutput);
    return parsed ? toSnippets(parsed, query.jurisdiction) : null;
  } catch (error) {
    console.warn('OpenAI research failed', error);
    return null;
  }
}

async function callAnthropic(query: ResearchQuery) {
  if (!anthropicClient) return null;
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: `${PROMPT_TEMPLATE}\nJurisdiction: ${query.jurisdiction}\nJob Type: ${query.jobType}\nScope: ${query.scope}`,
        },
      ],
    });
    const text = response.content?.map((block) => ('text' in block ? block.text : '')).join('\n');
    if (!text) return null;
    const parsed = parseLLMJson(text);
    return parsed ? toSnippets(parsed, query.jurisdiction) : null;
  } catch (error) {
    console.warn('Anthropic research failed', error);
    return null;
  }
}

export const llmResearchService = {
  async getResearchSnippets(query: ResearchQuery): Promise<IntakeResearchSnippet[]> {
    if (!query.scope) return [];
    const cacheKey = buildCacheKey(query);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.snippets;
    }

    let snippets: IntakeResearchSnippet[] | null = null;
    snippets = await callOpenAI(query);
    if (!snippets || snippets.length === 0) {
      snippets = await callAnthropic(query);
    }

    if (!snippets) {
      return [];
    }

    cache.set(cacheKey, { snippets, timestamp: Date.now() });
    return snippets;
  },
};
