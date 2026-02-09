# NotebookLM Research Agent Skill - Complete Index

## 📚 Documentation Map

Start here based on your needs:

### 🎯 First Time Users
1. **README.md** - Installation & overview (5 min read)
2. **SKILL.md** - Main documentation with all operations (15 min read)
3. **USE_CASES.md** - Pick a workflow that matches your need (5 min)

### 🚀 Ready to Implement
- **SKILL.md** - Reference for specific operations
- **USE_CASES.md** - Copy step-by-step examples
- **WORKFLOW_CHECKLIST.md** - Track your progress

### 🔧 Advanced Usage
- **ADVANCED.md** - Patterns, optimization, troubleshooting
- **scripts/quick-research.sh** - Automated workflows

### 📋 Specific Needs
| Need | Read | Time |
|------|------|------|
| Understand what skill does | README.md | 5 min |
| See all 32 operations | SKILL.md | 15 min |
| Find example workflow | USE_CASES.md | 5 min |
| Setup framework auto-import | AUTO_IMPORT_GUIDE.md | 5 min |
| Track complex project | WORKFLOW_CHECKLIST.md | varies |
| Optimize performance | ADVANCED.md | 10 min |
| Fix a problem | ADVANCED.md | 5-10 min |
| Run hands-off research | scripts/quick-research.sh | setup |
| Auto-import Four Pillars | scripts/auto-import-framework.sh | 5 min |
| Troubleshoot issues | ADVANCED.md or SKILL.md | 5-10 min |

---

## 📁 File Contents Summary

### SKILL.md (MAIN - Start here!)
**Purpose:** Complete reference for all 32 NotebookLM operations

**Sections:**
- When to use this skill (7 triggers)
- Quick Start Workflow (6-step diagram)
- Core Operations (30+ detailed operations):
  - Authentication (2 ops)
  - Notebook Management (6 ops)
  - Source Management (7 ops)
  - Querying & Research (5 ops)
  - Content Generation (9 ops)
  - Status & Retrieval (2 ops)
- Complete Workflow Examples (3 detailed examples)
- Safety & Best Practices
- Troubleshooting Guide

**When to use:** Reference during implementation, look up specific operations

**Length:** ~500 lines (perfect for quick scanning)

---

### README.md
**Purpose:** Installation, overview, and quick reference

**Sections:**
- What's Included (folder structure)
- Quick Start (3 steps to get running)
- Documentation Structure (what to read when)
- Key Capabilities (organized by category)
- Common Workflows (5 quick summaries)
- Safety Features (confirmation gates)
- Performance Notes
- Troubleshooting
- Examples
- Integration Notes
- Success Metrics

**When to use:** First time setup, orientation, quick reminder of capabilities

**Length:** ~300 lines

---

### ADVANCED.md
**Purpose:** Advanced patterns, optimization, and edge cases

**Sections:**
- Advanced Patterns (6 complex workflows)
- Error Handling Patterns (recovery strategies)
- Performance Optimization (token efficiency, timeouts)
- Integration with External Systems (3 patterns)
- Rate Limits & Quotas
- Cookie & Token Management (detailed)

**When to use:** After basic usage, when you need efficiency or troubleshooting

**Length:** ~350 lines

---

### USE_CASES.md
**Purpose:** 10 real-world step-by-step workflows with timing

**Workflows Included:**
1. Quick Learning Material from Web Articles (3 min)
2. Deep Research Report with Multiple Sources (10-15 min)
3. Educational Content for Multiple Languages (15-20 min)
4. Podcast/Video Series Preparation (8-12 min)
5. Competitive Intelligence Report (12-15 min)
6. Data Extraction & Table Generation (6-10 min)
7. Mind Map for Project Planning (5-8 min)
8. Video Tutorial Generation (10-15 min)
9. Continuous Drive Source Updates (5 min weekly)
10. Multi-Format Content Suite for Course (15-20 min)

**Bonus:** Quick Reference table with operation time estimates

**When to use:** Find a workflow that matches your use case, then copy the steps

**Length:** ~400 lines

---

### WORKFLOW_CHECKLIST.md
**Purpose:** Progress tracking templates for complex projects

**Checklists Included:**
- Research & Discovery Workflow ✓
- Content Generation Workflow ✓
- Notebook Management Workflow ✓
- Multi-Format Generation Workflow ✓
- Troubleshooting Checklist ✓
- Session Notes Template ✓

**When to use:** Executing multi-step workflows, tracking progress, saving state

**Length:** ~300 lines (editable templates)

---

### scripts/quick-research.sh
**Purpose:** Automated research workflow (bash script)

**What it does:**
1. Start research (configurable query, source, mode)
2. Poll for completion (with progress display)
3. Import sources automatically
4. Provide next step suggestions

**Usage:**
```bash
./quick-research.sh "quantum computing" web fast
```

**When to use:** Hands-off research workflow without manual polling

**Length:** ~80 lines (executable bash)

---

## 🎯 Operation Categories

### By Frequency of Use (Common to Advanced)

**Most Common (Use Daily):**
- notebook_create
- notebook_add_url
- research_start
- notebook_query
- quiz_create / flashcards_create

**Moderate Use (Weekly):**
- notebook_list
- research_import
- report_create
- slide_deck_create
- studio_status

**Advanced Use (Monthly/As Needed):**
- notebook_describe
- source_sync_drive
- audio_overview_create
- video_overview_create
- chat_configure

