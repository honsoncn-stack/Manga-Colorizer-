# Phase 2: Art Interaction Enhancement

## Goal

Strengthen the Electron desktop app with a more professional manga workbench UI and better interaction feedback.

## New components

- Sidebar
- TopBar
- StatusBadge
- MangaCard
- LogPanel
- ImageGrid
- ActionButton
- ProgressStrip
- DropZone
- ImagePreviewModal
- EmptyState
- PathField

## API enhancements

- `/api/job-status`
- stronger `/api/results`
- richer `/api/logs`
- single-job guard for `/api/colorize`

## Progress feedback logic

- waiting
- preparing
- preprocessing
- colorizing
- preserving lines
- quality check
- exporting PDF
- done
- failed

## Drag-and-drop logic

- local folder selection for image batches
- local PDF selection
- drag or click for local input selection
- no cloud upload

## Gallery logic

- show rendered pages
- open large preview
- open output folder
- show PDF exports
- show needs_review count

## UI rules

- dark manga workbench canvas
- thick panel borders
- subtle halftone texture
- speed lines and grid overlays
- gradient action buttons
- calm, readable main content

## Explicit non-goal

This phase does not add reference mode.
