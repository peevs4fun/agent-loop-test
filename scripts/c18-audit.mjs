#!/usr/bin/env node

/**
 * /usr/local/libexec/lib/c18-audit.mjs
 * C-18 防测试篡改与范围越界审计器 (Node.js 22 Built-in only)
 *
 * 违规退出码: 42 (ERR_TEST_TAMPERING)
 * 正常退出码: 0
 */

import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHEAT_PATTERNS = [
  { name: 'SKIP_ONLY_METHOD', regex: /\b(it|test|describe|suite)\.(skip|only|todo)\s*\(/ },
  { name: 'X_OR_FIT_METHOD', regex: /\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(/ },
  { name: 'SKIP_OPTION_OBJECT', regex: /\{\s*skip\s*:\s*true\b/ },
  { name: 'TEST_CONTEXT_SKIP', regex: /\bt\.skip\s*\(/ },
];

const AUTO_CLOSE_REGEX = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#\d+\b/i;

function runGit(repoDir, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoDir,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (err) {
    if (allowFail) return null;
    const msg = (err.stderr || err.message || '').trim();
    throw new Error(`git ${args.join(' ')} failed: ${msg}`);
  }
}

function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isTestFile(p) {
  const norm = normalizePath(p);
  if (/^tests?\//i.test(norm)) return true;
  if (/(^|\/)(__tests__\/.*|.*\.(test|spec)\.[cm]?[jt]sx?)$/i.test(norm)) return true;
  return false;
}

function isGovernanceFile(p) {
  const norm = normalizePath(p);
  if (norm === '.github' || norm.startsWith('.github/')) return true;
  if (norm === 'scripts/c18-audit.mjs') return true;
  if (norm === 'AGENTS.md') return true;
  return false;
}

function fileExistsInRef(repoDir, ref, filePath) {
  const norm = normalizePath(filePath);
  const res = runGit(repoDir, ['cat-file', '-e', `${ref}:${norm}`], { allowFail: true });
  return res !== null;
}

function getChangedFiles(repoDir, baseRef, headRef) {
  const filesMap = new Map(); // normalizedPath -> { status, oldPath, rawPath }

  const parseNameStatusZ = (raw) => {
    if (!raw) return;
    const tokens = raw.split('\0');
    let i = 0;
    while (i < tokens.length) {
      const statusToken = tokens[i++];
      if (!statusToken) break;
      const statusCode = statusToken[0];
      if (statusCode === 'R' || statusCode === 'C') {
        const oldP = tokens[i++];
        const newP = tokens[i++];
        if (!newP) break;
        const normOld = normalizePath(oldP);
        const normNew = normalizePath(newP);
        filesMap.set(normNew, { status: statusCode, oldPath: normOld, rawPath: newP });
      } else {
        const fileP = tokens[i++];
        if (!fileP) break;
        const norm = normalizePath(fileP);
        filesMap.set(norm, { status: statusCode, oldPath: null, rawPath: fileP });
      }
    }
  };

  if (headRef) {
    let diffZ = runGit(repoDir, ['diff', '--name-status', '-z', `${baseRef}...${headRef}`], { allowFail: true });
    if (diffZ === null) {
      diffZ = runGit(repoDir, ['diff', '--name-status', '-z', `${baseRef}..${headRef}`]);
    }
    parseNameStatusZ(diffZ);
  } else {
    const diffZ = runGit(repoDir, ['diff', '--name-status', '-z', baseRef]);
    parseNameStatusZ(diffZ);

    const untrackedZ = runGit(repoDir, ['ls-files', '--others', '--exclude-standard', '-z']);
    if (untrackedZ) {
      for (const rawP of untrackedZ.split('\0')) {
        if (!rawP) continue;
        const norm = normalizePath(rawP);
        if (!filesMap.has(norm)) {
          filesMap.set(norm, { status: 'A', oldPath: null, rawPath: rawP });
        }
      }
    }
  }

  return filesMap;
}

function getAddedLinesForFile(repoDir, baseRef, headRef, normPath, rawPath, status) {
  if (status === 'D') return [];

  const fullPath = path.resolve(repoDir, rawPath || normPath);

  if (!headRef) {
    const inIndex = runGit(repoDir, ['ls-files', '--error-unmatch', rawPath || normPath], { allowFail: true });
    if (inIndex === null && fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        return content.split('\n');
      } catch {
        return [];
      }
    }
  }

  let diffOut;
  if (headRef) {
    diffOut = runGit(repoDir, ['diff', '-U0', `${baseRef}...${headRef}`, '--', rawPath || normPath], { allowFail: true });
    if (diffOut === null) {
      diffOut = runGit(repoDir, ['diff', '-U0', `${baseRef}..${headRef}`, '--', rawPath || normPath], { allowFail: true });
    }
  } else {
    diffOut = runGit(repoDir, ['diff', '-U0', baseRef, '--', rawPath || normPath], { allowFail: true });
  }

  const lines = [];
  if (!diffOut) return lines;
  for (const line of diffOut.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      lines.push(line.slice(1));
    }
  }
  return lines;
}

function checkPackageJson(repoDir, baseRef, headRef, normPath, rawPath, status, violations) {
  if (status === 'D') {
    violations.push({
      rule: 'PACKAGE_JSON_TAMPERED',
      file: normPath,
      detail: 'package.json was deleted'
    });
    return;
  }

  const baseRaw = runGit(repoDir, ['show', `${baseRef}:${rawPath || normPath}`], { allowFail: true });
  if (baseRaw === null) {
    return;
  }

  let basePkg;
  try {
    basePkg = JSON.parse(baseRaw);
  } catch {
    return;
  }

  let targetRaw;
  if (headRef) {
    targetRaw = runGit(repoDir, ['show', `${headRef}:${rawPath || normPath}`], { allowFail: true });
  } else {
    const fullPath = path.resolve(repoDir, rawPath || normPath);
    if (fs.existsSync(fullPath)) {
      try {
        targetRaw = fs.readFileSync(fullPath, 'utf8');
      } catch {
        targetRaw = null;
      }
    } else {
      targetRaw = null;
    }
  }

  if (targetRaw === null) {
    violations.push({
      rule: 'PACKAGE_JSON_TAMPERED',
      file: normPath,
      detail: 'package.json could not be read or was removed'
    });
    return;
  }

  let targetPkg;
  try {
    targetPkg = JSON.parse(targetRaw);
  } catch (e) {
    violations.push({
      rule: 'PACKAGE_JSON_TAMPERED',
      file: normPath,
      detail: `package.json is invalid JSON: ${e.message}`
    });
    return;
  }

  const baseScripts = (basePkg && typeof basePkg.scripts === 'object' && basePkg.scripts !== null) ? basePkg.scripts : {};
  const targetScripts = (targetPkg && typeof targetPkg.scripts === 'object' && targetPkg.scripts !== null) ? targetPkg.scripts : {};

  // 1. 严禁修改或删除 scripts.test, scripts.lint, scripts.typecheck, scripts.check
  const protectedScripts = ['test', 'lint', 'typecheck', 'check'];
  for (const key of protectedScripts) {
    if (Object.prototype.hasOwnProperty.call(baseScripts, key)) {
      if (!Object.prototype.hasOwnProperty.call(targetScripts, key)) {
        violations.push({
          rule: 'PACKAGE_JSON_SCRIPT_TAMPERED',
          file: normPath,
          detail: `Protected script '${key}' was removed`
        });
      } else if (String(targetScripts[key]).trim() !== String(baseScripts[key]).trim()) {
        violations.push({
          rule: 'PACKAGE_JSON_SCRIPT_TAMPERED',
          file: normPath,
          detail: `Protected script '${key}' was changed from '${baseScripts[key]}' to '${targetScripts[key]}'`
        });
      }
    }
  }

  // 2. 严禁新增 scripts.preinstall, scripts.install, scripts.postinstall, scripts.prepare 钩子
  const forbiddenHooks = ['preinstall', 'install', 'postinstall', 'prepare'];
  for (const hook of forbiddenHooks) {
    if (Object.prototype.hasOwnProperty.call(targetScripts, hook)) {
      if (!Object.prototype.hasOwnProperty.call(baseScripts, hook)) {
        violations.push({
          rule: 'PACKAGE_JSON_LIFECYCLE_HOOK_ADDED',
          file: normPath,
          detail: `Forbidden lifecycle hook '${hook}' was added`
        });
      } else if (String(targetScripts[hook]).trim() !== String(baseScripts[hook]).trim()) {
        violations.push({
          rule: 'PACKAGE_JSON_LIFECYCLE_HOOK_MODIFIED',
          file: normPath,
          detail: `Lifecycle hook '${hook}' was modified`
        });
      }
    }
  }
}

function checkAllowedPaths(normPath, oldPath, allowedPathsArg, violations) {
  if (allowedPathsArg === undefined || allowedPathsArg === null) return;
  const allowedList = allowedPathsArg.split(',').map(s => normalizePath(s.trim())).filter(Boolean);
  if (allowedList.length === 0) return;

  const matchOne = (p) => {
    if (!p) return true;
    const norm = normalizePath(p);
    for (const prefix of allowedList) {
      if (prefix.endsWith('/')) {
        if (norm.startsWith(prefix)) return true;
      } else {
        if (norm === prefix || norm.startsWith(prefix + '/')) return true;
      }
    }
    return false;
  };

  if (!matchOne(normPath)) {
    violations.push({
      rule: 'OUT_OF_SCOPE_FILE',
      file: normPath,
      detail: `File '${normPath}' is out of allowed paths: ${allowedList.join(', ')}`
    });
  }
  if (oldPath && !matchOne(oldPath)) {
    violations.push({
      rule: 'OUT_OF_SCOPE_FILE',
      file: oldPath,
      detail: `Source file '${oldPath}' before rename is out of allowed paths: ${allowedList.join(', ')}`
    });
  }
}

function checkAutoCloseKeywords(repoDir, baseRef, headRef, prText, prBodyFile, violations) {
  const checkText = (text, sourceDesc) => {
    if (!text) return;
    const match = text.match(AUTO_CLOSE_REGEX);
    if (match) {
      violations.push({
        rule: 'FORBIDDEN_AUTO_CLOSE_KEYWORD',
        file: sourceDesc,
        detail: `Found forbidden auto-close keyword '${match[0]}' in ${sourceDesc}. Use 'Refs #<num>' instead.`
      });
    }
  };

  if (prText) {
    checkText(prText, '--pr-text');
  }

  if (prBodyFile) {
    const fullBodyPath = path.resolve(repoDir, prBodyFile);
    if (fs.existsSync(fullBodyPath)) {
      try {
        const bodyContent = fs.readFileSync(fullBodyPath, 'utf8');
        checkText(bodyContent, `--pr-body-file (${prBodyFile})`);
      } catch (err) {
        violations.push({
          rule: 'PR_BODY_FILE_READ_ERROR',
          file: prBodyFile,
          detail: `Failed to read PR body file: ${err.message}`
        });
      }
    } else {
      violations.push({
        rule: 'PR_BODY_FILE_NOT_FOUND',
        file: prBodyFile,
        detail: `PR body file does not exist: ${prBodyFile}`
      });
    }
  }

  const targetRef = headRef || 'HEAD';
  const revCheck = runGit(repoDir, ['rev-parse', '--verify', targetRef], { allowFail: true });
  if (revCheck !== null) {
    const commitLogs = runGit(repoDir, ['log', `${baseRef}..${targetRef}`, '--format=%B'], { allowFail: true });
    if (commitLogs) {
      checkText(commitLogs, `commit messages (${baseRef}..${targetRef})`);
    }
  }
}

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'repo-dir': { type: 'string', default: '.' },
      'base-ref': { type: 'string' },
      'head-ref': { type: 'string' },
      'allow-test-modify': { type: 'boolean', default: false },
      'allow-governance-modify': { type: 'boolean', default: false },
      'allowed-paths': { type: 'string' },
      'pr-text': { type: 'string' },
      'pr-body-file': { type: 'string' },
      'allow-empty': { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  const baseRef = values['base-ref'];
  if (!baseRef) {
    const report = {
      ok: false,
      error_code: 'ERR_TEST_TAMPERING',
      violations: [{ rule: 'INVALID_ARGS', file: '', detail: 'Missing required option --base-ref' }]
    };
    console.log(JSON.stringify(report));
    process.exit(42);
  }

  const repoDir = path.resolve(values['repo-dir'] || '.');
  const headRef = values['head-ref'] || null;
  const allowTestModify = Boolean(values['allow-test-modify']);
  const allowGovModify = Boolean(values['allow-governance-modify']);
  const allowedPaths = values['allowed-paths'];
  const prText = values['pr-text'];
  const prBodyFile = values['pr-body-file'];
  const allowEmpty = Boolean(values['allow-empty']);

  const violations = [];

  let filesMap;
  try {
    filesMap = getChangedFiles(repoDir, baseRef, headRef);
  } catch (err) {
    const report = {
      ok: false,
      error_code: 'ERR_TEST_TAMPERING',
      violations: [{ rule: 'GIT_DIFF_ERROR', file: '', detail: err.message }]
    };
    console.log(JSON.stringify(report));
    process.exit(42);
  }

  if (filesMap.size === 0 && !allowEmpty) {
    violations.push({
      rule: 'EMPTY_CHANGES',
      file: '',
      detail: 'No file modifications detected between base-ref and head/worktree'
    });
  }

  for (const [normPath, fileInfo] of filesMap.entries()) {
    const { status, oldPath, rawPath } = fileInfo;

    // 规则 1: 工作流与门禁自篡改拦截
    if (!allowGovModify) {
      if (isGovernanceFile(normPath)) {
        violations.push({
          rule: 'WORKFLOW_OR_GOVERNANCE_TAMPERING',
          file: normPath,
          detail: `Modifying governance or workflow file '${normPath}' is strictly forbidden`
        });
      } else if (oldPath && isGovernanceFile(oldPath)) {
        violations.push({
          rule: 'WORKFLOW_OR_GOVERNANCE_TAMPERING',
          file: oldPath,
          detail: `Renaming governance or workflow file '${oldPath}' is strictly forbidden`
        });
      }
    }

    // 规则 5: 范围越界修改拦截
    checkAllowedPaths(normPath, oldPath, allowedPaths, violations);

    // 规则 2: package.json 脚本与生命周期篡改拦截
    if (normPath === 'package.json' || normPath.endsWith('/package.json')) {
      checkPackageJson(repoDir, baseRef, headRef, normPath, rawPath, status, violations);
    }

    // 规则 3: 存量测试文件篡改/删除拦截
    const normIsTest = isTestFile(normPath);
    const oldIsTest = oldPath ? isTestFile(oldPath) : false;

    if (!allowTestModify) {
      if (normIsTest && status !== 'A' && fileExistsInRef(repoDir, baseRef, normPath)) {
        violations.push({
          rule: 'EXISTING_TEST_TAMPERING',
          file: normPath,
          detail: `Modifying or deleting existing test file '${normPath}' (status=${status}) is forbidden without --allow-test-modify`
        });
      } else if (oldIsTest && fileExistsInRef(repoDir, baseRef, oldPath)) {
        violations.push({
          rule: 'EXISTING_TEST_TAMPERING',
          file: oldPath,
          detail: `Existing test file '${oldPath}' was renamed or moved without --allow-test-modify`
        });
      }
    }

    // 规则 4: 测试跳过/独享作弊原语拦截
    if (normIsTest && status !== 'D') {
      const addedLines = getAddedLinesForFile(repoDir, baseRef, headRef, normPath, rawPath, status);
      for (const line of addedLines) {
        for (const { name, regex } of CHEAT_PATTERNS) {
          if (regex.test(line)) {
            violations.push({
              rule: 'TEST_CHEAT_PRIMITIVE_FORBIDDEN',
              file: normPath,
              detail: `Forbidden test primitive [${name}] found in added line: "${line.trim()}"`
            });
          }
        }
      }
    }
  }

  // 规则 6: PR / Commit 自动关单关键词拦截
  checkAutoCloseKeywords(repoDir, baseRef, headRef, prText, prBodyFile, violations);

  if (violations.length > 0) {
    const report = {
      ok: false,
      error_code: 'ERR_TEST_TAMPERING',
      violations
    };
    console.log(JSON.stringify(report));
    process.exit(42);
  }

  const report = {
    ok: true,
    checked_files: Array.from(filesMap.keys()),
    violations: []
  };
  console.log(JSON.stringify(report));
  process.exit(0);
}

main();
