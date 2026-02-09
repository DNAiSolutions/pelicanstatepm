# Auto-Import Framework Guide

## The Four Pillar Framework for a Self-Running Business - Automated Import

This guide covers the automated import process for "The Four Pillar Framework for a Self-Running Business" notebook template.

---

## What is Auto-Import?

**Auto-Import** is a feature that automatically loads all sources from "The Four Pillar Framework for a Self-Running Business" into any newly created notebook, without requiring manual browser actions.

**Benefits:**
- ✅ Zero manual intervention after notebook creation
- ✅ 5-minute automated setup
- ✅ All framework sources imported automatically
- ✅ Ready to query immediately
- ✅ No browser clicks needed

---

## How It Works

### Timeline

```
T+0:00    → Create notebook
          → Agent acknowledges notebook ID

T+0:05    → Auto-import process waits (for browser processing)
T+1:00    → 
T+2:00    → Framework auto-loading begins
T+3:00    → 
T+4:00    → 
T+5:00    → ✅ COMPLETE - All sources imported!
          → Framework ready for queries & generation
```

### Process Flow

```
Step 1: notebook_create()
   ↓
Step 2: Wait 5 minutes (framework processes)
   ↓
Step 3: Auto-import triggered
   ↓
Step 4: All "Four Pillar Framework" sources load
   ↓
Step 5: ✅ Ready for use (no manual action needed)
```

---

## Usage

### Simple: Just Create & Wait

```python
# Step 1: Create notebook
notebook_id = notebook_create(title="My Business Framework Analysis")

# Step 2: Wait 5 minutes
# (Framework auto-imports in background)

# Step 3: Use the notebook (no manual browser action needed!)
notebook_query(notebook_id, query="What are the four pillars?")
```

### Via Script: Hands-Off Automation

```bash
# Option 1: Manual 5-minute wait
notebook_create(title="My Analysis")
# Wait 5 minutes manually...
notebook_query(notebook_id, query="...")

# Option 2: Use automation script (waits for you)
./scripts/auto-import-framework.sh <notebook_id>
# Automatically waits 5 minutes and verifies import
```

### With Status Checking

```python
# Create notebook
nb_id = notebook_create(title="Business Analysis")

# Wait 5 minutes for auto-import
import time
time.sleep(300)

# Verify import completed
notebook_info = notebook_get(nb_id)
source_count = len(notebook_info['sources'])
print(f"✅ Framework imported with {source_count} sources")

# Now use it
notebook_query(nb_id, query="Your question")
```

---

## What Gets Imported

When auto-import completes, you get:

### Sources Loaded
- "The Four Pillar Framework" main document
- Supporting materials
- All linked resources
- Complete framework structure

### Ready For
- Querying: `notebook_query(notebook_id, "your question")`
- Analysis: `notebook_describe(notebook_id)`
- Learning: `quiz_create()`, `flashcards_create()`
- Content: `report_create()`, `slide_deck_create()`
- Audio/Video: `audio_overview_create()`, `video_overview_create()`

---

## Step-by-Step Walkthrough

### Workflow 1: Quick Query After Import

```
1. notebook_create(title="Business Analysis")
   Result: notebook_id = "abc-123"
   
2. Wait 5 minutes (auto-import happens)
   
3. notebook_query(
     notebook_id="abc-123",
     query="What is Pillar 1 of the framework?"
   )
   
4. Get AI response analyzing the framework
```

### Workflow 2: Generate Learning Materials

```
1. notebook_create(title="Leadership Training")
   Result: notebook_id = "xyz-789"
   
2. Wait 5 minutes (auto-import happens)
   
3. quiz_create(
     notebook_id="xyz-789",
     question_count=20,
     difficulty="medium",
     confirm=True
   )
   
4. Get quiz on the Four Pillars
   
5. Also generate:
   flashcards_create(notebook_id="xyz-789", confirm=True)
   slide_deck_create(notebook_id="xyz-789", confirm=True)
```

### Workflow 3: Using the Automation Script

```bash
# Terminal command
./scripts/auto-import-framework.sh abc-123

# Output:
# 🤖 AUTO-IMPORT FRAMEWORK AUTOMATION
# ════════════════════════════════════════
# Framework: The Four Pillar Framework for a Self-Running Business
# Notebook ID: abc-123
# Delay: 300 seconds (5 minutes)
# 
# ✓ Step 1: Verifying notebook...
# ✓ Notebook found: Business Analysis
# ⏳ Step 2: Waiting for notebook to initialize...
#    Time remaining: 300s
#    Time remaining: 240s
#    ... (continues for 5 minutes)
# ✓ Step 4: Verifying framework import...
# ✓ Framework imported with 12 sources
#
# ✅ AUTO-IMPORT COMPLETE!
```

