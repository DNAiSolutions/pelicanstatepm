---
name: notebooklm-research-agent
description: Automates NotebookLM notebook and source management, research discovery, and content generation. Use when the user needs to create research notebooks, add sources (URLs, PDFs, Drive docs, text), query sources for insights, generate audio/video overviews, reports, slide decks, quizzes, flashcards, infographics, mind maps, or data tables from source material.
---

# NotebookLM Research Agent Skill

## When to use this skill

- User wants to create a new research notebook or manage existing notebooks
- User needs to add sources (websites, YouTube videos, PDFs, Google Drive documents, or pasted text)
- User wants to search the web or Google Drive for new source material (deep or fast research)
- User needs to query existing sources for AI-generated insights and summaries
- User wants to generate learning materials (audio overviews, video overviews, reports, slide decks, quizzes, flashcards, infographics, mind maps, or data tables)
- User needs to manage authentication tokens or refresh credentials
- User wants to sync Google Drive sources with latest content or delete sources
- User needs to check status of research tasks or content generation
- User wants to auto-import "The Four Pillar Framework for a Self-Running Business" notebook template after creation

## Quick Start Workflow

```
1. Authenticate
   └─ Run: refresh_auth or save_auth_tokens

2. Create or Get Notebook
   └─ notebook_create (new) OR notebook_list (existing)

3. Add Sources
   ├─ notebook_add_url (websites, YouTube)
   ├─ notebook_add_text (pasted content)
   ├─ notebook_add_drive (Google Drive docs)
   └─ research_start (search web/Drive for new sources)

4. Query & Summarize
   ├─ notebook_query (ask questions about sources)
   ├─ source_describe (get AI summary of individual source)
   └─ notebook_describe (get AI summary of entire notebook)

5. Generate Content
   ├─ audio_overview_create
   ├─ video_overview_create
   ├─ slide_deck_create
   ├─ report_create
   ├─ quiz_create
   ├─ flashcards_create
   ├─ infographic_create
   ├─ mind_map_create
   └─ data_table_create

6. Monitor & Retrieve
   ├─ studio_status (check generation progress)
   └─ research_status (check research task progress)
```

## 🤖 Auto-Import Template: "The Four Pillar Framework"

**Special Automation for Self-Running Business Framework**

When creating a new notebook, you can automatically import "The Four Pillar Framework for a Self-Running Business" template without manual intervention.

**How It Works:**
1. Create notebook → Agent waits 5 minutes
2. Notebook processes in browser background
3. Framework auto-imports all sources
4. Zero manual action required after creation

**Usage:**
```
# Simple trigger - auto-imports the framework
notebook_create(title="My Business Analysis")

# After 5 minutes:
# - Framework sources automatically imported
# - All content ready to query
# - No browser action needed
```

**What Gets Imported:**
- The Four Pillar Framework documentation
- All source materials
- Complete framework structure
- Ready for immediate querying

**Configuration:**
- Auto-import delay: 5 minutes (300 seconds)
- Target notebook: "The Four Pillar Framework for a Self-Running Business"
- Trigger: Any new notebook creation
- Status: Fully automated

**Next Steps After Import:**
```
# Query the framework
notebook_query(notebook_id="...", query="What are the four pillars?")

# Generate learning materials
quiz_create(notebook_id="...", confirm=True)
slide_deck_create(notebook_id="...", confirm=True)

# Or create custom content
report_create(notebook_id="...", report_format="Study Guide", confirm=True)
```

## Core Operations

### Authentication & Setup

**refresh_auth**
- Reload auth tokens from disk or attempt headless re-authentication
- Call after running `notebooklm-mcp-auth` to pick up new tokens
- Returns: status indicating successful token refresh

**save_auth_tokens** (fallback only)
- Use only if automated CLI (`notebooklm-mcp-auth`) fails
- Extract cookies/CSRF from Chrome DevTools
- Provide: `cookies`, `csrf_token`, or raw `request_body` / `request_url`

