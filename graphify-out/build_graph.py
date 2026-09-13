"""
Comprehensive Enhanced Graphify Pipeline for Tabby (tabby-persian)
With Monorepo Cross-Package Import Resolution & Complete Architectural Connectivity
"""

import sys
import os
import json
import time
import shutil
from pathlib import Path
from collections import Counter

import networkx as nx
import graphify.detect
import graphify.extract
import graphify.build
import graphify.cluster
import graphify.analyze
import graphify.report
import graphify.export
import graphify.diagnostics

def apply_monorepo_patches(root: Path):
    """
    Apply AST patches to accurately resolve monorepo TypeScript path aliases and package cross-references.
    Fixes the relative '../../tabby-*/src' resolution bug in root tsconfig.json.
    """
    graphify.extract._TSCONFIG_ALIAS_CACHE.clear()
    graphify.extract._WORKSPACE_PACKAGE_CACHE.clear()

    # 1. Patch tsconfig alias loader
    orig_load_aliases = graphify.extract._load_tsconfig_aliases
    def patched_load_aliases(start_dir):
        a = orig_load_aliases(start_dir).copy()
        a["tabby-*"] = [str(root / "tabby-*" / "src")]
        for p in root.glob("tabby-*"):
            if p.is_dir():
                a[p.name] = [str(p / "src")]
        return a
    graphify.extract._load_tsconfig_aliases = patched_load_aliases

    # 2. Patch JS module path resolver
    orig_resolve_module = graphify.extract._resolve_js_module_path
    def patched_resolve_module(raw, start_dir=None):
        if isinstance(raw, str) and (raw.startswith("tabby-") or raw in ("app", "web")):
            pkg = raw.split("/")[0]
            sub = raw[len(pkg)+1:]
            pkg_dir = root / pkg
            if pkg_dir.is_dir():
                if not sub:
                    for entry in ["src/index.ts", "lib/index.ts", "index.ts", "src/index.js"]:
                        cand = pkg_dir / entry
                        if cand.exists():
                            return cand.resolve()
                else:
                    for entry in [f"src/{sub}.ts", f"src/{sub}/index.ts", f"lib/{sub}.ts", f"{sub}.ts"]:
                        cand = pkg_dir / entry
                        if cand.exists():
                            return cand.resolve()
        return orig_resolve_module(raw, start_dir)
    graphify.extract._resolve_js_module_path = patched_resolve_module

    # 3. Patch JS import target resolver to generate canonical repo-relative node IDs
    orig_resolve_target = graphify.extract._resolve_js_import_target
    def patched_resolve_target(raw: str, str_path: str):
        if not raw:
            return None

        # Monorepo resolution
        if raw.startswith("tabby-") or raw in ("app", "web"):
            pkg = raw.split("/")[0]
            sub = raw[len(pkg)+1:]
            pkg_dir = root / pkg
            if pkg_dir.is_dir():
                cand = None
                if not sub:
                    for entry in ["src/index.ts", "lib/index.ts", "index.ts", "src/index.js"]:
                        c = pkg_dir / entry
                        if c.exists():
                            cand = c
                            break
                else:
                    for entry in [f"src/{sub}.ts", f"src/{sub}/index.ts", f"lib/{sub}.ts", f"{sub}.ts"]:
                        c = pkg_dir / entry
                        if c.exists():
                            cand = c
                            break
                if cand is not None:
                    rel = cand.resolve().relative_to(root)
                    return graphify.extract._file_node_id(rel), cand.resolve()

        res = orig_resolve_target(raw, str_path)
        if res is not None:
            nid, p = res
            if p is not None:
                try:
                    p_res = p.resolve()
                    if p_res.is_relative_to(root):
                        rel = p_res.relative_to(root)
                        return graphify.extract._file_node_id(rel), p_res
                except Exception:
                    pass
        return res
    graphify.extract._resolve_js_import_target = patched_resolve_target

    print("-> Monorepo resolution patches successfully installed.")

