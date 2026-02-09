# NotebookLM Research Agent - Workflow Checklist

Use this checklist to track complex research and content generation workflows.

## Research & Discovery Workflow

- [ ] **Authenticate**
  - [ ] Run `refresh_auth()` or `notebooklm-mcp-auth`
  - [ ] Verify authentication successful

- [ ] **Define Research Parameters**
  - [ ] Query: `_________________________`
  - [ ] Source (web/drive): `_________________________`
  - [ ] Mode (fast/deep): `_________________________`
  - [ ] Approximate time budget: `_________________________`

- [ ] **Start Research**
  - [ ] Call `research_start(query, source, mode)`
  - [ ] Record Task ID: `_________________________`
  - [ ] Record Notebook ID: `_________________________`

- [ ] **Monitor Progress**
  - [ ] Poll with `research_status(task_id)`
  - [ ] Check sources found count
  - [ ] Review source list when complete
  - [ ] Wait time: `_________` minutes

- [ ] **Validate & Import**
  - [ ] Review source list with `research_status(compact=False)`
  - [ ] Mark sources to import: `_________________________`
  - [ ] Call `research_import(source_indices=[...])`
  - [ ] Record imported source count: `_________________________`

- [ ] **Initial Query** (optional)
  - [ ] Ask notebook: "Key findings summary?"
  - [ ] Record insights: `_________________________`

---

## Content Generation Workflow

- [ ] **Prepare Notebook**
  - [ ] Notebook ID: `_________________________`
  - [ ] Sources included: `_________________________`
  - [ ] Total sources: `_________________________`

- [ ] **Select Content Type**
  - [ ] [ ] Quiz
  - [ ] [ ] Flashcards
  - [ ] [ ] Report
  - [ ] [ ] Slide Deck
  - [ ] [ ] Audio Overview
  - [ ] [ ] Video Overview
  - [ ] [ ] Infographic
  - [ ] [ ] Mind Map
  - [ ] [ ] Data Table

- [ ] **Configure Generation** (if applicable)
  - [ ] Language: `_________________________`
  - [ ] Difficulty/Length: `_________________________`
  - [ ] Format/Style: `_________________________`
  - [ ] Custom prompt: `_________________________`

- [ ] **Get User Approval**
  - [ ] [ ] User confirmed content generation
  - [ ] [ ] Describe what will be generated
  - [ ] [ ] Estimated generation time: `_________` minutes

- [ ] **Generate Content**
  - [ ] Call generation function with `confirm=True`
  - [ ] Record Generation ID: `_________________________`
  - [ ] Note generation time: `_________` seconds

- [ ] **Monitor Generation**
  - [ ] Poll with `studio_status(notebook_id)`
  - [ ] Check status: `_________________________`
  - [ ] Wait for completion

- [ ] **Retrieve & Share**
  - [ ] Get download URL from `studio_status()`
  - [ ] URL: `_________________________`
  - [ ] Share with user or export

---

## Notebook Management Workflow

- [ ] **Create Notebook**
  - [ ] Title: `_________________________`
  - [ ] Call `notebook_create(title)`
  - [ ] Record Notebook ID: `_________________________`

- [ ] **Add Sources** (select applicable)
  - [ ] **URLs/YouTube**
    - [ ] URL 1: `_________________________`
    - [ ] URL 2: `_________________________`
    - [ ] URL 3: `_________________________`

  - [ ] **Google Drive**
    - [ ] Document 1 ID: `_________________________` (Type: `_____`)
    - [ ] Document 2 ID: `_________________________` (Type: `_____`)

  - [ ] **Pasted Text**
    - [ ] Text 1 Title: `_________________________`
    - [ ] Text 2 Title: `_________________________`

- [ ] **Verify Sources**
  - [ ] Call `notebook_get(notebook_id)` to list all sources
  - [ ] Source count: `_________________________`
  - [ ] Any issues? `_________________________`

- [ ] **Configure Notebook** (optional)
  - [ ] Goal: `_________________________` (default/learning_guide/custom)
  - [ ] Response length: `_________________________`
  - [ ] Custom prompt: `_________________________`

- [ ] **Get Summary**
  - [ ] Call `notebook_describe(notebook_id)`
  - [ ] Summary: `_________________________`
  - [ ] Suggested topics: `_________________________`

---

## Multi-Format Generation Workflow

- [ ] **Batch Setup**
  - [ ] Notebook ID: `_________________________`
  - [ ] Target formats: `_________________________`
  - [ ] Common language: `_________________________`

- [ ] **Generate All Formats** (in parallel)
  - [ ] [ ] Quiz_ID: `_________________________`
  - [ ] [ ] Flashcards_ID: `_________________________`
  - [ ] [ ] Report_ID: `_________________________`
  - [ ] [ ] Slide_Deck_ID: `_________________________`
  - [ ] [ ] Audio_ID: `_________________________`
  - [ ] [ ] Video_ID: `_________________________`

- [ ] **Monitor All Tasks**
  - [ ] Call `studio_status(notebook_id)`
  - [ ] All ready? [ ] Yes [ ] No
  - [ ] Time waited: `_________` minutes

- [ ] **Collect URLs**
  - [ ] URL 1: `_________________________`
  - [ ] URL 2: `_________________________`
  - [ ] URL 3: `_________________________`
  - [ ] URL 4: `_________________________`

---

## Troubleshooting Checklist

- [ ] **Authentication Issues**
  - [ ] [ ] Run `notebooklm-mcp-auth` in terminal
  - [ ] [ ] Verify Chrome profile has NotebookLM login
  - [ ] [ ] Call `refresh_auth()`
  - [ ] [ ] If still fails, use `save_auth_tokens()` fallback

- [ ] **Research Not Completing**
  - [ ] [ ] Verify query is specific and clear
  - [ ] [ ] Try different `mode` (fast vs deep)
  - [ ] [ ] Try different `source` (web vs drive)
  - [ ] [ ] Increase `max_wait` timeout

- [ ] **Content Generation Fails**
  - [ ] [ ] Verify notebook has sources
  - [ ] [ ] Check `studio_status()` for error details
  - [ ] [ ] Ensure format/language combination is valid
  - [ ] [ ] Try different content type

- [ ] **Drive Sync Issues**
  - [ ] [ ] Call `source_list_drive()` to check freshness
  - [ ] [ ] Identify stale sources (>24h old)
  - [ ] [ ] Verify Drive document still accessible
  - [ ] [ ] Call `source_sync_drive()` with user approval

---

## Notes & Observations

```
Session Date: _____________________
Workflow: ________________________
Key Findings: ____________________

Issues Encountered:
____________________________________________________________________
____________________________________________________________________

Solutions Applied:
____________________________________________________________________
____________________________________________________________________

Time Tracking:
  - Research: _________ minutes
  - Content Generation: _________ minutes
  - Total: _________ minutes

Success Rate: _________ %
```