### Notebook Management

**notebook_list**
- List all notebooks
- Args: `max_results` (default: 100)
- Returns: Notebook UUIDs and metadata

**notebook_create**
- Create new notebook
- Args: `title` (optional)
- Returns: Notebook UUID

**notebook_get**
- Get notebook details with all sources
- Args: `notebook_id` (UUID)
- Returns: Notebook metadata, source list with types

**notebook_rename**
- Rename existing notebook
- Args: `notebook_id`, `new_title`
- Returns: Updated notebook

**notebook_delete** ⚠️
- Delete notebook permanently (IRREVERSIBLE)
- Requires: `confirm=True` (after user approval)
- Args: `notebook_id`, `confirm`

**chat_configure**
- Configure notebook chat settings (AI personality)
- Args: `notebook_id`, `goal` (default|learning_guide|custom), `custom_prompt` (max 10,000 chars), `response_length` (default|longer|shorter)
- Returns: Updated configuration

### Source Management

**notebook_add_url**
- Add website or YouTube video as source
- Args: `notebook_id`, `url`
- Returns: Source ID

**notebook_add_text**
- Add pasted text as source
- Args: `notebook_id`, `text`, `title` (optional)
- Returns: Source ID

**notebook_add_drive**
- Add Google Drive document as source
- Args: `notebook_id`, `document_id`, `title`, `doc_type` (doc|slides|sheets|pdf)
- Returns: Source ID

**source_get_content**
- Get raw text content of source (NO AI processing)
- Fast method for content export
- Args: `source_id`
- Returns: `content` (str), `title`, `source_type`, `char_count`

**source_describe**
- Get AI-generated summary with keyword chips
- Args: `source_id`
- Returns: `summary` (markdown with **bold** keywords), `keywords` list

**source_list_drive**
- List sources with types and Drive freshness status
- Use BEFORE sync to identify stale sources
- Args: `notebook_id`
- Returns: Source list with sync timestamps

**source_sync_drive** ⚠️
- Sync Drive sources with latest content
- Requires: `confirm=True` (after user approval)
- Args: `source_ids` (array), `confirm`
- Returns: Sync status for each source

**source_delete** ⚠️
- Delete source permanently (IRREVERSIBLE)
- Requires: `confirm=True` (after user approval)
- Args: `source_id`, `confirm`

### Querying & Research

**notebook_query**
- Ask AI about existing sources (already in notebook)
- Use this for insights, analysis, summaries
- Do NOT use for finding new sources (use research_start instead)
- Args: `notebook_id`, `query`, `source_ids` (optional - default: all), `conversation_id` (for follow-ups), `timeout` (seconds, default: 120)
- Returns: AI response with source citations

**notebook_describe**
- Get AI-generated notebook summary with suggested topics
- Args: `notebook_id`
- Returns: `summary` (markdown), `suggested_topics` list

**research_start**
- Deep research or fast research: Search web or Google Drive for NEW sources
- Use for: "deep research on X", "find sources about Y", "search web for Z"
- Workflow: research_start → poll research_status → research_import
- Args: `query`, `source` (web|drive), `mode` (fast ~30s ~10 sources | deep ~5min ~40 sources web only), `notebook_id` (optional - creates new if not provided), `title` (optional)
- Returns: `task_id`, initial status

**research_status**
- Poll research progress; blocks until complete or timeout
- Args: `notebook_id`, `poll_interval` (default: 30s), `max_wait` (default: 300s, 0=single poll), `compact` (default: True - saves tokens), `task_id` (optional)
- Returns: `status`, `sources_found`, `source_list` (truncated if compact=True)

**research_import**
- Import discovered sources into notebook
- Call AFTER research_status shows status="completed"
- Args: `notebook_id`, `task_id`, `source_indices` (default: all)
- Returns: Imported source IDs

### Content Generation

All generation functions require `confirm=True` after user approval (safety gate).

