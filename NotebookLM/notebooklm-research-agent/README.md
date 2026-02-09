# NotebookLM Research Agent Skill

**A comprehensive Antigravity skill for automating NotebookLM research, source management, and content generation via AI agent control.**

## 📋 What's Included

```
notebooklm-research-agent/
├── SKILL.md                          # Main skill documentation (START HERE)
├── ADVANCED.md                       # Advanced patterns & optimization
├── README.md                         # This file
├── scripts/
│   └── quick-research.sh             # Automated research workflow
└── resources/
    ├── WORKFLOW_CHECKLIST.md         # Progress tracking templates
    └── USE_CASES.md                  # 10 detailed real-world examples
```

## 🚀 Quick Start

### 1. Install the Skill
```bash
# Copy the entire folder to your Antigravity skills directory
cp -r notebooklm-research-agent ~/.agent/skills/

# Verify installation
ls ~/.agent/skills/notebooklm-research-agent/SKILL.md
```

### 2. Authenticate NotebookLM
```bash
# In your terminal/CLI:
notebooklm-mcp-auth

# Then tell your AI agent:
# "Call refresh_auth() to load the new tokens"
```

### 3. Use with NotebookLM

**In Claude/NotebookLM interface, use commands like:**
```
"Create a research notebook about quantum computing and generate a quiz"

"Search the web for latest AI breakthroughs and create a report"

"Add these URLs to my notebook and generate a video overview"

"Create study materials in 5 languages from these PDFs"
```

## 📖 Documentation Structure

| File | Purpose | Read When |
|------|---------|-----------|
| **SKILL.md** | Main operations & workflows | First time, reference |
| **ADVANCED.md** | Advanced patterns & optimization | Need efficiency tips |
| **USE_CASES.md** | 10 real-world examples | Looking for inspiration |
| **WORKFLOW_CHECKLIST.md** | Track complex workflows | Executing big projects |
| **quick-research.sh** | Automated research flow | Want hands-off workflow |

## 🎯 Key Capabilities

### Special Feature: Auto-Import Framework
- ✅ **Automatic import of "The Four Pillar Framework for a Self-Running Business"**
- ✅ 5-minute automated setup (no manual browser actions)
- ✅ All framework sources loaded automatically
- ✅ Ready to query & generate content immediately
- ✅ Enable once, works for all future notebooks

### Source Management
- ✅ Add URLs (websites, YouTube)
- ✅ Add Google Drive documents
- ✅ Add pasted text
- ✅ Sync Drive sources with latest content
- ✅ Delete sources permanently

### Research & Discovery
- ✅ Search web for new sources (fast/deep modes)
- ✅ Search Google Drive for documents
- ✅ Poll research progress
- ✅ Import discovered sources

### Content Generation
- ✅ Quizzes (customizable difficulty)
- ✅ Flashcards (easy/medium/hard)
- ✅ Reports (6 formats including custom)
- ✅ Slide Decks (multiple formats)
- ✅ Audio Overviews (multiple formats)
- ✅ Video Overviews (6+ visual styles)
- ✅ Infographics (landscape/portrait/square)
- ✅ Mind Maps (visual organization)
- ✅ Data Tables (structured extraction)

### Notebook Operations
- ✅ Create/rename/delete notebooks
- ✅ Configure chat personality
- ✅ Get AI-generated summaries
- ✅ Query sources for insights
- ✅ List and manage all notebooks

### Languages
Supports: English, Spanish, French, German, Japanese (BCP-47 codes)

## 💡 Common Workflows

### 5-Minute Quick Quiz
```
1. Create notebook
2. Add 2-3 sources
3. Generate quiz
4. Download
```

### 15-Minute Research Report
```
1. Research web (30s search + 5min polling)
2. Import sources
3. Generate report + infographic
4. Download both
```

### 30-Minute Complete Learning Suite
```
1. Create notebook
2. Add all materials
3. Generate: quiz, flashcards, report, slides, audio
4. Download all
```

See **USE_CASES.md** for 10 detailed step-by-step examples.

## ⚠️ Safety Features

All destructive operations require explicit user confirmation:
- `notebook_delete` - Permanently delete notebook
- `source_delete` - Permanently delete source
- `source_sync_drive` - Modify source content
- All content generation - Requires `confirm=True`
- `studio_delete` - Permanently delete artifact

