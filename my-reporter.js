// my-reporter.js
'use strict';

const fs = require('fs')

const Mocha = require('mocha');
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
} = Mocha.Runner.constants;


const es = {
    /**
     * Emitted when {@link Hook} execution begins
     */
    EVENT_HOOK_BEGIN: 'hook',
    /**
     * Emitted when {@link Hook} execution ends
     */
    EVENT_HOOK_END: 'hook end',
    /**
     * Emitted when Root {@link Suite} execution begins (all files have been parsed and hooks/tests are ready for execution)
     */
    EVENT_RUN_BEGIN: 'start',
    /**
     * Emitted when Root {@link Suite} execution has been delayed via `delay` option
     */
    EVENT_DELAY_BEGIN: 'waiting',
    /**
     * Emitted when delayed Root {@link Suite} execution is triggered by user via `global.run()`
     */
    EVENT_DELAY_END: 'ready',
    /**
     * Emitted when Root {@link Suite} execution ends
     */
    EVENT_RUN_END: 'end',
    /**
     * Emitted when {@link Suite} execution begins
     */
    EVENT_SUITE_BEGIN: 'suite',
    /**
     * Emitted when {@link Suite} execution ends
     */
    EVENT_SUITE_END: 'suite end',
    /**
     * Emitted when {@link Test} execution begins
     */
    EVENT_TEST_BEGIN: 'test',
    /**
     * Emitted when {@link Test} execution ends
     */
    EVENT_TEST_END: 'test end',
    /**
     * Emitted when {@link Test} execution fails
     */
    EVENT_TEST_FAIL: 'fail',
    /**
     * Emitted when {@link Test} execution succeeds
     */
    EVENT_TEST_PASS: 'pass',
    /**
     * Emitted when {@link Test} becomes pending
     */
    EVENT_TEST_PENDING: 'pending',
    /**
     * Emitted when {@link Test} execution has failed, but will retry
     */
    EVENT_TEST_RETRY: 'retry'
}

// this reporter outputs test results, indenting two spaces per suite
class MyReporter {
  constructor(runner, options) {
    this.outputFile = null;
    if (options && options.reporterOptions) {
      this.outputFile = options.reporterOptions.outputFile || this.outputFile
    }

    if (!this.outputFile) {
      throw new Error('reporter option "outputFile" is missing')
    } 
    
    this.currFile = null
    this.map = new Map()

    runner.once(EVENT_RUN_END, () => {
      const arr = []
      this.map.forEach((v, k) => {
        arr.push({file: k, passes: v})
      })
      fs.writeFileSync(this.outputFile, JSON.stringify(arr), 'utf-8')
    });

    runner.on(es.EVENT_TEST_BEGIN, t => {
      const x = this.map.get(t.file)
      if (!x) {
        this.map.set(t.file, true)
      }
    })
    runner.on(es.EVENT_TEST_FAIL, t => {
      this.map.set(t.file, false)
    })
    runner.on(es.EVENT_TEST_PENDING, t => {
      this.map.set(t.file, false)
    })
  }
}

module.exports = MyReporter;