**audio_overview_create** 🎙️
- Generate audio overview of notebook sources
- Args: `notebook_id`, `source_ids` (default: all), `format` (deep_dive|brief|critique|debate), `length` (short|default|long), `language` (BCP-47 code: en, es, fr, de, ja), `focus_prompt` (optional), `confirm`
- Returns: Generation task ID

**video_overview_create** 🎬
- Generate video overview of notebook sources
- Args: `notebook_id`, `source_ids` (default: all), `format` (explainer|brief), `visual_style` (auto_select|classic|whiteboard|kawaii|anime|watercolor|retro_print|heritage|paper_craft), `language` (BCP-47), `focus_prompt` (optional), `confirm`
- Returns: Generation task ID

**slide_deck_create** 📊
- Generate presentation slide deck
- Args: `notebook_id`, `source_ids` (default: all), `format` (detailed_deck|presenter_slides), `length` (short|default), `language` (BCP-47), `focus_prompt` (optional), `confirm`
- Returns: Generation task ID

**report_create** 📄
- Generate structured report
- Args: `notebook_id`, `source_ids` (default: all), `report_format` ("Briefing Doc"|"Study Guide"|"Blog Post"|"Create Your Own"), `custom_prompt` (required if "Create Your Own"), `language` (BCP-47), `confirm`
- Returns: Generation task ID

**quiz_create** ❓
- Generate quiz with configurable difficulty
- Args: `notebook_id`, `source_ids` (default: all), `question_count` (default: 2), `difficulty` (easy|medium|hard), `confirm`
- Returns: Generation task ID

**flashcards_create** 🎯
- Generate flashcards with difficulty levels
- Args: `notebook_id`, `source_ids` (default: all), `difficulty` (easy|medium|hard), `confirm`
- Returns: Generation task ID

**infographic_create** 🎨
- Generate visual infographic
- Args: `notebook_id`, `source_ids` (default: all), `orientation` (landscape|portrait|square), `detail_level` (concise|standard|detailed), `language` (BCP-47), `focus_prompt` (optional), `confirm`
- Returns: Generation task ID

**mind_map_create** 🧠
- Generate mind map visualization
- Args: `notebook_id`, `source_ids` (default: all), `title`, `confirm`
- Returns: Generation task ID

**data_table_create** 📋
- Generate structured data table
- Args: `notebook_id`, `description` (what data to extract), `source_ids` (default: all), `language` (default: en), `confirm`
- Returns: Generation task ID

### Status & Retrieval

**studio_status**
- Check studio content generation status and get download URLs
- Args: `notebook_id`
- Returns: Artifact list with `status`, `type`, `url`, `created_at`

**studio_delete** ⚠️
- Delete studio artifact permanently (IRREVERSIBLE)
- Requires: `confirm=True` (after user approval)
- Args: `notebook_id`, `artifact_id`, `confirm`

## Complete Workflow Examples

### Example 1: Quick Research Report
```
1. research_start(query="quantum computing advances", source="web", mode="fast")
2. research_status(notebook_id=..., max_wait=60)  # Wait ~30-60s
3. research_import(notebook_id=..., task_id=..., source_indices="all")
4. report_create(notebook_id=..., report_format="Study Guide", confirm=True)
5. studio_status(notebook_id=...)  # Get download URL
```

### Example 2: Learning Material from Existing Sources
```
1. notebook_get(notebook_id=...)  # Verify sources
2. notebook_query(notebook_id=..., query="Key concepts and takeaways")
3. quiz_create(notebook_id=..., question_count=10, difficulty="medium", confirm=True)
4. flashcards_create(notebook_id=..., difficulty="medium", confirm=True)
5. studio_status(notebook_id=...)  # Monitor generation
```

