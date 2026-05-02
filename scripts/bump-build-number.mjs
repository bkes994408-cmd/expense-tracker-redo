import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const androidGradlePath = path.join(projectRoot, 'android/app/build.gradle');
const iosPbxprojPath = path.join(projectRoot, 'ios/App/App.xcodeproj/project.pbxproj');

const args = process.argv.slice(2);
const setFlagIndex = args.indexOf('--set');
const explicitValue = setFlagIndex >= 0 ? Number.parseInt(args[setFlagIndex + 1] ?? '', 10) : null;

if (setFlagIndex >= 0 && (!Number.isFinite(explicitValue) || (explicitValue ?? 0) < 1)) {
  console.error('❌ --set 需要正整數，例如：npm run version:bump:build:set -- 12');
  process.exit(1);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 找不到檔案：${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

const androidBefore = readFile(androidGradlePath);
const iosBefore = readFile(iosPbxprojPath);

const androidMatch = androidBefore.match(/(versionCode\s+)(\d+)/);
if (!androidMatch) {
  console.error('❌ 找不到 Android versionCode');
  process.exit(1);
}

const iosMatches = [...iosBefore.matchAll(/(CURRENT_PROJECT_VERSION\s*=\s*)(\d+)(;)/g)];
if (iosMatches.length === 0) {
  console.error('❌ 找不到 iOS CURRENT_PROJECT_VERSION');
  process.exit(1);
}

const androidCurrent = Number.parseInt(androidMatch[2], 10);
const iosCurrent = Number.parseInt(iosMatches[0][2], 10);

if (!Number.isFinite(androidCurrent) || !Number.isFinite(iosCurrent)) {
  console.error('❌ 無法解析目前 build number');
  process.exit(1);
}

const nextValue = explicitValue ?? Math.max(androidCurrent, iosCurrent) + 1;

if (nextValue <= androidCurrent || nextValue <= iosCurrent) {
  console.error(`❌ 新 build number（${nextValue}）必須大於 Android(${androidCurrent}) 與 iOS(${iosCurrent})`);
  process.exit(1);
}

const androidAfter = androidBefore.replace(/(versionCode\s+)\d+/, `$1${nextValue}`);
const iosAfter = iosBefore.replace(/(CURRENT_PROJECT_VERSION\s*=\s*)\d+(;)/g, `$1${nextValue}$2`);

writeFile(androidGradlePath, androidAfter);
writeFile(iosPbxprojPath, iosAfter);

console.log(`✅ Build number 已更新為 ${nextValue}`);
console.log(`- Android versionCode: ${androidCurrent} -> ${nextValue}`);
console.log(`- iOS CURRENT_PROJECT_VERSION: ${iosCurrent} -> ${nextValue}`);