**Pattern:** Agent describes action → Asks for confirmation → Proceeds with `confirm=True`

## 📊 Performance Notes

| Operation | Time | Parallel? |
|-----------|------|-----------|
| Research (fast) | 30-60s | No |
| Research (deep) | 3-5min | No |
| Content Generation | 2-15min | Yes (multiple formats) |
| Polling | 30s intervals | Yes |

**Tip:** Generate multiple formats in parallel for same notebook to save time.

## 🔧 Troubleshooting

### Authentication Fails
```bash
# Re-authenticate
notebooklm-mcp-auth

# Then in agent:
refresh_auth()
```

### Research Task Stalls
- Try different query (more specific)
- Switch modes: fast ↔ deep
- Increase timeout: `research_status(max_wait=600)`

### Content Generation Fails
- Verify notebook has sources: `notebook_get(notebook_id)`
- Check errors: `studio_status(notebook_id)`
- Try different format/language

### Drive Sync Issues
1. Check staleness: `source_list_drive(notebook_id)`
2. Verify Drive doc is accessible
3. Retry sync: `source_sync_drive([...], confirm=True)`

See **ADVANCED.md** error handling section for detailed troubleshooting.

## 📚 Examples

### Example 1: Web Research + Report
```
research_start(query="AI safety", mode="fast")
→ research_status(...)
→ research_import(...)
→ report_create(..., confirm=True)
→ studio_status(...)
```

### Example 2: Multi-Language Study Kit
```
notebook_create(title="Spanish Vocabulary")
notebook_add_url(notebook_id, "https://spanish-course.com")
quiz_create(notebook_id, language="es", confirm=True)
flashcards_create(notebook_id, language="es", confirm=True)
```

### Example 3: Competitor Analysis
```
notebook_create(title="Market Research")
notebook_add_url(notebook_id, "https://competitor1.com")
notebook_add_url(notebook_id, "https://competitor2.com")
notebook_add_drive(notebook_id, "report_id", "Q4 2024 Report", "pdf")
report_create(notebook_id, ..., confirm=True)
```

See **USE_CASES.md** for 10 complete workflows.

## 📋 Workflow Tracking

Use **WORKFLOW_CHECKLIST.md** template to track:
- Research & Discovery workflows
- Content Generation workflows
- Notebook Management workflows
- Troubleshooting steps

Copy the template and check off items as you progress.

## 🔑 Key Concepts

### Task IDs vs Notebook IDs
- **Task ID**: For research/generation tracking (temporary)
- **Notebook ID**: For notebook persistence (permanent)

### Polling
- `max_wait=0`: Single non-blocking poll
- `max_wait=60`: Wait up to 60 seconds
- `compact=True`: Save tokens (default)

### Confirmation Gates
All content generation requires `confirm=True` AFTER user approval.

### Language Support
Use BCP-47 codes: `en`, `es`, `fr`, `de`, `ja`

## 🛠️ Advanced Usage

See **ADVANCED.md** for:
- Multi-step research with validation
- Batch content generation patterns
- Custom report generation
- Multi-language pipelines
- Performance optimization
- Rate limits & quotas
- Cookie management

## 📞 Support

1. **Documentation**: Start with SKILL.md
2. **Examples**: Check USE_CASES.md
3. **Workflow Help**: Use WORKFLOW_CHECKLIST.md
4. **Advanced**: See ADVANCED.md
5. **Automation**: Check scripts/quick-research.sh

## 🎓 Learning Path

1. **Day 1**: Read SKILL.md, run 1-2 simple workflows
2. **Day 2**: Try multi-source notebook + content generation
3. **Day 3**: Explore advanced patterns in ADVANCED.md
4. **Ongoing**: Use WORKFLOW_CHECKLIST.md for tracking

## 📝 Integration Notes

- Works with any Antigravity AI agent
- Returns structured JSON/dict responses
- Handles long-running tasks with polling
- Safety gates prevent accidental operations
- Token-efficient for large responses

## 🎉 Success Metrics

You'll know this skill is working when you can:
- ✅ Create notebooks with multiple source types
- ✅ Search web/Drive for new materials
- ✅ Generate quizzes, reports, and videos
- ✅ Track multi-step workflows
- ✅ Generate content in multiple languages
- ✅ Manage 10+ notebooks simultaneously

---

**Created:** February 8, 2026  
**Version:** 1.0  
**Status:** Production Ready  
**License:** MIT
