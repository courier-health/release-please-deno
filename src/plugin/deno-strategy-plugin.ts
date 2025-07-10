/**
 * Custom plugin for integrating Deno strategy with release-please.
 *
 * This module provides the CustomPlugin class that extends ManifestPlugin
 * to integrate the Deno strategy into release-please workflows.
 */

// External packages
import type { GitHub } from 'release-please'

// Release-please core
import { ManifestPlugin } from 'release-please/build/src/plugin.js'

// Release-please types
import type { RepositoryConfig } from 'release-please/build/src/manifest.js'

// Local types
import type { DenoPluginOptions } from '../types.ts'

export class DenoStrategyPlugin extends ManifestPlugin {
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: DenoPluginOptions = {},
  ) {
    super(github, targetBranch, repositoryConfig)

    this.logger.info('Deno Release Plugin initialized with options: ', options)
  }
}
