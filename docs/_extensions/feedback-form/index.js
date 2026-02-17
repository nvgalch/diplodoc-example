"use strict";

const {ok} = require("node:assert");
const {join} = require("node:path");
const {mkdir} = require("node:fs/promises");
const {getBuildHooks, getEntryHooks} = require("@diplodoc/cli");

class Extension {
  apply(program) {
    getBuildHooks(program)
      .BeforeRun.for("html")
      .tap("FeedbackForm", (run) => {
        const cfg = program.config.feedbackForm;
        if (!cfg) return;

        ok(typeof cfg === "object", "feedbackForm must be an object");
        ok(typeof cfg.endpoint === "string" && cfg.endpoint.length > 0, "feedbackForm.endpoint must be a non-empty string");

        const position = cfg.position || "content-bottom"; // content-top | content-bottom
        ok(["content-top", "content-bottom"].includes(position), "feedbackForm.position must be 'content-top' or 'content-bottom'");

        getEntryHooks(run.entry).Page.tap("FeedbackForm", (template) => {
          // CSS/JS
          template.addStyle("_extensions/feedback-form.css");
          template.addScript("_extensions/feedback-form.js", {position: "leading", attrs: {defer: void 0}});

          // Конфиг в window
          template.addScript(
            `window.__diplodocFeedbackForm = ${JSON.stringify({
              endpoint: cfg.endpoint,
              position,
            })};`,
            {position: "state", inline: true},
          );
        });
      });

    getBuildHooks(program)
      .AfterRun.for("html")
      .tapPromise("FeedbackForm", async (run) => {
        const cfg = program.config.feedbackForm;
        if (!cfg) return;

        // У тебя страницы лежат в docs-html/ru/, поэтому кладём ассеты в ru/_extensions
        const outDir = join(run.output, "ru", "_extensions");
        await mkdir(outDir, {recursive: true});

        await run.copy(join(__dirname, "resources", "feedback-form.js"), join(outDir, "feedback-form.js"));
        await run.copy(join(__dirname, "resources", "feedback-form.css"), join(outDir, "feedback-form.css"));
      });
  }
}

exports.Extension = Extension;