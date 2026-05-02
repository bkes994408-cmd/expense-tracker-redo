export const RELEASE_CHECK_SKIP_REASONS = ['env-missing', 'flaky', 'intentional'];

const VERSION_CHECK_DEFINITIONS = [
  {
    id: 'package-vs-android-version-name',
    label: 'package.json version == Android versionName',
    evaluate: ({ packageVersion, android }) => packageVersion === android.versionName,
    expected: ({ packageVersion }) => packageVersion,
    actual: ({ android }) => android.versionName,
  },
  {
    id: 'package-vs-ios-marketing-version',
    label: 'package.json version == iOS MARKETING_VERSION',
    evaluate: ({ packageVersion, ios }) => ios.hasConsistentMarketingVersion && packageVersion === ios.marketingVersion,
    expected: ({ packageVersion }) => packageVersion,
    actual: ({ ios }) => ios.marketingVersions,
  },
  {
    id: 'ios-marketing-version-consistency',
    label: 'iOS MARKETING_VERSION internal consistency',
    evaluate: ({ ios }) => ios.hasConsistentMarketingVersion,
    expected: ({ ios }) => ios.marketingVersion,
    actual: ({ ios }) => ios.marketingVersions,
  },
  {
    id: 'ios-build-number-consistency',
    label: 'iOS CURRENT_PROJECT_VERSION internal consistency',
    evaluate: ({ ios }) => ios.hasConsistentBuildNumber,
    expected: ({ ios }) => ios.currentProjectVersion,
    actual: ({ ios }) => ios.currentProjectVersions,
  },
  {
    id: 'android-vs-ios-build-number',
    label: 'Android versionCode == iOS CURRENT_PROJECT_VERSION',
    evaluate: ({ android, ios }) => ios.hasConsistentBuildNumber && android.versionCode === ios.currentProjectVersion,
    expected: ({ android }) => android.versionCode,
    actual: ({ ios }) => ios.currentProjectVersions,
  },
];

function summarizeStatuses(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.status === 'pass').length,
    skipped: checks.filter((check) => check.status === 'skipped').length,
    fail: checks.filter((check) => check.status === 'fail').length,
  };
}

function overallStatus(checks) {
  if (checks.some((check) => check.status === 'fail')) {
    return 'fail';
  }
  if (checks.some((check) => check.status === 'skipped')) {
    return 'warn';
  }
  return 'pass';
}

export function parsePackageVersion(packageJsonText) {
  const packageJson = JSON.parse(packageJsonText);
  const version = packageJson?.version;

  if (!version || typeof version !== 'string') {
    throw new Error('package.json 缺少 version');
  }

  return version;
}

export function parseAndroidVersionInfo(androidGradleText) {
  const versionCodeMatch = androidGradleText.match(/versionCode\s+(\d+)/);
  const versionNameMatch = androidGradleText.match(/versionName\s+"([^"]+)"/);

  if (!versionCodeMatch) {
    throw new Error('找不到 Android versionCode');
  }
  if (!versionNameMatch) {
    throw new Error('找不到 Android versionName');
  }

  return {
    versionCode: Number.parseInt(versionCodeMatch[1], 10),
    versionName: versionNameMatch[1],
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function parseIosVersionInfo(iosPbxprojText) {
  const marketingMatches = [...iosPbxprojText.matchAll(/MARKETING_VERSION\s*=\s*([^;]+);/g)].map((m) => m[1].trim());
  const buildMatches = [...iosPbxprojText.matchAll(/CURRENT_PROJECT_VERSION\s*=\s*(\d+)\s*;/g)].map((m) => Number.parseInt(m[1], 10));

  if (marketingMatches.length === 0) {
    throw new Error('找不到 iOS MARKETING_VERSION');
  }
  if (buildMatches.length === 0) {
    throw new Error('找不到 iOS CURRENT_PROJECT_VERSION');
  }

  const marketingVersions = uniqueSorted(marketingMatches);
  const currentProjectVersions = uniqueSorted(buildMatches);

  return {
    marketingVersions,
    currentProjectVersions,
    marketingVersion: marketingVersions[0],
    currentProjectVersion: currentProjectVersions[0],
    hasConsistentMarketingVersion: marketingVersions.length === 1,
    hasConsistentBuildNumber: currentProjectVersions.length === 1,
  };
}

export function buildReleaseVersionSummary({ packageJsonText, androidGradleText, iosPbxprojText }) {
  const packageVersion = parsePackageVersion(packageJsonText);
  const android = parseAndroidVersionInfo(androidGradleText);
  const ios = parseIosVersionInfo(iosPbxprojText);

  const context = { packageVersion, android, ios };
  const versionChecks = VERSION_CHECK_DEFINITIONS.map((definition) => {
    const passed = definition.evaluate(context);
    return {
      id: definition.id,
      label: definition.label,
      status: passed ? 'pass' : 'fail',
      expected: definition.expected(context),
      actual: definition.actual(context),
    };
  });

  const checks = {
    packageVsAndroidVersionName: versionChecks[0].status === 'pass',
    packageVsIosMarketingVersion: versionChecks[1].status === 'pass',
    iosMarketingInternallyConsistent: versionChecks[2].status === 'pass',
    iosBuildInternallyConsistent: versionChecks[3].status === 'pass',
    androidVsIosBuildNumber: versionChecks[4].status === 'pass',
  };

  return {
    packageVersion,
    android,
    ios,
    checks,
    versionChecks,
    summary: {
      status: overallStatus(versionChecks),
      totals: summarizeStatuses(versionChecks),
    },
    allVersionChecksPassed: versionChecks.every((check) => check.status === 'pass'),
  };
}
