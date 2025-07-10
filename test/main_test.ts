// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: This test file was borrowed heavily from the release-please Node Strategy test file that at: https://github.com/googleapis/release-please/blob/d5f2ca8a2cf32701f1d87a85bbc37493b1db65c2/test/strategies/node.ts
// That file is licensed under the Apache License, Version 2.0 (the "License") and therefore this file is also licensed under the Apache License, Version 2.0.

import { Deno } from '../src/main.ts'

import { beforeEach, describe, it } from 'jsr:@std/testing/bdd'
import { expect } from 'jsr:@std/expect'
import { assertRejects } from 'jsr:@std/assert'
import { stub } from 'jsr:@std/testing/mock'
import { assertSnapshot } from 'jsr:@std/testing/snapshot'

import { assertHasUpdate, assertNoHasUpdate, buildGitHubFileContent, buildMockConventionalCommit } from './helpers.ts'
import { GitHub } from 'release-please'
import { Version } from 'release-please/build/src/version.js'
import { TagName } from 'release-please/build/src/util/tag-name.js'
import { PackageLockJson } from 'release-please/build/src/updaters/node/package-lock-json.js'
import { SamplesPackageJson } from 'release-please/build/src/updaters/node/samples-package-json.js'
import { Changelog } from 'release-please/build/src/updaters/changelog.js'
import { PackageJson } from 'release-please/build/src/updaters/node/package-json.js'
import { ChangelogJson } from 'release-please/build/src/updaters/changelog-json.js'
import { Errors } from 'release-please'

const fixturesPath = './test/fixtures'

const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g

