/**
 * ------------------------------------------------------------
 * Graph Visualization
 * ------------------------------------------------------------
 *
 * TS/JS equivalent of:
 *   Image(abot.graph.get_graph().draw_png())
 *
 * Writes:
 *   - graph.mmd  (Mermaid source, no network required)
 *   - graph.png  (rendered via mermaid.ink, requires internet)
 * ------------------------------------------------------------
 */

import "dotenv/config";
import fs from "fs";
import path from "path";

import { agent } from "../bootstrap/agent.bootstrap";

async function main() {
  const graph = agent.getGraph().getGraph();

  const outDir = path.resolve(__dirname, "../../");

  const mermaid = graph.drawMermaid();
  fs.writeFileSync(path.join(outDir, "graph.mmd"), mermaid);
  console.log("Wrote graph.mmd");

  try {
    const blob = await graph.drawMermaidPng();
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(path.join(outDir, "graph.png"), buffer);
    console.log("Wrote graph.png");
  } catch (err) {
    console.warn(
      "Could not render graph.png (needs internet access to mermaid.ink):",
      err,
    );
  }
}

main().catch(console.error);
