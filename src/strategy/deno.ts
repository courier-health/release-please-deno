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

// Note: This file was borrowed heavily from the release-please Node Strategy file at: https://github.com/googleapis/release-please/blob/d5f2ca8a2cf32701f1d87a85bbc37493b1db65c2/src/strategies/node.ts
// That file is licensed under the Apache License, Version 2.0 (the "License") and therefore this file is also licensed under the Apache License, Version 2.0.

/**
 * Deno strategy for release-please.
 *
 * This module provides the Deno strategy class that handles version management
 * for Deno projects supporting deno.json, deno.jsonc, and package.json files.
 */

// External packages
import { Errors } from 'release-please'
import type { BuildUpdatesOptions } from 'release-please'
import type { Version } from 'release-please/build/src/version.js'

// External utilities
import type { GitHubFileContents } from '@google-automations/git-file-utils'

// Release-please core
import { BaseStrategy } from 'release-please/build/src/strategies/base.js'

// Release-please types
import type { Update } from 'release-please/build/src/update.js'

// Release-please updaters
import { Changelog } from 'release-please/build/src/updaters/changelog.js'
import { ChangelogJson } from 'release-please/build/src/updaters/changelog-json.js'
import { PackageJson } from 'release-please/build/src/updaters/node/package-json.js'
import { PackageLockJson } from 'release-please/build/src/updaters/node/package-lock-json.js'
import { SamplesPackageJson } from 'release-please/build/src/updaters/node/samples-package-json.js'

// Release-please utilities
import { filterCommits } from 'release-please/build/src/util/filter-commits.js'
import type { ConventionalCommit } from 'release-please/build/src/commit.js'

// Local types
import type { DenoConfigFileName } from '../types.ts'
import { assertPackageJsonContent, ProgrammingLanguage } from '../types.ts'

// Constants
const DENO_CONF_FILES: readonly DenoConfigFileName[] = ['deno.json', 'deno.jsonc', 'package.json'] as const
const LOCK_FILES: readonly string[] = ['package-lock.json', 'npm-shrinkwrap.json'] as const

export class Deno extends BaseStrategy {
  private pkgJsonContents?: GitHubFileContents
  private pkgJsonName?: DenoConfigFileName

  /**
   * Creates updates for lock files (package-lock.json, npm-shrinkwrap.json)
   */
  private createLockFileUpdates(version: Version, versionsMap: Map<string, Version>): Update[] {
    return LOCK_FILES.map((lockFile: string): Update => ({
      path: this.addPath(lockFile),
      createIfMissing: false,
      updater: new PackageLockJson({
        version,
        versionsMap,
      }),
    }))
  }

  /**
   * Creates update for samples package.json
   */
  private createSampleUpdates(version: Version, packageName: string): Update[] {
    return [{
      path: this.addPath('samples/package.json'),
      createIfMissing: false,
      updater: new SamplesPackageJson({
        version,
        packageName,
      }),
    }]
  }

  /**
   * Creates main package.json update
   */
  private createPackageUpdates(version: Version): Update[] {
    return [{
      path: this.addPath('package.json'),
      createIfMissing: false,
      cachedFileContents: this.pkgJsonContents,
      updater: new PackageJson({
        version,
      }),
    }]
  }

  /**
   * Creates changelog-related updates (markdown and JSON)
   */
  private createChangelogUpdates(
    version: Version,
    changelogEntry: string,
    packageName: string,
    commits?: ConventionalCommit[],
  ): Update[] {
    const updates: Update[] = []

    if (!this.skipChangelog) {
      // Add markdown changelog
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry,
        }),
      })

      // Add JSON changelog if we have commits and package name
      if (commits && packageName) {
        const filteredCommits = filterCommits(commits, this.changelogSections)
        updates.push({
          path: 'changelog.json',
          createIfMissing: false,
          updater: new ChangelogJson({
            artifactName: packageName,
            version,
            commits: filteredCommits,
            language: ProgrammingLanguage.JAVASCRIPT,
          }),
        })
      }
    }

    return updates
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions,
  ): Promise<Update[]> {
    const { newVersion: version, versionsMap, changelogEntry, commits } = options
    const packageName: string = (await this.getPackageName()) ?? ''

    // Collect all updates using helper methods
    const allUpdates = [
      ...this.createLockFileUpdates(version, versionsMap),
      ...this.createSampleUpdates(version, packageName),
      ...this.createPackageUpdates(version),
      ...this.createChangelogUpdates(version, changelogEntry, packageName, commits),
    ]

    return allUpdates
  }

  override async getDefaultPackageName(): Promise<string | undefined> {
    const pkgJsonContents: GitHubFileContents = await this.getPkgJsonContents()

    try {
      const parsedContent: unknown = JSON.parse(pkgJsonContents.parsedContent)
      assertPackageJsonContent(parsedContent)
      return parsedContent.name
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to parse ${this.pkgJsonName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      return undefined
    }
  }

  protected override normalizeComponent(component: string | undefined): string {
    if (!component) {
      return ''
    }
    return component.match(/^@[\w-]+\//) ? component.split('/')[1] : component
  }

  /**
   * Attempts to find and load the first available configuration file
   */
  private async findConfigFile(): Promise<{ contents: GitHubFileContents; fileName: DenoConfigFileName }> {
    for (const configFile of DENO_CONF_FILES) {
      try {
        const contents = await this.github.getFileContentsOnBranch(
          this.addPath(configFile),
          this.targetBranch,
        )
        return { contents, fileName: configFile }
      } catch (error: unknown) {
        if (error instanceof Errors.FileNotFoundError) {
          continue // Try next file
        }
        // Re-throw non-FileNotFound errors immediately
        throw error
      }
    }

    // No config file found
    this.logger.error('No deno.json, deno.jsonc, or package.json found in the repository')
    throw new Errors.MissingRequiredFileError(
      this.addPath('deno.json'),
      'node',
      `${this.repository.owner}/${this.repository.repo}`,
    )
  }

  protected async getPkgJsonContents(): Promise<GitHubFileContents> {
    if (!this.pkgJsonContents) {
      const { contents, fileName } = await this.findConfigFile()
      this.pkgJsonContents = contents
      this.pkgJsonName = fileName
    }
    return this.pkgJsonContents
  }
}
