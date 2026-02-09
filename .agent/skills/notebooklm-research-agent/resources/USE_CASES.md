# NotebookLM Research Agent - Common Use Cases

## Use Case 1: Quick Learning Material from Web Articles

**Scenario:** User wants to turn 3 web articles into a quiz + flashcards for studying.

**Steps:**
```
1. notebook_create(title="React Hooks Study")
2. notebook_add_url(notebook_id, "https://react.dev/reference/react/hooks")
3. notebook_add_url(notebook_id, "https://youtu.be/...")
4. notebook_add_url(notebook_id, "https://blog.example.com/...")
5. quiz_create(notebook_id, question_count=10, difficulty="medium", confirm=True)
6. flashcards_create(notebook_id, difficulty="medium", confirm=True)
7. studio_status(notebook_id)  # Get download links
```

**Time:** ~3 minutes

---

## Use Case 2: Deep Research Report with Multiple Sources

**Scenario:** Researcher needs comprehensive market analysis from web + Google Drive docs.

**Steps:**
```
1. notebook_create(title="AI Market Analysis 2025")

2. # Add existing Drive docs
   notebook_add_drive(notebook_id, "1abc...", "Market Report 2024", "pdf")
   notebook_add_drive(notebook_id, "2def...", "Competitor Analysis", "sheets")

3. # Search for new sources
   research_start(query="AI market trends 2025", source="web", mode="deep")
   research_status(task_id, max_wait=300)  # Wait 5 min
   research_import(notebook_id, task_id)

4. # Generate report
   report_create(
     notebook_id,
     report_format="Briefing Doc",
     language="en",
     confirm=True
   )

5. # Generate complementary content
   infographic_create(notebook_id, detail_level="detailed", confirm=True)
   slide_deck_create(notebook_id, format="detailed_deck", confirm=True)

6. studio_status(notebook_id)  # Get all URLs when ready
```

**Time:** ~10-15 minutes

---

## Use Case 3: Educational Content for Multiple Languages

**Scenario:** Create study materials in 5 languages from technical documentation.

**Steps:**
```
1. notebook_create(title="Machine Learning Fundamentals")

2. # Add technical sources
   notebook_add_url(notebook_id, "https://ml.org/docs")
   notebook_add_drive(notebook_id, "doc_id", "Textbook", "pdf")
   notebook_add_text(notebook_id, "class notes...", "Lecture Notes")

3. # Configure for learning
   chat_configure(notebook_id, goal="learning_guide", response_length="longer")

4. # Generate in multiple languages
   for lang in ["en", "es", "fr", "de", "ja"]:
     quiz_create(notebook_id, question_count=15, difficulty="easy", confirm=True)
     flashcards_create(notebook_id, difficulty="easy", confirm=True)
     # (Change language in system prompt or notebook setting)

5. studio_status(notebook_id)
```

**Time:** ~15-20 minutes

---

## Use Case 4: Podcast/Video Series Preparation

**Scenario:** Content creator wants audio overviews with specific focus areas.

**Steps:**
```
1. notebook_create(title="Tech Trends Podcast - Q1 2025")

2. # Research trending topics
   research_start(query="emerging technology trends", source="web", mode="deep")
   research_status(task_id, max_wait=300)
   research_import(notebook_id, task_id)

3. # Create deep-dive audio
   audio_overview_create(
     notebook_id,
     format="deep_dive",
     length="long",
     language="en",
     focus_prompt="Focus on: (1) Market size, (2) Real-world applications, (3) Investment opportunities",
     confirm=True
   )

4. # Create brief version for social media
   audio_overview_create(
     notebook_id,
     format="brief",
     length="short",
     language="en",
     confirm=True
   )

5. studio_status(notebook_id)  # Download audio files
```

**Time:** ~8-12 minutes

---

## Use Case 5: Competitive Intelligence Report

**Scenario:** Business analyst needs to track competitor data from multiple sources.

**Steps:**
```
1. notebook_create(title="Competitor Analysis - 2025")

2. # Add competitor websites + press releases
   notebook_add_url(notebook_id, "https://competitor1.com")
   notebook_add_url(notebook_id, "https://competitor2.com")
   notebook_add_url(notebook_id, "https://news.example.com/competitor-press")

3. # Import from Google Drive (previous reports)
   notebook_add_drive(notebook_id, "drive_id", "Q4 2024 Report", "pdf")

4. # Configure for critical analysis
   chat_configure(
     notebook_id,
     goal="custom",
     custom_prompt="Analyze as competitive intelligence expert. Provide: (1) Strengths, (2) Weaknesses, (3) Market positioning, (4) Threats to us, (5) Opportunities"
   )

5. # Generate structured reports
   report_create(
     notebook_id,
     report_format="Create Your Own",
     custom_prompt="Competitive intelligence report with SWOT analysis and strategic recommendations",
     confirm=True
   )

   slide_deck_create(
     notebook_id,
     format="presenter_slides",
     length="default",
     confirm=True
   )

6. studio_status(notebook_id)
```

**Time:** ~12-15 minutes

---

## Use Case 6: Data Extraction & Table Generation

**Scenario:** Extract structured data from unstructured sources (e.g., research papers, reports).

