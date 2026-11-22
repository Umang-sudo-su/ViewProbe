#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { ProbeEngine } from "./engine.js";
import { formatForAgent, formatAsMarkdown, formatAsOneLiner } from "./formatter.js";
import { DEFAULT_VIEWPORTS, type Viewport, type ProbeConfig } from "./types.js";

const program = new Command();

program
  .name("viewprobe")
  .description("Headless layout verification for AI coding agents")
  .version("0.1.0");

program
  .command("check")
  .description("Scan a URL for layout violations across viewports")
  .argument("<url>", "URL to scan (e.g. http://localhost:3000)")
  .option(
    "-v, --viewports <viewports>",
    "Comma-separated viewport names: mobile,tablet,desktop,wide",
    "mobile,desktop"
  )
  .option("-f, --format <format>", "Output format: agent, markdown, oneline", "agent")
  .option("-s, --selectors <selectors>", "Comma-separated CSS selectors to focus on")
  .option("--skip <selectors>", "Comma-separated CSS selectors to skip")
  .option("--no-crops", "Disable micro-crop screenshots")
  .option("--timeout <ms>", "Page load timeout in milliseconds", "10000")
  .option("--wait-for <selector>", "Wait for this selector before scanning")
  .action(async (url: string, opts) => {
    const viewportNames = opts.viewports.split(",").map((s: string) => s.trim());
    const viewports: Viewport[] = viewportNames
      .map((name: string) => DEFAULT_VIEWPORTS.find((v) => v.name === name))
      .filter(Boolean) as Viewport[];

    if (viewports.length === 0) {
      console.error(chalk.red(`Unknown viewport names: ${opts.viewports}`));
      console.error(
        `Available: ${DEFAULT_VIEWPORTS.map((v) => v.name).join(", ")}`
      );
      process.exit(1);
    }

    const config: ProbeConfig = {
      url,
      viewports,
      selectors: opts.selectors?.split(",").map((s: string) => s.trim()),
      skipSelectors: opts.skip?.split(",").map((s: string) => s.trim()),
      microCrops: opts.crops !== false,
      timeout: parseInt(opts.timeout, 10),
      waitForSelector: opts.waitFor,
    };

    const engine = new ProbeEngine();

    try {
      console.error(
        chalk.dim(
          `Scanning ${url} across ${viewports.map((v) => v.name).join(", ")}...`
        )
      );

      const result = await engine.probe(config);

      switch (opts.format) {
        case "agent":
          console.log(formatForAgent(result));
          break;
        case "markdown":
          console.log(formatAsMarkdown(result));
          break;
        case "oneline":
          console.log(formatAsOneLiner(result));
          break;
        default:
          console.log(formatForAgent(result));
      }

      process.exit(result.passed ? 0 : 1);
    } catch (err) {
      console.error(chalk.red(`Scan failed: ${(err as Error).message}`));
      process.exit(2);
    } finally {
      await engine.close();
    }
  });

program
  .command("viewports")
  .description("List available viewport presets")
  .action(() => {
    console.log(chalk.bold("Available viewports:\n"));
    for (const vp of DEFAULT_VIEWPORTS) {
      console.log(`  ${chalk.cyan(vp.name.padEnd(10))} ${vp.width}\u00D7${vp.height}`);
    }
  });

program.parse();
