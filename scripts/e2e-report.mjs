import fs from 'node:fs'
import path from 'node:path'

const resultPath = path.resolve('test-results/e2e-results.json')
const outputDir = path.resolve('e2e-report')
const outputPath = path.join(outputDir, 'latest.md')

if (!fs.existsSync(resultPath)) {
  console.error(`Missing ${resultPath}. Run npm run test:e2e first.`)
  process.exit(1)
}

const report = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
const specs = collectSpecs(report.suites ?? [])
const tests = specs.flatMap((spec) => spec.tests)
const passed = tests.filter((test) => test.status === 'passed').length
const failed = tests.filter((test) => test.status === 'failed').length
const skipped = tests.filter((test) => test.status === 'skipped').length
const flaky = tests.filter((test) => test.status === 'flaky').length

const lines = [
  '# E2E Automation Test Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  `- Total: ${tests.length}`,
  `- Passed: ${passed}`,
  `- Failed: ${failed}`,
  `- Flaky: ${flaky}`,
  `- Skipped: ${skipped}`,
  '',
  '## Failed Tests',
  '',
]

const failedTests = tests.filter((test) => test.status === 'failed')
if (!failedTests.length) {
  lines.push('No failed tests.')
} else {
  for (const test of failedTests) {
    lines.push(`### ${test.title}`)
    lines.push('')
    lines.push(`- File: \`${test.location.file}:${test.location.line}\``)
    lines.push(`- Project: \`${test.projectName ?? 'default'}\``)
    const error = test.error
    if (error?.message) {
      lines.push('')
      lines.push('```text')
      lines.push(stripAnsi(error.message).split('\n').slice(0, 20).join('\n'))
      lines.push('```')
    }
    lines.push('')
  }
}

lines.push('## Test Inventory')
lines.push('')
for (const spec of specs) {
  lines.push(`### ${spec.file}`)
  lines.push('')
  for (const test of spec.tests) {
    lines.push(`- ${statusIcon(test.status)} ${test.title}`)
  }
  lines.push('')
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`Wrote ${outputPath}`)

function collectSpecs(suites, titlePath = []) {
  const specs = []
  for (const suite of suites) {
    const nextTitlePath = suite.title && !suite.title.endsWith('.spec.ts')
      ? [...titlePath, suite.title]
      : titlePath

    if (suite.specs) {
      for (const spec of suite.specs) {
        const normalizedTests = (spec.tests ?? []).map((test) => normalizeTest(spec, test, nextTitlePath))
        specs.push({
          file: spec.file,
          tests: normalizedTests,
        })
      }
    }
    specs.push(...collectSpecs(suite.suites ?? [], nextTitlePath))
  }
  return specs
}

function statusIcon(outcome) {
  if (outcome === 'passed') return '[PASS]'
  if (outcome === 'failed') return '[FAIL]'
  if (outcome === 'flaky') return '[FLAKY]'
  return '[SKIP]'
}

function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-9;]*m/g, '')
}

function normalizeTest(spec, test, titlePath) {
  const results = test.results ?? []
  const statuses = results.map((result) => result.status)
  const failedResult = results.find((result) => result.status === 'failed' || result.error)

  let status = 'skipped'
  if (statuses.includes('failed') || failedResult) status = 'failed'
  else if (statuses.includes('passed') && statuses.length > 1) status = 'flaky'
  else if (statuses.includes('passed')) status = 'passed'

  return {
    title: [...titlePath, spec.title].filter(Boolean).join(' > '),
    status,
    projectName: test.projectName,
    location: {
      file: spec.file,
      line: spec.line ?? 0,
    },
    error: failedResult?.error,
  }
}
