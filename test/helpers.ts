// deno-lint-ignore-file no-explicit-any

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

// Note: This file was borrowed heavily from the release-please test helpers file at: https://github.com/googleapis/release-please/blob/d5f2ca8a2cf32701f1d87a85bbc37493b1db65c2/test/helpers.ts
// That file is licensed under the Apache License, Version 2.0 (the "License") and therefore this file is also licensed under the Apache License, Version 2.0.

import { type ConventionalCommit, parseConventionalCommits } from 'release-please/build/src/commit.js'
import crypto from 'node:crypto'
import { GitHubFileContents } from '@google-automations/git-file-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import { type Update } from 'release-please/build/src/update.js'
import { expect } from 'jsr:@std/expect'

const DEFAULT_FILE_MODE = '100644'

export function buildMockConventionalCommit(
  message: string,
  files: string[] = [],
): ConventionalCommit[] {
  return parseConventionalCommits([
    {
      // Ensure SHA is same on Windows with replace:
      sha: crypto
        .createHash('md5')
        .update(message.replace(/\r\n/g, '\n'))
        .digest('hex'),
      message,
      files: files,
    },
  ])
}

export function buildGitHubFileContent(
  fixturesPath: string,
  fixture: string,
): GitHubFileContents {
  return buildGitHubFileRaw(
    readFileSync(resolve(fixturesPath, fixture), 'utf8').replace(/\r\n/g, '\n'),
  )
}

export function buildGitHubFileRaw(content: string): GitHubFileContents {
  return {
    content: Buffer.from(content, 'utf8').toString('base64'),
    parsedContent: content,
    // fake a consistent sha
    sha: crypto.createHash('md5').update(content).digest('hex'),
    mode: DEFAULT_FILE_MODE,
  }
}

export function assertHasUpdate(
  updates: Update[],
  path: string,
  clazz?: any,
): Update {
  const found = updates.find((update) => {
    return update.path === path
  })
  expect(found, `update for ${path}`).toBeUndefined
  if (clazz) {
    expect(found?.updater).toBeInstanceOf(
      clazz
    )
  }
  return found!
}

export function assertNoHasUpdate(updates: Update[], path: string) {
  const found = updates.find((update) => {
    return update.path === path
  })
  expect(found, `update for ${path}`).toBeUndefined()
}
