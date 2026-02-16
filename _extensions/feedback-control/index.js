'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Extension = void 0;

const {ok} = require('node:assert');
const {join} = require('node:path');
const {getBuildHooks, getEntryHooks} = require('@diplodoc/cli');

class Extension {
  apply(program) {
    // Валидируем конфиг перед запуском html-сборки
    getBuildHooks(program)
      .BeforeRun.for('html')
      .tap('FeedbackControl', (run) => {
        const fc = program.config.feedbackControl;

        if (!fc || typeof fc === 'boolean') {
          return;
        }

        ok(fc.endpoint !== '', 'feedbackControl.endpoint must be not empty');

        getEntryHooks(run.entry).Page.tap('FeedbackControl', (template) => {
          const controlConfig = fc === true ? {} : fc;

          template.addScript('_extensions/feedback-control-extension.js', {
            position: 'leading',
            attrs: {defer: void 0},
          });

          template.addScript(
            `window.feedbackControlExtensionInit(${JSON.stringify(controlConfig)})`,
            {position: 'state', inline: true},
          );
        });
      });

    getBuildHooks(program)
      .AfterRun.for('html')
      .tapPromise('FeedbackControl', async (run) => {
        if (!program.config.feedbackControl) return;

        const extensionFilePath = join(
          __dirname,
          'resources',
          'feedback-control-extension.js',
        );

        try {
          await run.copy(
            extensionFilePath,
            join(run.output, '_extensions', 'feedback-control-extension.js'),
          );
        } catch (error) {
          run.logger.warn(
            `Unable copy the feedback-control extension script ${extensionFilePath}.`,
            error,
          );
        }
      });
  }
}

exports.Extension = Extension;