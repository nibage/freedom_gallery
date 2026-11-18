// Safely prune only source branches of merged PRs, never unmerged work.
// Runs under a short-lived GitHub Actions token; no secrets or user data stored.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function shouldDelete(pr, branch, openHeads, repository) {
  const name = pr?.head?.ref;
  if (!pr?.merged_at || pr?.base?.ref !== 'main') return false;
  if (pr?.head?.repo?.full_name !== repository) return false;
  if (typeof name !== 'string' || !/^(feature|fix|docs)\//.test(name)) return false;
  if (name === 'main' || name.startsWith('main/')) return false;
  if (!branch || branch.name !== name || branch.protected) return false;
  if (openHeads.has(name)) return false;
  // A branch updated/reused since merging must NOT be deleted.
  return branch.commit?.sha === pr.head.sha;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  if (!repo || !token || !/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw Error('GITHUB_REPOSITORY and GH_TOKEN are required');

  async function request(path, method = 'GET') {
    const response = await fetch('https://api.github.com' + path, {
      method, headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'freedom-gallery-branch-cleanup'
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw Error(method + ' ' + path + ': GitHub HTTP ' + response.status);
    return response.status === 204 ? true : response.json();
  }
  async function allPages(path) {
    const result = [];
    for (let page = 1; page <= 20; page++) {
      const batch = await request(path + (path.includes('?') ? '&' : '?') + 'per_page=100&page=' + page);
      if (!Array.isArray(batch)) throw Error('Unexpected GitHub collection ' + path);
      result.push(...batch);
      if (batch.length < 100) break;
    }
    return result;
  }

  const [branches, openPRs, closedPRs] = await Promise.all([
    allPages('/repos/' + repo + '/branches'),
    allPages('/repos/' + repo + '/pulls?state=open'),
    allPages('/repos/' + repo + '/pulls?state=closed')
  ]);
  const byName = new Map(branches.map(branch => [branch.name, branch]));
  const openHeads = new Set(openPRs
    .filter(pr => pr.head?.repo?.full_name === repo)
    .map(pr => pr.head.ref));
  const seen = new Set();
  let deleted = 0;
  for (const pr of closedPRs) {
    const name = pr.head?.ref;
    if (!name || seen.has(name) || !shouldDelete(pr, byName.get(name), openHeads, repo)) continue;
    seen.add(name);

    // Recheck the live SHA just before requesting deletion.
    const encoded = name.split('/').map(encodeURIComponent).join('/');
    const endpoint = '/repos/' + repo + '/git/refs/heads/' + encoded;
    const liveRef = await request(endpoint.replace('/git/refs/', '/git/ref/'));
    if (liveRef?.object?.sha !== pr.head.sha) {
      console.log('Skip updated branch:', name);
      continue;
    }
    const removed = await request(endpoint, 'DELETE');
    if (removed) {
      deleted++;
      console.log('Deleted merged branch:', name, '(PR #' + pr.number + ')');
    }
  }
  console.log('Merged branches deleted:', deleted, '| active/unmerged branches preserved');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
