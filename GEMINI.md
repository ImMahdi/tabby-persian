# Tabby Terminal Upgrade & Modernization Project

## Project Mission
This project focuses on upgrading and modernizing Tabby Terminal step-by-step, including:
1. Full Persian & RTL support (rendering, text shaping, layout, and bidirectional terminal behavior).
2. Modern UI/UX enhancements inspired by the Termius study located in `../termius-ui-ux-study/`.
3. Architectural cleanups, performance optimizations, and feature expansions.

---

## Core Operational Rules

### 1. Superpower Methodology & Workflow Discipline
- **Skill-First Operation**: Before any response or action, check for and invoke relevant skills (`using-superpowers`).
- **Design & Brainstorming Before Code**: Before any implementation, feature addition, or behavior modification, invoke `superpowers:brainstorming`. Always classify the task (Spike, Bounded, Architectural), present the design, and **wait for explicit user approval** before touching code.
- **Structured Planning**: For multi-step tasks, use `superpowers:writing-plans` and execute via `superpowers:executing-plans` or `superpowers:subagent-driven-development`.
- **Test-Driven Development (TDD)**: Write and run tests before implementing features or bugfixes (`superpowers:test-driven-development`).
- **Rigorous Verification**: Never claim completion without executing verification commands and providing concrete evidence (`superpowers:verification-before-completion`).

### 2. Knowledge Graph with `/graphify`
- **Knowledge-Graph-First Exploration**: Whenever understanding of the codebase is required, consult the knowledge graph first.
  - Primary graph location: `graphify-out/` (containing `graph.json`, `graph.html`, and `GRAPH_REPORT.md`).
  - Use `graphify query "<question>"` or inspect `graph.json` to trace dependencies, call chains, god nodes, and community clusters.
- **Continuous Graph Synchronization**:
  - Whenever files are created, modified, or deleted in the codebase, keep the graph updated.
  - Run incremental updates (`graphify --update`) to ensure the knowledge graph remains synchronized with reality and prevents architectural drift.

### 3. Language & Communication
- Respond to the user in Persian when they communicate in Persian.
- Keep explanations clear, structured, and technical.
- Always provide clickable links to modified or referenced files.