def run():
    print("=" * 60)
    print("Enhanced Graphify Pipeline for Tabby (Monorepo-Connected)")
    print("=" * 60)

    root = Path(".").resolve() # Assumed to run from tabby-persian directory
    out_dir = root / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Clean previous AST cache to ensure fresh extraction with cross-package links
    cache_dir = out_dir / "cache"
    if cache_dir.exists():
        print("-> Clearing stale AST cache for complete re-extraction...")
        shutil.rmtree(cache_dir, ignore_errors=True)

    # Apply monorepo patches
    apply_monorepo_patches(root)

    # ----------------------------------------------------
    # Step 1: Detect & Filter
    # ----------------------------------------------------
    print("\n[Step 1] Detecting files and applying exclusion filters...")
    raw_detect = graphify.detect.detect(root)
    all_code_files = [Path(f) for f in raw_detect.get("files", {}).get("code", [])]

    # Filter: exclude readme, docs, github templates, media
    filtered_code_files = []
    for f in all_code_files:
        posix = f.as_posix().lower()
        if "readme" in posix:
            continue
        if ".github" in posix:
            continue
        if "/docs/" in posix or "\\docs\\" in posix:
            continue
        if f.suffix.lower() in [".md", ".png", ".jpg", ".svg", ".ogg", ".mp4"]:
            continue
        filtered_code_files.append(f)

    total_words = 0
    for f in filtered_code_files:
        try:
            total_words += len(f.read_text(encoding="utf-8", errors="ignore").split())
        except Exception:
            pass

    clean_detect = {
        "scan_root": str(root),
        "total_files": len(filtered_code_files),
        "total_words": total_words,
        "files": {
            "code": [str(f) for f in filtered_code_files],
            "document": [],
            "paper": [],
            "image": [],
            "video": []
        }
    }
    (out_dir / ".graphify_detect.json").write_text(json.dumps(clean_detect, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"-> Filtered corpus: {len(filtered_code_files)} code files (~{total_words:,} words)")

    # ----------------------------------------------------
    # Step 2: AST Extraction with Cross-Package Links
    # ----------------------------------------------------
    print("\n[Step 2] Structural AST extraction with full monorepo symbol resolution...")
    t0 = time.time()
    # Pass parallel=False so in-memory monorepo patches are 100% active across all files
    ast_result = graphify.extract.extract(filtered_code_files, cache_root=None, parallel=False)
    (out_dir / ".graphify_ast.json").write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"-> AST extraction complete in {time.time() - t0:.2f}s: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")

    # Empty semantic extraction (code-only corpus)
    empty_sem = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}
    (out_dir / ".graphify_semantic.json").write_text(json.dumps(empty_sem, ensure_ascii=False), encoding="utf-8")

    # Merged extraction
    extraction = {
        "nodes": ast_result["nodes"],
        "edges": ast_result["edges"],
        "hyperedges": [],
        "input_tokens": 0,
        "output_tokens": 0,
    }
    (out_dir / ".graphify_extract.json").write_text(json.dumps(extraction, indent=2, ensure_ascii=False), encoding="utf-8")

    # ----------------------------------------------------
    # Step 3: Graph Construction & Community Clustering
    # ----------------------------------------------------
    print("\n[Step 3] Building graph and clustering communities...")
    G = graphify.build.build_from_json(extraction, root=str(root), directed=False)
    print(f"-> Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    if G.number_of_nodes() == 0:
        print("ERROR: Graph is empty.")
        sys.exit(1)

    # Check connected components / Giant Component
    components = list(nx.connected_components(G))
    components.sort(key=len, reverse=True)
    giant_size = len(components[0]) if components else 0
    giant_pct = (giant_size / G.number_of_nodes()) * 100
    print(f"-> Connected components: {len(components)} (Giant component: {giant_size} nodes / {giant_pct:.1f}%)")

    communities = graphify.cluster.cluster(G)
    cohesion = graphify.cluster.score_all(G, communities)
    print(f"-> Identified {len(communities)} communities.")

    # ----------------------------------------------------
    # Step 4: Health Diagnostics
    # ----------------------------------------------------
    print("\n[Step 4] Running graph health diagnostics...")
    diag = graphify.diagnostics.diagnose_extraction(extraction, directed=False, root=str(root))
    print(graphify.diagnostics.format_diagnostic_report(diag))

    # ----------------------------------------------------
    # Step 5: Community Analysis & Plain-Language Labeling
    # ----------------------------------------------------
    print("\n[Step 5] Analyzing communities and assigning labels...")
    labels = {}
    node_attr = {n: G.nodes[n] for n in G.nodes}
    
    for cid, members in communities.items():
        file_counts = Counter()
        labels_sample = []
        for m in members:
            data = node_attr.get(m, {})
            src = data.get("source_file", "")
            if src:
                parts = Path(src).parts
                if len(parts) > 0:
                    file_counts[parts[0]] += 1
            lbl = data.get("label", "")
            if lbl:
                labels_sample.append(lbl)

        top_pkg = file_counts.most_common(2)
        pkg_names = [p[0] for p in top_pkg]
        pkg_str = " / ".join(pkg_names) if pkg_names else "Core Architecture"
        
        if any("terminal" in p.lower() for p in pkg_names):
            label = f"Terminal & Shell Emulation ({pkg_str})"
        elif any("ssh" in p.lower() for p in pkg_names):
            label = f"SSH Protocol & Remote Sessions ({pkg_str})"
        elif any("settings" in p.lower() for p in pkg_names):
            label = f"Settings & Configuration UI ({pkg_str})"
        elif any("electron" in p.lower() for p in pkg_names) or any("app" == p.lower() for p in pkg_names):
            label = f"Electron Native IPC & Host App ({pkg_str})"
        elif any("plugin" in p.lower() for p in pkg_names):
            label = f"Plugin Infrastructure & Extensibility ({pkg_str})"
        elif any("serial" in p.lower() for p in pkg_names):
            label = f"Serial Port Connections ({pkg_str})"
        elif any("telnet" in p.lower() for p in pkg_names):
            label = f"Telnet Protocol Client ({pkg_str})"
        elif any("linkifier" in p.lower() for p in pkg_names):
            label = f"URL & Path Linkifier ({pkg_str})"
        elif any("web" in p.lower() for p in pkg_names):
            label = f"Web Platform & Gateway Services ({pkg_str})"
        elif any("core" in p.lower() for p in pkg_names):
            label = f"Core Subsystem & Tab Lifecycle ({pkg_str})"
        elif any("local" in p.lower() for p in pkg_names):
            label = f"Local PTY & Process Spawn ({pkg_str})"
        elif any("uac" in p.lower() for p in pkg_names):
            label = f"Windows UAC Elevation ({pkg_str})"
        elif any("community-color" in p.lower() for p in pkg_names):
            label = f"Theme & Palette Customization ({pkg_str})"
        else:
            label = f"Module Component ({pkg_str})"

        labels[cid] = label

    (out_dir / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False, indent=2), encoding="utf-8")

    gods = graphify.analyze.god_nodes(G, top_n=10)
    surprises = graphify.analyze.surprising_connections(G, communities, top_n=8)
    questions = graphify.analyze.suggest_questions(G, communities, labels, top_n=7)

    # ----------------------------------------------------
    # Step 6: Generate Outputs
    # ----------------------------------------------------
    print("\n[Step 6] Generating outputs (graph.json, GRAPH_REPORT.md, graph.html)...")
    
    # 1. graph.json
    graphify.export.to_json(G, communities, str(out_dir / "graph.json"), community_labels=labels)
    print("-> Exported graph.json")

    # 2. GRAPH_REPORT.md
    token_cost = {"input": 0, "output": 0}
    report_content = graphify.report.generate(
        G,
        communities,
        cohesion,
        labels,
        gods,
        surprises,
        clean_detect,
        token_cost,
        str(root),
        suggested_questions=questions
    )
    (out_dir / "GRAPH_REPORT.md").write_text(report_content, encoding="utf-8")
    print("-> Generated GRAPH_REPORT.md")

    # 3. graph.html
    try:
        os.environ["GRAPHIFY_VIZ_NODE_LIMIT"] = "15000"
        graphify.export.to_html(G, communities, str(out_dir / "graph.html"), community_labels=labels)
        print("-> Generated interactive graph.html")
    except Exception as e:
        print(f"-> Notice regarding graph.html: {e}")

    # Clean intermediate files
    for temp_name in [
        ".graphify_detect.json",
        ".graphify_ast.json",
        ".graphify_semantic.json",
        ".graphify_extract.json",
        ".graphify_analysis.json"
    ]:
        temp_p = out_dir / temp_name
        if temp_p.exists():
            try:
                temp_p.unlink()
            except Exception:
                pass

    print("\n" + "=" * 60)
    print(f"SUCCESS: Enhanced Pipeline Completed!")
    print(f"Total Nodes: {G.number_of_nodes():,}")
    print(f"Total Edges: {G.number_of_edges():,}")
    print(f"Giant Component: {giant_size:,} nodes ({giant_pct:.1f}%)")
    print(f"Total Communities: {len(communities)}")
    print(f"Interactive Graph: {out_dir / 'graph.html'}")
    print(f"Audit Report:      {out_dir / 'GRAPH_REPORT.md'}")
    print("=" * 60)

if __name__ == "__main__":
    run()
