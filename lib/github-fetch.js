// lib/github-fetch.js
// Fetches top relevant files from a public GitHub repo for AI review.
//
// Usage:
//   import { fetchRepoFiles } from '@/lib/github-fetch';
//   const result = await fetchRepoFiles('https://github.com/owner/repo');
//   if (!result.ok) { console.error(result.error); return; }
//   // result.files = [{ path, content, sizeBytes }]
//   // result.repoMeta = { owner, name, defaultBranch, stars, ... }

const GITHUB_API = 'https://api.github.com';
const MAX_FILES = 20;
const MAX_TOTAL_CHARS = 200_000; // ~50K tokens — Claude can handle, won't blow cost
const FETCH_TIMEOUT_MS = 10_000;
const REQUEST_HEADERS = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'project-space-review-bot',
};

// ─────────────────────────────────────────────────────────────────
// 1. URL VALIDATION
// ─────────────────────────────────────────────────────────────────

/**
 * Parses a GitHub URL into { owner, repo }.
 * Accepts variations: with/without https://, with/without .git, with trailing slash.
 * Returns null if not a valid github.com URL.
 */
export function parseGithubUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace
  const trimmed = url.trim();

  // Must be github.com
  // Match: https://github.com/owner/repo, http://github.com/owner/repo, github.com/owner/repo
  // Allow .git suffix and trailing slash
  const match = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:\?.*)?(?:#.*)?$/i
  );

  if (!match) return null;

  const owner = match[1];
  const repo = match[2];

  // Sanity check — owner/repo can't contain weird stuff
  if (!owner || !repo || owner.length > 39 || repo.length > 100) return null;

  return { owner, repo };
}

// ─────────────────────────────────────────────────────────────────
// 2. FETCH WITH TIMEOUT
// ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. FILE PRIORITY (which files to include)
// ─────────────────────────────────────────────────────────────────

const ALWAYS_INCLUDE_PATTERNS = [
  /^README\.md$/i,
  /^README$/i,
  /^README\.txt$/i,
  /^package\.json$/,
  /^pubspec\.yaml$/,
  /^requirements\.txt$/,
  /^pom\.xml$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
  /^composer\.json$/,
  /^Gemfile$/,
];

const SKIP_PATTERNS = [
  /node_modules\//,
  /\.git\//,
  /^dist\//,
  /^build\//,
  /^out\//,
  /^\.next\//,
  /^\.nuxt\//,
  /^vendor\//,
  /^target\//,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.lock$/,
  /\.min\.(js|css)$/,
  /\.bundle\./,
  /\.map$/,
  /^\..+/, // hidden files like .env, .DS_Store
];

const SOURCE_EXTENSIONS = new Set([
  // JS/TS
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Python
  '.py',
  // Dart (Flutter)
  '.dart',
  // Java/Kotlin
  '.java', '.kt',
  // Go
  '.go',
  // Rust
  '.rs',
  // Ruby
  '.rb',
  // PHP
  '.php',
  // C/C++
  '.c', '.cpp', '.cc', '.h', '.hpp',
  // VLSI / Hardware
  '.v', '.sv', '.vhd', '.vhdl',
  // Config / definition
  '.yaml', '.yml', '.toml',
  // ServiceNow / scripted REST
  '.xml',
  // Notebooks
  '.ipynb',
  // SQL
  '.sql',
]);

const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so',
  '.mp3', '.mp4', '.wav', '.mov',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
]);

function shouldSkipPath(path) {
  for (const re of SKIP_PATTERNS) {
    if (re.test(path)) return true;
  }
  // Skip by extension
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')).toLowerCase() : '';
  if (SKIP_EXTENSIONS.has(ext)) return true;
  return false;
}

function isAlwaysInclude(path) {
  return ALWAYS_INCLUDE_PATTERNS.some((re) => re.test(path));
}

function isSourceFile(path) {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')).toLowerCase() : '';
  return SOURCE_EXTENSIONS.has(ext);
}

// ─────────────────────────────────────────────────────────────────
// 4. MAIN FETCH FUNCTION
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch top-N relevant files from a public GitHub repo.
 *
 * @param {string} url - GitHub URL
 * @returns {Promise<{ok: boolean, error?: string, files?: Array, repoMeta?: object}>}
 */