**Rare/Destructive (Use with Caution):**
- notebook_delete
- source_delete
- studio_delete
- source_sync_drive

### By Time to Complete

**< 1 minute:**
- notebook_create
- notebook_add_url / text
- refresh_auth

**1-5 minutes:**
- quiz_create
- flashcards_create
- infographic_create
- mind_map_create

**5-10 minutes:**
- report_create
- slide_deck_create
- audio_overview_create
- research_start (fast)

**10+ minutes:**
- video_overview_create
- research_start (deep)
- studio_status (waiting for generation)

---

## 🔄 Quick Navigation

### I want to...

**Create a research notebook**
→ SKILL.md → notebook_create

**Find sources about a topic**
→ SKILL.md → research_start → research_status → research_import

**Ask questions about my sources**
→ SKILL.md → notebook_query

**Make a quiz**
→ SKILL.md → quiz_create

**Make a presentation**
→ SKILL.md → slide_deck_create

**Make a video**
→ SKILL.md → video_overview_create

**Make a report**
→ SKILL.md → report_create

**Generate multiple formats**
→ USE_CASES.md → Use Case 10 (Complete Course Suite)

**Track a complex workflow**
→ WORKFLOW_CHECKLIST.md

**Optimize performance**
→ ADVANCED.md → Performance Optimization

**Fix a problem**
→ ADVANCED.md → Error Handling Patterns

**Automate research**
→ scripts/quick-research.sh

**See real examples**
→ USE_CASES.md (10 detailed workflows)

---

## 📊 Documentation Statistics

| Aspect | Count |
|--------|-------|
| Total Files | 6 |
| Total Documentation Lines | ~2,000 |
| Operations Documented | 32 |
| Use Cases with Walkthroughs | 10 |
| Workflow Checklists | 6 |
| Languages Supported | 5 |
| Content Formats | 9 |
| Troubleshooting Sections | 5+ |
| Code Examples | 30+ |

---

## 🚀 Recommended Reading Order

### First-Time Setup (30 minutes total)
1. README.md (5 min) - Understand what this skill does
2. SKILL.md "When to use" section (2 min) - See triggers
3. SKILL.md "Quick Start Workflow" (3 min) - Overview
4. SKILL.md one complete operation example (5 min)
5. Pick one Use Case from USE_CASES.md (10 min)

### Daily Usage
1. SKILL.md - Quick reference for specific operations
2. WORKFLOW_CHECKLIST.md - Track progress
3. USE_CASES.md - Copy workflows as needed

### When Stuck
1. ADVANCED.md - Troubleshooting section
2. SKILL.md - "Safety & Best Practices"
3. USE_CASES.md - Find similar workflow

### Performance Tuning
1. ADVANCED.md - "Performance Optimization"
2. ADVANCED.md - "Rate Limits & Quotas"

---

## 💾 File Locations

```
~/.agent/skills/notebooklm-research-agent/

Main Documentation:
  • SKILL.md          [Reference for all 32 operations]
  • README.md         [Installation & overview]
  • ADVANCED.md       [Patterns & optimization]
  • INDEX.md          [This file - documentation map]

Resources:
  • resources/USE_CASES.md              [10 real-world workflows]
  • resources/WORKFLOW_CHECKLIST.md     [Progress tracking]

Scripts:
  • scripts/quick-research.sh           [Automated research]
```

---

## 🎓 Learning Path

**Week 1: Basics**
- [ ] Read README.md
- [ ] Read SKILL.md main sections
- [ ] Create your first notebook
- [ ] Add a URL source
- [ ] Generate a quiz

**Week 2: Exploration**
- [ ] Try USE_CASE 1 (Quick Learning)
- [ ] Try USE_CASE 2 (Research Report)
- [ ] Experiment with different content formats
- [ ] Use WORKFLOW_CHECKLIST.md to track a project

**Week 3: Advanced**
- [ ] Read ADVANCED.md
- [ ] Try multi-format generation (USE_CASE 10)
- [ ] Experiment with research modes
- [ ] Try scripts/quick-research.sh

**Ongoing: Mastery**
- [ ] Use for regular projects
- [ ] Reference specific operations as needed
- [ ] Explore edge cases in ADVANCED.md
- [ ] Share workflows with team

---

## 🆘 Quick Troubleshooting

| Problem | Solution | Read |
|---------|----------|------|
| Don't know what to do | Read README.md + USE_CASES.md | README, USE_CASES |
| Need specific operation | Search SKILL.md or ADVANCED.md | SKILL |
| Something failed | Check ADVANCED.md error handling | ADVANCED |
| Want to optimize | Check ADVANCED.md performance section | ADVANCED |
| Tracking complex work | Use WORKFLOW_CHECKLIST.md | CHECKLIST |

---

## ✅ You're Ready When...

You've successfully used this skill when you can:
1. ✅ Create a notebook with multiple source types
2. ✅ Search web or Drive for new materials
3. ✅ Generate at least 3 different content formats
4. ✅ Track a multi-step workflow with checklist
5. ✅ Troubleshoot a failed operation
6. ✅ Know which operation to use for any task

---

**Skill Version:** 1.0  
**Created:** February 8, 2026  
**Last Updated:** February 8, 2026  
**Status:** Production Ready ✅

**Next Step:** Open README.md or SKILL.md and start building! 🚀
