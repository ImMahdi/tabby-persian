# Graph Report - graphify-out  (2026-09-13)

## Corpus Check
- 60 files · ~371,340 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 9 nodes · 10 edges · 3 communities (1 shown, 2 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Module Component (build_graph.py)
- Module Component (audit_graph.py)
- Module Component (build_graph.py)

## God Nodes (most connected - your core abstractions)
1. `apply_monorepo_patches()` - 4 edges
2. `run()` - 3 edges
3. `audit()` - 2 edges
4. `Automated Knowledge Graph Quality, Completeness & Defect Audit Suite for Tabby…` - 1 edges
5. `Comprehensive Enhanced Graphify Pipeline for Tabby (tabby-persian) With…` - 1 edges
6. `Apply AST patches to accurately resolve monorepo TypeScript path aliases and…` - 1 edges

## Surprising Connections (you probably didn't know these)
- `audit()` --calls--> `Path`  [INFERRED]
  audit_graph.py →   _Bridges community 1 → community 0_

## Import Cycles
- None detected.

## Communities (3 total, 2 thin omitted)

### Community 0 - "Module Component (build_graph.py)"
Cohesion: 0.67
Nodes (4): apply_monorepo_patches(), Apply AST patches to accurately resolve monorepo TypeScript path aliases and…, run(), Path

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `audit()` connect `Module Component (audit_graph.py)` to `Module Component (build_graph.py)`?**
  _High betweenness centrality (0.429) - this node is a cross-community bridge._
- **Why does `apply_monorepo_patches()` connect `Module Component (build_graph.py)` to `Module Component (build_graph.py)`?**
  _High betweenness centrality (0.393) - this node is a cross-community bridge._
- **Why does `run()` connect `Module Component (build_graph.py)` to `Module Component (build_graph.py)`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._