export async function fetchRepoFiles(url) {
  // 1. Parse URL
  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return { ok: false, error: 'Invalid GitHub URL. Expected format: https://github.com/owner/repo' };
  }

  const { owner, repo } = parsed;

  try {
    // 2. Fetch repo metadata (gets default branch, checks if exists/public)
    const repoRes = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}`,
      { headers: REQUEST_HEADERS }
    );

    if (repoRes.status === 404) {
      return { ok: false, error: `Repository ${owner}/${repo} not found or is private. Make sure it's public.` };
    }
    if (repoRes.status === 403) {
      return { ok: false, error: 'GitHub API rate limit exceeded. Try again in a few minutes.' };
    }
    if (!repoRes.ok) {
      return { ok: false, error: `GitHub API error: ${repoRes.status}` };
    }

    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // 3. Fetch full file tree (recursive)
    const treeRes = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers: REQUEST_HEADERS }
    );

    if (!treeRes.ok) {
      return { ok: false, error: `Failed to fetch repo file tree: ${treeRes.status}` };
    }

    const treeData = await treeRes.json();
    const allEntries = (treeData.tree || []).filter((e) => e.type === 'blob');

    if (treeData.truncated) {
      console.warn(`[github-fetch] Tree truncated for ${owner}/${repo} — repo has too many files`);
    }

    // 4. Filter + prioritize
    const candidates = [];
    for (const entry of allEntries) {
      if (shouldSkipPath(entry.path)) continue;

      let priority;
      if (isAlwaysInclude(entry.path)) {
        priority = 100; // top priority
      } else if (isSourceFile(entry.path)) {
        // priority by file size — bigger source files generally more representative
        // but cap at reasonable size
        const size = entry.size || 0;
        if (size > 100_000) priority = 0; // too big, skip
        else if (size < 100) priority = 5; // too small, low priority
        else priority = 10 + Math.min(50, size / 1000); // 10-60 priority by size
      } else {
        continue; // skip everything else
      }

      candidates.push({ ...entry, priority });
    }

    // 5. Sort by priority desc, take top MAX_FILES
    candidates.sort((a, b) => b.priority - a.priority);
    const selected = candidates.slice(0, MAX_FILES);

    if (selected.length === 0) {
      return { ok: false, error: 'No relevant source files found in repo.' };
    }

    // 6. Fetch each file's content (in parallel, with limits)
    const files = [];
    let totalChars = 0;

    const fetchFile = async (entry) => {
      try {
        const fileRes = await fetchWithTimeout(
          `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${entry.path}`,
          {},
          FETCH_TIMEOUT_MS
        );
        if (!fileRes.ok) return null;
        const content = await fileRes.text();
        return { path: entry.path, content, sizeBytes: content.length };
      } catch (e) {
        console.error(`[github-fetch] Failed to fetch ${entry.path}:`, e?.message);
        return null;
      }
    };

    // Fetch up to 5 files in parallel, but stop when we hit char limit
    for (let i = 0; i < selected.length; i += 5) {
      const batch = selected.slice(i, i + 5);
      const results = await Promise.all(batch.map(fetchFile));
      for (const file of results) {
        if (!file) continue;
        if (totalChars + file.content.length > MAX_TOTAL_CHARS) {
          // truncate this file to fit
          const remaining = MAX_TOTAL_CHARS - totalChars;
          if (remaining > 200) {
            files.push({
              ...file,
              content: file.content.slice(0, remaining) + '\n\n... [truncated]',
              truncated: true,
            });
            totalChars = MAX_TOTAL_CHARS;
          }
          break;
        }
        files.push(file);
        totalChars += file.content.length;
      }
      if (totalChars >= MAX_TOTAL_CHARS) break;
    }

    if (files.length === 0) {
      return { ok: false, error: 'Could not fetch any file content from repo.' };
    }

    return {
      ok: true,
      files,
      repoMeta: {
        owner,
        name: repo,
        full_name: repoData.full_name,
        description: repoData.description,
        defaultBranch,
        stars: repoData.stargazers_count,
        size_kb: repoData.size,
        language: repoData.language,
        created_at: repoData.created_at,
        pushed_at: repoData.pushed_at,
        is_private: repoData.private,
        url: repoData.html_url,
      },
      stats: {
        files_fetched: files.length,
        total_chars: totalChars,
        approx_tokens: Math.ceil(totalChars / 4),
      },
    };
  } catch (err) {
    console.error('[github-fetch]', err);
    return { ok: false, error: `Fetch failed: ${err.message || 'unknown error'}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 5. CONVENIENCE: validate URL only (for form submit pre-check)
// ─────────────────────────────────────────────────────────────────

/**
 * Quick validation: just verifies the URL is reachable and public.
 * Used at form submit time to fail fast if URL is bad.
 *
 * @param {string} url
 * @returns {Promise<{ok: boolean, error?: string, repoMeta?: object}>}
 */
export async function validateRepoUrl(url) {
  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return { ok: false, error: 'Invalid GitHub URL format. Use: https://github.com/owner/repo' };
  }

  const { owner, repo } = parsed;

  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}`,
      { headers: REQUEST_HEADERS },
      5000
    );

    if (res.status === 404) {
      return { ok: false, error: `Repository not found or is private. Use a public GitHub repo.` };
    }
    if (res.status === 403) {
      return { ok: false, error: 'GitHub rate limit hit. Try again in a few minutes.' };
    }
    if (!res.ok) {
      return { ok: false, error: `GitHub API returned ${res.status}` };
    }

    const data = await res.json();
    if (data.private) {
      return { ok: false, error: 'Private repos are not allowed. Make your repo public first.' };
    }

    return {
      ok: true,
      repoMeta: {
        owner,
        name: repo,
        full_name: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        language: data.language,
      },
    };
  } catch (err) {
    return { ok: false, error: `Validation failed: ${err.message || 'network error'}` };
  }
}