### Example 3: Multi-Source Notebook Creation
```
1. notebook_create(title="AI Safety Research 2025")
2. notebook_add_url(notebook_id=..., url="https://arxiv.org/...")
3. notebook_add_url(notebook_id=..., url="https://youtu.be/...")
4. notebook_add_drive(notebook_id=..., document_id="1234...", doc_type="pdf")
5. notebook_add_text(notebook_id=..., text="Custom notes...", title="Key Takeaways")
6. notebook_describe(notebook_id=...)  # Get AI summary
7. audio_overview_create(notebook_id=..., format="deep_dive", confirm=True)
```

## Safety & Best Practices

### Confirmation Gates ⚠️
These operations require `confirm=True` ONLY after explicit user approval:
- `notebook_delete` (IRREVERSIBLE)
- `source_delete` (IRREVERSIBLE)
- `source_sync_drive` (modifies content)
- `audio_overview_create` (generates content)
- `video_overview_create` (generates content)
- `slide_deck_create` (generates content)
- `report_create` (generates content)
- `quiz_create` (generates content)
- `flashcards_create` (generates content)
- `infographic_create` (generates content)
- `mind_map_create` (generates content)
- `data_table_create` (generates content)
- `studio_delete` (IRREVERSIBLE)

**Pattern:**
1. Describe what will happen
2. Ask user: "Should I proceed?"
3. Wait for confirmation
4. Call with `confirm=True`

### Research Task Polling
- `research_start` returns immediately with `task_id`
- Use `research_status(task_id=...)` to poll progress
- Fast mode: ~30 seconds, ~10 sources
- Deep mode: ~5 minutes, ~40 sources (web only)
- Set `max_wait=0` for single poll without blocking

### Source Content Retrieval
- Use `source_get_content` for fast raw text export (no AI processing)
- Use `source_describe` for AI-generated summaries with keywords
- Use `notebook_query` for asking questions about sources

### Language Support
Most content generation supports: `en` (English), `es` (Spanish), `fr` (French), `de` (German), `ja` (Japanese)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" or auth fails | Run `notebooklm-mcp-auth` in Bash, then call `refresh_auth()` |
| Research task stalls | Call `research_status(max_wait=0)` for single poll without blocking; try different query |
| Content generation fails | Verify notebook has sources; check `studio_status()` for error details |
| Drive sync outdated | Call `source_list_drive()` first to identify stale sources, then `source_sync_drive()` |
| Token extraction needed | Extract from Chrome DevTools Network tab; use `save_auth_tokens()` as fallback |

## Automated Template Import Configuration

**For "The Four Pillar Framework for a Self-Running Business"**

The following automation is configured to run automatically:

```yaml
auto_import_template:
  name: "The Four Pillar Framework for a Self-Running Business"
  enabled: true
  trigger: "notebook_create()"
  delay_seconds: 300  # 5 minutes
  action: "Auto-import all framework sources"
  browser_action: "Automatic - no manual intervention needed"
  status: "All sources imported"
  next_steps: "Ready for query/content generation"
```

**How the Automation Works:**

1. **Create notebook** → `notebook_create(title="...")`
2. **Wait period** → 5 minutes (framework processes in background)
3. **Auto-import triggers** → All "Four Pillar Framework" sources imported
4. **Ready to use** → No manual browser action needed

**After Automation Completes:**
- Framework sources fully loaded
- All content indexed and queryable
- Ready for `notebook_query()`, content generation, etc.

**Configuration Details:**
- Template: "The Four Pillar Framework for a Self-Running Business"
- Import method: Automatic via browser extension
- Timing: 5-minute delay after notebook creation
- Result: All sources imported, notebook ready
- User action required: NONE

## Integration Notes

- All operations return structured data (UUIDs, metadata, URLs, status)
- Notebook UUIDs are persistent across sessions
- Source IDs are immutable; use for all source-specific operations
- Language codes follow BCP-47 standard (e.g., "en-US", "es-ES")
- Timeout defaults can be overridden (e.g., research_status with `max_wait=600` for longer research)
- Studio artifacts are automatically managed; `studio_status()` provides URLs for download/sharing
- **Auto-import for "Four Pillar Framework" is enabled by default** - no configuration needed
