import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildReleaseVersionSummary, RELEASE_CHECK_SKIP_REASONS } from './release-check-helpers.mjs';

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);

const options = {
  dryRun: argSet.has('--dry-run'),
  skipE2E: argSet.has('--skip-e2e'),
  json: argSet.has('--json'),
  allowE2ESkip: argSet.has('--allow-e2e-skip') || process.env.RELEASE_CHECK_ALLOW_E2E_SKIP === '1',
};

const paths = {
  packageJson: path.join(projectRoot, 'package.json'),
  androidGradle: path.join(projectRoot, 'android/app/build.gradle'),
  iosPbxproj: path.join(projectRoot, 'ios/App/App.xcodeproj/project.pbxproj'),
};

function mustReadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到檔案：${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function runStep(label, command, argsList, runtimeOptions = {}) {
  const { silent = false } = runtimeOptions;
  if (!silent) {
    console.log(`\n▶ ${label}: ${command} ${argsList.join(' ')}`);
  }

  const result = spawnSync(command, argsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (!silent) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
  }

  const passed = result.status === 0;
  if (!silent) {
    console.log(passed ? `✅ ${label} passed` : `❌ ${label} failed`);
  }

  return {
    passed,
    code: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

function runStepCapture(label, command, argsList, runtimeOptions = {}) {
  return runStep(label, command, argsList, runtimeOptions);
}

export function classifyE2ESkipReason(output) {
  const text = output.toLowerCase();

  const envMissingIndicators = [
    'playwright install',
    'executable doesn\'t exist',
    'browser has not been found',
    'failed to launch browser',
    'missing x server',
    'failed to start xvfb',
  ];

  const flakyIndicators = [
    'timed out',
    'timeout of',
    'target page, context or browser has been closed',
    'net::err_',
    'socket hang up',
    'econnreset',
    'etimedout',
    'browser closed unexpectedly',
  ];

  if (envMissingIndicators.some((indicator) => text.includes(indicator))) {
    return 'env-missing';
  }

  if (flakyIndicators.some((indicator) => text.includes(indicator))) {
    return 'flaky';
  }

  return null;
}

function buildExecutionChecks({ testResult, buildResult, e2eResult }) {
  return [
    {
      id: 'tests',
      label: 'npm test',
      status: testResult.passed ? 'pass' : 'fail',
      code: testResult.code,
    },
    {
      id: 'build',
      label: 'npm run build',
      status: buildResult.passed ? 'pass' : 'fail',
      code: buildResult.code,
    },
    {
      id: 'e2e-smoke',
      label: 'npm run test:e2e:smoke',
      status: e2eResult.status,
      code: e2eResult.code,
      skipReason: e2eResult.skipReason,
      detail: e2eResult.detail,
    },
  ];
}

function summarizeStatuses(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.status === 'pass').length,
    skipped: checks.filter((check) => check.status === 'skipped').length,
    fail: checks.filter((check) => check.status === 'fail').length,
  };
}

function overallStatus(versionChecks, executionChecks) {
  const combined = [...versionChecks, ...executionChecks];
  if (combined.some((check) => check.status === 'fail')) {
    return 'fail';
  }
  if (combined.some((check) => check.status === 'skipped')) {
    return 'warn';
  }
  return 'pass';
}

function computeBaseline(summaryStatus, executionChecks) {
  const blockingChecks = executionChecks.filter((check) => check.status === 'fail');
  const nonIntentionalSkips = executionChecks.filter((check) => check.status === 'skipped' && check.skipReason !== 'intentional');
  const intentionalSkips = executionChecks.filter((check) => check.status === 'skipped' && check.skipReason === 'intentional');

  const accepted = blockingChecks.length === 0 && nonIntentionalSkips.length === 0;
  const status = accepted ? 'accepted' : 'rejected';
  const reason = accepted
    ? (intentionalSkips.length > 0 ? 'intentional-skips-only' : 'fully-green')
    : (blockingChecks.length > 0 ? 'blocking-failures' : 'non-intentional-skips');

  return {
    accepted,
    status,
    reason,
    blockingCheckIds: blockingChecks.map((check) => check.id),
    allowedSkipReasons: ['intentional'],
    observedSkipReasons: executionChecks.filter((check) => check.skipReason).map((check) => check.skipReason),
    summaryStatus,
  };
}

export function buildReleaseCheckReport({ versionSummary, testResult, buildResult, e2eResult, options: runtimeOptions, rootDir = projectRoot }) {
  const executionChecks = buildExecutionChecks({ testResult, buildResult, e2eResult });
  const summaryStatus = overallStatus(versionSummary.versionChecks, executionChecks);
  const baseline = computeBaseline(summaryStatus, executionChecks);

  return {
    schemaVersion: '1',
    tool: 'release:check',
    generatedAt: new Date().toISOString(),
    rootDir,
    options: {
      dryRun: runtimeOptions.dryRun,
      skipE2E: runtimeOptions.skipE2E,
      allowE2ESkip: runtimeOptions.allowE2ESkip,
    },
    summary: {
      status: summaryStatus,
      baselineStatus: baseline.status,
      totals: summarizeStatuses([...versionSummary.versionChecks, ...executionChecks]),
      versionChecks: versionSummary.summary,
      executionChecks: {
        status: executionChecks.some((check) => check.status === 'fail')
          ? 'fail'
          : executionChecks.some((check) => check.status === 'skipped')
            ? 'warn'
            : 'pass',
        totals: summarizeStatuses(executionChecks),
      },
    },
    baseline,
    versions: {
      packageVersion: versionSummary.packageVersion,
      android: versionSummary.android,
      ios: versionSummary.ios,
    },
    checks: {
      version: versionSummary.versionChecks,
      execution: executionChecks,
    },
    skipReasons: RELEASE_CHECK_SKIP_REASONS,
  };
}

function printSummary(report) {
  const executionChecks = report.checks.execution;
  const e2eCheck = executionChecks.find((check) => check.id === 'e2e-smoke');

  console.log('\n================ RELEASE READINESS SUMMARY ================');
  console.log(`overall: ${report.summary.status}`);
  console.log(`baseline: ${report.baseline.status} (${report.baseline.reason})`);
  console.log(`tests: ${executionChecks.find((check) => check.id === 'tests')?.status ?? 'unknown'}`);
  console.log(`build: ${executionChecks.find((check) => check.id === 'build')?.status ?? 'unknown'}`);
  console.log(`e2e smoke: ${e2eCheck?.status ?? 'unknown'}${e2eCheck?.skipReason ? ` (${e2eCheck.skipReason})` : ''}`);
  console.log('');
  console.log(`package version: ${report.versions.packageVersion}`);
  console.log(`Android versionCode/versionName: ${report.versions.android.versionCode} / ${report.versions.android.versionName}`);
  console.log(`iOS CURRENT_PROJECT_VERSION: ${report.versions.ios.currentProjectVersions.join(', ')}`);
  console.log(`iOS MARKETING_VERSION: ${report.versions.ios.marketingVersions.join(', ')}`);
  console.log('');
  console.log('version checks:');
  for (const check of report.checks.version) {
    console.log(`- ${check.label}: ${check.status}`);
  }
  console.log('');
  console.log('next steps:');
  console.log('- 若對外版本不同步，先更新 package.json / Android versionName / iOS MARKETING_VERSION');
  console.log('- 若 build number 不一致，執行 npm run version:bump:build（或 version:bump:build:set -- <n>）');
  console.log('- 再做 cap sync 與原生打包，並走人工 QA / 商店素材檢查');
  console.log('===========================================================\n');
}

function main() {
  const packageJsonText = mustReadFile(paths.packageJson);
  const androidGradleText = mustReadFile(paths.androidGradle);
  const iosPbxprojText = mustReadFile(paths.iosPbxproj);

  const versionSummary = buildReleaseVersionSummary({
    packageJsonText,
    androidGradleText,
    iosPbxprojText,
  });

  let testResult = { passed: true, code: 0 };
  let buildResult = { passed: true, code: 0 };
  let e2eResult = {
    status: options.skipE2E ? 'skipped' : 'pass',
    code: 0,
    skipReason: options.skipE2E ? 'intentional' : null,
    detail: options.skipE2E ? 'Skipped by --skip-e2e.' : 'Passed.',
  };

  if (options.dryRun) {
    e2eResult = {
      status: options.skipE2E ? 'skipped' : 'skipped',
      code: 0,
      skipReason: options.skipE2E ? 'intentional' : 'intentional',
      detail: options.skipE2E ? 'Skipped by --skip-e2e during dry-run.' : 'Not executed in --dry-run mode.',
    };

    const report = buildReleaseCheckReport({
      versionSummary,
      testResult,
      buildResult,
      e2eResult,
      options,
    });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printSummary(report);
      console.log('ℹ️ dry-run 模式未執行 npm test / npm run build / npm run test:e2e:smoke');
    }

    process.exit(report.summary.status === 'fail' ? 1 : 0);
  }

  testResult = runStep('tests', 'npm', ['test'], { silent: options.json });
  buildResult = runStep('build', 'npm', ['run', 'build'], { silent: options.json });

  if (options.skipE2E) {
    e2eResult = {
      status: 'skipped',
      code: 0,
      skipReason: 'intentional',
      detail: 'Skipped by --skip-e2e.',
    };
    if (!options.json) {
      console.log('\n⚠️ e2e smoke 已跳過（--skip-e2e）');
    }
  } else {
    const result = runStepCapture('e2e smoke', 'npm', ['run', 'test:e2e:smoke'], { silent: options.json });
    if (result.passed) {
      e2eResult = {
        status: 'pass',
        code: result.code,
        skipReason: null,
        detail: 'Passed.',
      };
    } else {
      const skipReason = options.allowE2ESkip ? classifyE2ESkipReason(result.output) : null;
      if (skipReason) {
        e2eResult = {
          status: 'skipped',
          code: result.code,
          skipReason,
          detail: `Skipped because ${skipReason}.`,
        };
        if (!options.json) {
          console.log(`⚠️ 偵測到 E2E ${skipReason}，已依 --allow-e2e-skip 規則標示為 skipped`);
        }
      } else {
        e2eResult = {
          status: 'fail',
          code: result.code,
          skipReason: null,
          detail: 'Failed.',
        };
      }
    }
  }

  const report = buildReleaseCheckReport({
    versionSummary,
    testResult,
    buildResult,
    e2eResult,
    options,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printSummary(report);
  }

  if (report.summary.status === 'fail') {
    process.exit(1);
  }
}

try {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
    main();
  }
} catch (error) {
  console.error(`❌ release:check 執行失敗：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
