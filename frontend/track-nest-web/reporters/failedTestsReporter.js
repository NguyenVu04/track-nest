const fs = require('fs')
const path = require('path')

class FailedTestsReporter {
  onRunComplete(_contexts, results) {
    const failed = []

    for (const testFile of results.testResults) {
      for (const testResult of testFile.testResults) {
        if (testResult.status === 'failed') {
          failed.push({
            suite: path.relative(process.cwd(), testFile.testFilePath),
            test: testResult.fullName,
            duration: testResult.duration ?? null,
            messages: testResult.failureMessages,
          })
        }
      }
    }

    const outDir = path.join(process.cwd(), 'test-results')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    fs.writeFileSync(
      path.join(outDir, 'failed-tests.json'),
      JSON.stringify({ total: failed.length, failed }, null, 2)
    )
  }
}

module.exports = FailedTestsReporter