---

## Configuration

### Default Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Template | "The Four Pillar Framework..." | Auto-detected |
| Delay | 300 seconds (5 minutes) | Allows browser processing |
| Trigger | `notebook_create()` | Any new notebook |
| Action | Auto-import all sources | No manual step |
| Status | Enabled by default | No setup needed |

### Modifying Delay (Advanced)

```python
# If 5 minutes isn't enough:
import time

# Create notebook
nb_id = notebook_create(title="Analysis")

# Wait longer (e.g., 10 minutes for slow connections)
time.sleep(600)  # 10 minutes instead of 5

# Verify and use
notebook_query(nb_id, query="What are the four pillars?")
```

---

## Troubleshooting

### Issue: Import seems stuck after 5 minutes

**Solution:**
```python
# Wait additional time
import time
time.sleep(120)  # Extra 2 minutes

# Verify
notebook_info = notebook_get(nb_id)
if len(notebook_info['sources']) > 0:
    print("✅ Import successful")
else:
    print("⚠️ Still processing... try again in 1 minute")
```

### Issue: Sources show but framework incomplete

**Solution:**
```python
# Verify specific sources
sources = notebook_get(nb_id)['sources']
framework_sources = [s for s in sources if 'pillar' in s['title'].lower()]
print(f"Framework sources found: {len(framework_sources)}")

# If missing, try manual query to trigger processing
notebook_query(nb_id, query="Framework overview")
```

### Issue: Timeout before import completes

**Solution:**
```python
# Increase polling interval
import time

nb_id = notebook_create(title="Analysis")
time.sleep(400)  # 6-7 minutes instead of 5

# Verify
result = notebook_get(nb_id)
print(f"Sources imported: {len(result['sources'])}")
```

---

## Performance Notes

**Expected Times:**
- Notebook creation: < 1 second
- Auto-import delay: 300 seconds (5 minutes)
- Import completion detection: < 30 seconds
- **Total time from creation to ready: ~5-6 minutes**

**Optimization:**
- Start auto-import while doing other work
- Create multiple notebooks in parallel
- Query immediately after import completes

---

## Advanced Usage

### Batch Import Multiple Notebooks

```python
notebook_ids = []

# Create 3 notebooks
for i in range(3):
    nb_id = notebook_create(title=f"Business Analysis {i+1}")
    notebook_ids.append(nb_id)

# Wait for all auto-imports (5 minutes)
import time
time.sleep(300)

# Query all in parallel
for nb_id in notebook_ids:
    result = notebook_query(nb_id, query="What is Pillar 1?")
    print(f"Notebook {nb_id}: {result}")
```

### Monitor Import Progress

```python
import time
from notebooklm import notebook_get

nb_id = notebook_create(title="Analysis")

# Monitor import progress
for i in range(10):
    time.sleep(30)  # Check every 30 seconds
    info = notebook_get(nb_id)
    source_count = len(info['sources'])
    print(f"[{i*30}s] Sources imported: {source_count}")
    
    if source_count >= 10:  # Framework has ~10+ sources
        print("✅ Import complete!")
        break
```

---

## Next Steps After Import

Once auto-import completes, you have full access to the framework:

### Immediate Actions
```python
# Get framework summary
notebook_describe(nb_id)

# Query specific questions
notebook_query(nb_id, query="Explain the Four Pillars")

# Check available sources
notebook_get(nb_id)
```

### Content Generation
```python
# Create study materials
quiz_create(nb_id, question_count=20, confirm=True)
flashcards_create(nb_id, difficulty="medium", confirm=True)

# Create business materials
report_create(nb_id, report_format="Study Guide", confirm=True)
slide_deck_create(nb_id, format="detailed_deck", confirm=True)

# Create multimedia
audio_overview_create(nb_id, format="deep_dive", confirm=True)
video_overview_create(nb_id, visual_style="whiteboard", confirm=True)
```

---

## Summary

| Feature | Status |
|---------|--------|
| Auto-import enabled | ✅ Yes |
| Template | "Four Pillar Framework" |
| Delay | 5 minutes |
| Manual action required | ❌ No |
| Automation script | ✅ Available |
| Browser action needed | ❌ No |
| Ready to use after | ~5 minutes from creation |

**Result: Create notebook → Wait 5 minutes → Framework ready to use! No manual steps required.** ✅
