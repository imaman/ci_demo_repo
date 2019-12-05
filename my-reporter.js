// my-reporter.js
'use strict';

const fs = require('fs')

const Mocha = require('mocha');



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

    runner.once(Mocha.Runner.constants.EVENT_RUN_END, () => {
      const arr = []
      this.map.forEach((v, k) => {
        arr.push({file: k, passes: v})
      })
      fs.writeFileSync(this.outputFile, JSON.stringify(arr), 'utf-8')
    });

    runner.on(Mocha.Runner.constants.EVENT_TEST_BEGIN, t => {
      const x = this.map.get(t.file)
      if (!x) {
        this.map.set(t.file, true)
      }
    })
    runner.on(Mocha.Runner.constants.EVENT_TEST_FAIL, t => {
      this.map.set(t.file, false)
    })
    runner.on(Mocha.Runner.constants.EVENT_TEST_PENDING, t => {
      this.map.set(t.file, false)
    })
  }
}

module.exports = MyReporter;


