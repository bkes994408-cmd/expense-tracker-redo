import { describe, expect, it } from 'vitest';
// @ts-expect-error 測試直接驗證 scripts helper（不提供型別宣告）
import { parseAndroidVersionInfo, parseIosVersionInfo, buildReleaseVersionSummary } from '../../scripts/release-check-helpers.mjs';
// @ts-expect-error 測試直接驗證 scripts cli helper（不提供型別宣告）
import { buildReleaseCheckReport, classifyE2ESkipReason } from '../../scripts/release-check.mjs';

describe('release-check-helpers', () => {
  it('can parse Android and iOS versions and report all checks passed', () => {
    const packageJsonText = JSON.stringify({ version: '1.2.3' });
    const androidGradleText = `
      defaultConfig {
        versionCode 9
        versionName "1.2.3"
      }
    `;
    const iosPbxprojText = `
      MARKETING_VERSION = 1.2.3;
      MARKETING_VERSION = 1.2.3;
      CURRENT_PROJECT_VERSION = 9;
      CURRENT_PROJECT_VERSION = 9;
    `;

    const summary = buildReleaseVersionSummary({ packageJsonText, androidGradleText, iosPbxprojText });

    expect(summary.packageVersion).toBe('1.2.3');
    expect(summary.android.versionCode).toBe(9);
    expect(summary.android.versionName).toBe('1.2.3');
    expect(summary.ios.marketingVersions).toEqual(['1.2.3']);
    expect(summary.ios.currentProjectVersions).toEqual([9]);
    expect(summary.allVersionChecksPassed).toBe(true);
    expect(summary.summary.status).toBe('pass');
    expect(summary.versionChecks).toHaveLength(5);
  });

  it('detects iOS marketing/build inconsistency', () => {
    const ios = parseIosVersionInfo(`
      MARKETING_VERSION = 1.0.0;
      MARKETING_VERSION = 1.0.1;
      CURRENT_PROJECT_VERSION = 10;
      CURRENT_PROJECT_VERSION = 11;
    `);

    expect(ios.hasConsistentMarketingVersion).toBe(false);
    expect(ios.hasConsistentBuildNumber).toBe(false);
    expect(ios.marketingVersions).toEqual(['1.0.0', '1.0.1']);
    expect(ios.currentProjectVersions).toEqual([10, 11]);
  });

  it('throws when Android version fields are missing', () => {
    expect(() => parseAndroidVersionInfo('defaultConfig { versionName "1.0.0" }')).toThrow('找不到 Android versionCode');
    expect(() => parseAndroidVersionInfo('defaultConfig { versionCode 1 }')).toThrow('找不到 Android versionName');
  });

  it('classifies e2e skip reasons with standardized enums', () => {
    expect(classifyE2ESkipReason('Please run npx playwright install chromium')).toBe('env-missing');
    expect(classifyE2ESkipReason('Executable doesn\'t exist and failed to launch browser')).toBe('env-missing');
    expect(classifyE2ESkipReason('Test timed out after 30000ms and browser closed unexpectedly')).toBe('flaky');
    expect(classifyE2ESkipReason('socket hang up / ECONNRESET while opening page')).toBe('flaky');
    expect(classifyE2ESkipReason('Assertion failed')).toBeNull();
  });

  it('builds stable machine-readable report output', () => {
    const versionSummary = buildReleaseVersionSummary({
      packageJsonText: JSON.stringify({ version: '1.2.3' }),
      androidGradleText: 'versionCode 9\nversionName "1.2.3"',
      iosPbxprojText: 'MARKETING_VERSION = 1.2.3;\nCURRENT_PROJECT_VERSION = 9;',
    });

    const report = buildReleaseCheckReport({
      versionSummary,
      testResult: { passed: true, code: 0 },
      buildResult: { passed: true, code: 0 },
      e2eResult: {
        status: 'skipped',
        code: 0,
        skipReason: 'intentional',
        detail: 'Skipped by --skip-e2e.',
      },
      options: {
        dryRun: false,
        skipE2E: true,
        allowE2ESkip: false,
      },
      rootDir: '/tmp/expense-tracker-redo',
    });

    expect(report.schemaVersion).toBe('1');
    expect(report.tool).toBe('release:check');
    expect(report.summary.status).toBe('warn');
    expect(report.summary.baselineStatus).toBe('accepted');
    expect(report.summary.versionChecks.status).toBe('pass');
    expect(report.checks.version).toHaveLength(5);
    expect(report.checks.execution[2].skipReason).toBe('intentional');
    expect(report.baseline.accepted).toBe(true);
    expect(report.baseline.reason).toBe('intentional-skips-only');
    expect(report.skipReasons).toEqual(['env-missing', 'flaky', 'intentional']);
  });

  it('rejects baseline when skip reason is non-intentional', () => {
    const versionSummary = buildReleaseVersionSummary({
      packageJsonText: JSON.stringify({ version: '1.2.3' }),
      androidGradleText: 'versionCode 9\nversionName "1.2.3"',
      iosPbxprojText: 'MARKETING_VERSION = 1.2.3;\nCURRENT_PROJECT_VERSION = 9;',
    });

    const report = buildReleaseCheckReport({
      versionSummary,
      testResult: { passed: true, code: 0 },
      buildResult: { passed: true, code: 0 },
      e2eResult: {
        status: 'skipped',
        code: 1,
        skipReason: 'env-missing',
        detail: 'Skipped because env-missing.',
      },
      options: {
        dryRun: false,
        skipE2E: false,
        allowE2ESkip: true,
      },
      rootDir: '/tmp/expense-tracker-redo',
    });

    expect(report.summary.status).toBe('warn');
    expect(report.summary.baselineStatus).toBe('rejected');
    expect(report.baseline.accepted).toBe(false);
    expect(report.baseline.reason).toBe('non-intentional-skips');
  });
});
