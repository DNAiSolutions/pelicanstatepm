#!/bin/bash
# Quick Research Workflow
# Usage: ./quick-research.sh "quantum computing" web fast

QUERY="${1:-research topic}"
SOURCE="${2:-web}"
MODE="${3:-fast}"

echo "🔍 Starting NotebookLM Research..."
echo "Query: $QUERY"
echo "Source: $SOURCE"
echo "Mode: $MODE"
echo ""

# Step 1: Start research
echo "📚 Starting research task..."
RESPONSE=$(python3 -c "
from notebooklm import research_start
result = research_start(
    query='$QUERY',
    source='$SOURCE',
    mode='$MODE'
)
import json
print(json.dumps(result))
")

TASK_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['task_id'])")
NOTEBOOK_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('notebook_id', ''))")

echo "✅ Research started"
echo "Task ID: $TASK_ID"
echo "Notebook ID: $NOTEBOOK_ID"
echo ""

# Step 2: Poll for completion
echo "⏳ Polling for results..."
POLL_INTERVAL=30
MAX_WAIT=300
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS_RESPONSE=$(python3 -c "
from notebooklm import research_status
result = research_status(
    task_id='$TASK_ID',
    max_wait=0,
    compact=True
)
import json
print(json.dumps(result))
")

  STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
  SOURCES_FOUND=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sources_found', 0))")

  echo "[$ELAPSED/$MAX_WAIT]s - Status: $STATUS - Sources: $SOURCES_FOUND"

  if [ "$STATUS" = "completed" ]; then
    echo "✅ Research complete!"
    break
  fi

  sleep $POLL_INTERVAL
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

# Step 3: Import sources
if [ "$STATUS" = "completed" ]; then
  echo ""
  echo "📥 Importing sources..."
  python3 -c "
from notebooklm import research_import
result = research_import(
    notebook_id='$NOTEBOOK_ID',
    task_id='$TASK_ID',
    source_indices='all'
)
print(f'✅ Imported {len(result[\"imported_sources\"])} sources')
"

  echo ""
  echo "🎉 Ready to generate content!"
  echo "Notebook ID: $NOTEBOOK_ID"
  echo ""
  echo "Next steps:"
  echo "  - Generate quiz: quiz_create(notebook_id='$NOTEBOOK_ID', confirm=True)"
  echo "  - Generate report: report_create(notebook_id='$NOTEBOOK_ID', confirm=True)"
  echo "  - Query sources: notebook_query(notebook_id='$NOTEBOOK_ID', query='your question')"
fi
