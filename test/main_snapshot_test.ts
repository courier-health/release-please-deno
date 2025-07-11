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
import { stub } from 'jsr:@std/testing/mock'

import { assertHasUpdate, buildGitHubFileContent, buildMockConventionalCommit } from './helpers.ts'
import { GitHub } from 'release-please'
import { Changelog } from 'release-please/build/src/updaters/changelog.js'
import { ChangelogJson } from 'release-please/build/src/updaters/changelog-json.js'
import { assertInlineSnapshot } from 'jsr:@std/testing/unstable-snapshot'

const fixturesPath = './test/fixtures'

const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g

describe('Deno', () => {
  let github: GitHub

  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'courier-health',
      repo: 'deno-test-repo',
      defaultBranch: 'main',
    })
  })

  it('updates changelog.json if present', async () => {
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
    assertInlineSnapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(UUID_REGEX, 'abc-123-efd-qwerty')
        .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'),
      `'{
  "entries": [
    {
      "changes": [
        {
          "type": "fix",
          "sha": "845db1381b3d5d20151cad2588f85feb",
          "message": "update dependency com.google.cloud:google-cloud-storage to v1.120.0",
          "issues": [],
          "scope": "deps"
        },
        {
          "type": "chore",
          "sha": "b3f8966b023b8f21ce127142aa91841c",
          "message": "update a very important dep",
          "issues": [],
          "breakingChangeNote": "update a very important dep"
        },
        {
          "type": "fix",
          "sha": "08ca01180a91c0a1ba8992b491db9212",
          "message": "update dependency com.google.cloud:google-cloud-spanner to v1.50.0",
          "issues": [],
          "scope": "deps"
        }
      ],
      "version": "1.0.0",
      "language": "JAVASCRIPT",
      "artifactName": "deno-test-repo",
      "id": "abc-123-efd-qwerty",
      "createTime": "2023-01-05T16:42:33.446Z"
    }
  ],
  "updateTime": "2023-01-05T16:42:33.446Z"
}'`,
    )
  })
})
