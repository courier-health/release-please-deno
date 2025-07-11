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

import { Deno } from '../src/strategy/deno.ts'

import { beforeEach, describe, it } from 'jsr:@std/testing/bdd'
import { expect } from 'jsr:@std/expect'
import { assertRejects } from 'jsr:@std/assert'
import { stub } from 'jsr:@std/testing/mock'

import { assertHasUpdate, assertNoHasUpdate, buildGitHubFileContent, buildMockConventionalCommit } from './helpers.ts'
import { GitHub } from 'release-please'
import { Version } from 'release-please/build/src/version.js'
import { TagName } from 'release-please/build/src/util/tag-name.js'
import { PackageLockJson } from 'release-please/build/src/updaters/node/package-lock-json.js'
import { SamplesPackageJson } from 'release-please/build/src/updaters/node/samples-package-json.js'
import { Changelog } from 'release-please/build/src/updaters/changelog.js'
import { PackageJson } from 'release-please/build/src/updaters/node/package-json.js'
import { Errors } from 'release-please'

const fixturesPath = './test/fixtures'

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
