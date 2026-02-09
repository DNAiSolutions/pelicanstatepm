# NotebookLM Research Agent - Advanced Guide

## Advanced Patterns

### Multi-Step Research with Validation

```
Workflow: research_start → research_status (validate) → research_import → query sources
```

**Pattern:**
1. Start research with `research_start(query="...", mode="fast")`
2. Store returned `task_id`
3. Poll with `research_status(task_id=..., max_wait=60, compact=False)` to see actual sources
4. Review sources in response BEFORE importing
5. Import specific sources: `research_import(source_indices=[0, 1, 5])`  (not all)
6. Query imported sources: `notebook_query(notebook_id=..., query="synthesize findings")`

### Batch Content Generation

Generate multiple formats from same notebook:

```
notebook_id = "abc-123"

# Generate all learning materials in parallel
quiz_id = quiz_create(notebook_id, question_count=15, confirm=True)
deck_id = slide_deck_create(notebook_id, format="detailed_deck", confirm=True)
audio_id = audio_overview_create(notebook_id, format="deep_dive", confirm=True)

# Monitor all tasks
studio_status(notebook_id)  # Returns all three with URLs when ready
```

### Conditional Source Sync

```
1. source_list_drive(notebook_id)  # Check freshness timestamps
2. If stale (>24 hours old):
   - source_sync_drive(source_ids=[...], confirm=True)
3. notebook_query(notebook_id, query="Any updates from recent changes?")
```

### Custom Report Generation

For specialized use cases:

```
report_create(
  notebook_id="...",
  report_format="Create Your Own",
  custom_prompt="Generate a comprehensive threat analysis with SWOT framework, risk scoring (1-10), and mitigation strategies for each risk.",
  language="en",
  confirm=True
)
```

Max custom_prompt length: 10,000 characters

### Audio Overview with Focus

Generate audio prioritizing specific topics:

```
audio_overview_create(
  notebook_id="...",
  format="deep_dive",
  length="long",
  language="en",
  focus_prompt="Focus on: (1) latest breakthroughs, (2) practical applications, (3) open challenges",
  confirm=True
)
```

### Video Overview with Custom Styling

```
video_overview_create(
  notebook_id="...",
  format="explainer",
  visual_style="kawaii",  # cute/playful
  language="ja",  # Japanese
  confirm=True
)

# Visual styles: auto_select, classic, whiteboard, kawaii, anime, watercolor, retro_print, heritage, paper_craft
```

### Multi-Language Content Pipeline

```
notebook_id = "research-2025"

for lang in ["en", "es", "fr", "de", "ja"]:
  report_create(
    notebook_id,
    report_format="Study Guide",
    language=lang,
    confirm=True
  )
  # Generate in all 5 languages
```

### Chat Configuration for Different Use Cases

**Learning Goal:**
```
chat_configure(
  notebook_id,
  goal="learning_guide",
  response_length="longer"
)
```

**Custom Research Focus:**
```
chat_configure(
  notebook_id,
  goal="custom",
  custom_prompt="You are a critical analysis expert. Always provide: (1) strengths, (2) limitations, (3) alternative viewpoints.",
  response_length="default"
)
```

## Error Handling Patterns

### Research Task Timeout

```
status = research_status(task_id=..., max_wait=300)
if status["status"] != "completed":
  # Timeout - try again with different query or mode
  print("Research still processing. Try again in 30 seconds.")
else:
  # Import sources
  research_import(task_id=..., source_indices="all")
```

### Studio Generation Failure Recovery

```
studio_status(notebook_id)
# Check for error_message in response
# Common issues:
# - No sources in notebook
# - Unsupported language/format combination
# - Content too short for generation
```

### Source Sync Issues

```
# Identify stale Drive sources
sources = source_list_drive(notebook_id)
stale = [s for s in sources if days_old(s["last_sync"]) > 7]

# Sync with error handling
for source_id in stale:
  sync_result = source_sync_drive([source_id], confirm=True)
  if sync_result["error"]:
    print(f"Sync failed for {source_id}: {sync_result['error']}")
```

## Performance Optimization

### Token Efficiency

- Use `research_status(compact=True)` [DEFAULT] to save tokens in long responses
- Use `source_get_content()` instead of `notebook_query` for raw text extraction
- Use `source_describe()` for keyword summaries instead of full AI processing
- Batch multiple operations into single workflow

### Request Timeout Tuning

```
# For long queries on large notebooks:
notebook_query(
  notebook_id="...",
  query="comprehensive analysis...",
  timeout=180  # 3 minutes instead of 2 minutes default
)

# For research tasks that may take longer:
research_status(
  task_id="...",
  max_wait=600,  # Wait up to 10 minutes
  poll_interval=45  # Check every 45 seconds
)
```

### Batch Operations

```
# Instead of 10 separate calls:
sources = [url1, url2, url3, ...]
notebook_id = notebook_create()

# Add all sources in sequence (parallel not supported by API)
for url in sources:
  notebook_add_url(notebook_id, url)
```

## Integration with External Systems

### Export Generated Content

```
1. Generate content: audio_overview_create(..., confirm=True)
2. Check status: studio_status(notebook_id)
3. Extract URL: artifact["url"]
4. Download/embed in external system
```

### Sync Research Findings

```
# Discover sources via research
research_start(query="market trends 2025", mode="deep")
→ Get sources
→ research_import(...)
→ notebook_query("Extract key statistics and metrics")
→ Export via studio_status for sharing
```

### Automated Learning Pipeline

```
Create Notebook → Add Sources → Generate Quiz → Generate Flashcards → Track Progress
```

## Rate Limits & Quotas

- Research tasks: Limited by NotebookLM service (typically 3-5 concurrent)
- Content generation: One per notebook per 30 seconds (estimated)
- Polling: Safe to poll every 30 seconds with `poll_interval=30`
- Source operations: No explicit limits; batch friendly

## Cookie & Token Management

### Automatic (Recommended)
```
# Terminal/Bash:
notebooklm-mcp-auth
# Then in agent:
refresh_auth()
```

### Manual (Fallback)
1. Open NotebookLM in Chrome
2. Open DevTools: F12 → Network tab
3. Make any request to notebook
4. Copy cookie header from request
5. Call: `save_auth_tokens(cookies="...")`

### Token Expiration
- Tokens valid ~24 hours
- Expired tokens: `refresh_auth()` attempts auto-reauth
- If fails: Run `notebooklm-mcp-auth` again