**Steps:**
```
1. notebook_create(title="AI Benchmark Extraction")

2. # Add PDFs with benchmark data
   notebook_add_drive(notebook_id, "paper1_id", "NeurIPS 2024 Results", "pdf")
   notebook_add_drive(notebook_id, "paper2_id", "Model Comparison Study", "pdf")
   notebook_add_text(notebook_id, "benchmark_notes...", "Local Test Results")

3. # Generate data tables
   data_table_create(
     notebook_id,
     description="Extract all benchmark results, model names, accuracy scores, inference time, and parameter count",
     confirm=True
   )

   # Create second table for comparison
   data_table_create(
     notebook_id,
     description="Comparative analysis: rank models by efficiency (accuracy/inference_time)",
     confirm=True
   )

4. studio_status(notebook_id)  # Export tables
```

**Time:** ~6-10 minutes

---

## Use Case 7: Mind Map for Project Planning

**Scenario:** Brainstorm project structure from research materials.

**Steps:**
```
1. notebook_create(title="Software Architecture Research")

2. # Add design patterns + architecture docs
   notebook_add_url(notebook_id, "https://patterns.dev/posts/")
   notebook_add_url(notebook_id, "https://youtu.be/architecture-video")
   notebook_add_text(notebook_id, "project_requirements...", "Requirements Doc")

3. # Generate mind map
   mind_map_create(
     notebook_id,
     title="Software Architecture Framework",
     confirm=True
   )

4. studio_status(notebook_id)  # Get mind map visualization
```

**Time:** ~5-8 minutes

---

## Use Case 8: Video Tutorial Generation

**Scenario:** Create explainer video from technical documentation.

**Steps:**
```
1. notebook_create(title="Docker Concepts Tutorial")

2. # Add technical sources
   notebook_add_url(notebook_id, "https://docker.com/docs")
   notebook_add_url(notebook_id, "https://youtu.be/docker-intro")

3. # Generate multiple video styles
   video_overview_create(
     notebook_id,
     format="explainer",
     visual_style="whiteboard",
     language="en",
     confirm=True
   )

   # Kawaii style for more casual audience
   video_overview_create(
     notebook_id,
     format="brief",
     visual_style="kawaii",
     language="en",
     confirm=True
   )

4. studio_status(notebook_id)  # Download videos
```

**Time:** ~10-15 minutes

---

## Use Case 9: Continuous Drive Source Updates

**Scenario:** Keep notebook in sync with frequently-updated Google Drive documents.

**Steps:**
```
1. # Initial setup (one-time)
   notebook_create(title="Project Knowledge Base")
   notebook_add_drive(notebook_id, "shared_doc_id", "Living Documentation", "doc")
   notebook_add_drive(notebook_id, "specs_id", "Technical Specs", "sheets")

2. # Weekly sync workflow
   sources = source_list_drive(notebook_id)
   
   # Check which are stale
   stale_sources = [s for s in sources if days_old(s["last_sync"]) > 7]
   
   # Sync if needed
   if stale_sources:
     source_sync_drive([s["id"] for s in stale_sources], confirm=True)

3. # Query for updates
   notebook_query(
     notebook_id,
     query="What changed since last week? Summarize updates."
   )

4. # Generate fresh content
   report_create(notebook_id, report_format="Study Guide", confirm=True)
```

**Time:** ~5 minutes (weekly)

---

## Use Case 10: Multi-Format Content Suite for Course

**Scenario:** Create complete learning suite from course materials.

**Steps:**
```
1. notebook_create(title="Data Science 101 - Complete Course")

2. # Add all course materials
   notebook_add_url(notebook_id, "https://course.example.com/module-1")
   notebook_add_url(notebook_id, "https://course.example.com/module-2")
   notebook_add_drive(notebook_id, "syllabus_id", "Syllabus", "doc")
   notebook_add_drive(notebook_id, "datasets_id", "Datasets", "sheets")

3. # Generate complete learning suite
   quiz_create(notebook_id, question_count=20, difficulty="medium", confirm=True)
   flashcards_create(notebook_id, difficulty="medium", confirm=True)
   report_create(notebook_id, report_format="Study Guide", confirm=True)
   slide_deck_create(notebook_id, format="detailed_deck", confirm=True)
   audio_overview_create(notebook_id, format="deep_dive", length="long", confirm=True)
   infographic_create(notebook_id, detail_level="detailed", confirm=True)
   mind_map_create(notebook_id, title="Course Concepts", confirm=True)

4. studio_status(notebook_id)  # All content ready
```

**Time:** ~15-20 minutes

---

## Quick Reference: Operation Time Estimates

| Operation | Time | Notes |
|-----------|------|-------|
| notebook_create | <1s | Instant |
| notebook_add_url | 2-5s | Per URL |
| notebook_add_drive | 3-8s | Per document |
| research_start (fast) | 30-60s | ~10 sources |
| research_start (deep) | 3-5min | ~40 sources |
| quiz_create | 2-5min | Depends on length |
| report_create | 3-8min | Depends on format |
| audio_overview_create | 5-10min | Depends on length |
| video_overview_create | 8-15min | Rendering included |
| slide_deck_create | 3-8min | Depends on depth |
| infographic_create | 2-5min | Per infographic |
| mind_map_create | 1-3min | Usually quick |
| data_table_create | 2-5min | Depends on data size |