describe('Deno', () => {
  let github: GitHub
  const commits = [
    ...buildMockConventionalCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
    ),
  ]

  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'courier-health',
      repo: 'deno-test-repo',
      defaultBranch: 'main',
    })
  })

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0'
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'deno-test-repo',
        packageName: 'deno-test-repo',
      })
      const latestRelease = undefined
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      expect(release!.version?.toString()).toEqual(expectedVersion)
    })

    it('builds a release pull request', async () => {
      const expectedVersion = '0.123.5'
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'deno-test-repo',
        packageName: 'deno-test-repo',
      })
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'some-deno-package'),
        sha: 'abc123',
        notes: 'some notes',
      }
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      expect(pullRequest!.version?.toString()).toEqual(expectedVersion)
    })

    it('detects a default component', async () => {
      const expectedVersion = '0.123.5'
      const strategy = new Deno({
        targetBranch: 'main',
        github,
      })
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
        ),
      ]
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'deno-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      }
      // deno-lint-ignore no-unused-vars
      using getFileContentsStub = stub(
        github,
        'getFileContentsOnBranch',
        // deno-lint-ignore require-await
        async (path: string, branch: string) => {
          if ((path === 'package.json' || path === 'deno.json' || path === 'deno.jsonc') && branch === 'main') {
            return buildGitHubFileContent(`${fixturesPath}/${path}`, path)
          }
          throw new Error(`Not implemented getFileContentsOnBranch(${path}, ${branch})`)
        },
      )
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      expect(pullRequest!.version?.toString()).toEqual(expectedVersion)
    })

    it('detects a default packageName', async () => {
      const expectedVersion = '0.123.5'
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'abc-123',
      })
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
        ),
      ]
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'deno-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      }
      // deno-lint-ignore no-unused-vars
      using getFileContentsStub = stub(
        github,
        'getFileContentsOnBranch',
        // deno-lint-ignore require-await
        async (path: string, branch: string) => {
          if ((path === 'package.json' || path === 'deno.json' || path === 'deno.jsonc') && branch === 'main') {
            return buildGitHubFileContent(`${fixturesPath}/${path}`, path)
          }
          throw new Error(`Not implemented getFileContentsOnBranch(${path}, ${branch})`)
        },
      )
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      expect(pullRequest!.version?.toString()).toEqual(expectedVersion)
    })

    it('handles missing package.json', async () => {
      // deno-lint-ignore no-unused-vars
      using getFileContentsStub = stub(
        github,
        'getFileContentsOnBranch',
        // deno-lint-ignore require-await no-unused-vars
        async (path: string, branch: string) => {
          throw new Errors.FileNotFoundError('stub/path')
        },
      )
      const strategy = new Deno({
        targetBranch: 'main',
        github,
      })
      const latestRelease = {
        tag: new TagName(Version.parse('1.23.4'), 'some-deno-package'),
        sha: 'abc123',
        notes: 'some notes',
      }
      await assertRejects(async () => {
        await strategy.buildReleasePullRequest(commits, latestRelease)
      }, Errors.MissingRequiredFileError)
    })

    it('updates changelog.json if present', async (t) => {
      const COMMITS = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
        ),
        ...buildMockConventionalCommit('chore: update deps'),
        ...buildMockConventionalCommit('chore!: update a very important dep'),
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0',
        ),
        ...buildMockConventionalCommit('chore: update common templates'),
      ]
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'google-cloud-deno',
      })
      // deno-lint-ignore no-unused-vars
      using findFilesByFilenameAndRefStub = stub(
        github,
        'findFilesByFilenameAndRef',
        // deno-lint-ignore require-await
        async () => [],
      )
      // deno-lint-ignore no-unused-vars
      using getFileContentsStub = stub(
        github,
        'getFileContentsOnBranch',
        // deno-lint-ignore require-await
        async (path: string, branch: string) => {
          if (path === 'changelog.json' && branch === 'main') {
            return buildGitHubFileContent(`${fixturesPath}/${path}/changelog.json`, 'changelog.json')
          }
          if ((path === 'package.json' || path === 'deno.json' || path === 'deno.jsonc') && branch === 'main') {
            return buildGitHubFileContent(`${fixturesPath}/${path}`, path)
          }
          throw new Error(`Not implemented getFileContentsOnBranch(${path}, ${branch})`)
        },
      )
      const latestRelease = undefined
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease,
      )
      const updates = release!.updates
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog)
      const update = assertHasUpdate(updates, 'changelog.json', ChangelogJson)
      const newContent = update.updater.updateContent(
        JSON.stringify({ entries: [] }),
      )
      assertSnapshot(
        t,
        newContent
          .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
          .replace(UUID_REGEX, 'abc-123-efd-qwerty')
          .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'),
      )
    })
  })

  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'deno-test-repo',
        packageName: 'deno-test-repo-pkg',
      })
      // deno-lint-ignore no-unused-vars
      using findFilesByFilenameAndRefStub = stub(
        github,
        'findFilesByFilenameAndRef',
        // deno-lint-ignore require-await
        async () => [],
      )
      const latestRelease = undefined
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      const updates = release!.updates
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog)
      assertHasUpdate(updates, 'package-lock.json', PackageLockJson)
      assertHasUpdate(updates, 'npm-shrinkwrap.json', PackageLockJson)
      const update = assertHasUpdate(
        updates,
        'samples/package.json',
        SamplesPackageJson,
      )
      const updater = update.updater as SamplesPackageJson
      expect(updater.packageName).toEqual('deno-test-repo-pkg')
      assertHasUpdate(updates, 'package.json', PackageJson)
    })

    it('omits changelog if skipChangelog=true', async () => {
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'deno-test-repo',
        packageName: 'deno-test-repo-pkg',
        skipChangelog: true,
      })
      // deno-lint-ignore no-unused-vars
      using findFilesByFilenameAndRefStub = stub(
        github,
        'findFilesByFilenameAndRef',
        // deno-lint-ignore require-await
        async () => [],
      )
      const latestRelease = undefined
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease,
      )
      const updates = release!.updates
      assertNoHasUpdate(updates, 'CHANGELOG.md')
      assertHasUpdate(updates, 'package-lock.json', PackageLockJson)
      assertHasUpdate(updates, 'npm-shrinkwrap.json', PackageLockJson)
      const update = assertHasUpdate(
        updates,
        'samples/package.json',
        SamplesPackageJson,
      )
      const updater = update.updater as SamplesPackageJson
      expect(updater.packageName).toEqual('deno-test-repo-pkg')
      assertHasUpdate(updates, 'package.json', PackageJson)
    })
  })
})
