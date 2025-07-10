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

/**
 * Type definitions for the release-please Deno plugin.
 *
 * This module contains all shared interfaces, types, and enums used
 * across the Deno strategy and plugin implementations.
 */

/**
 * Interface representing the structure of a parsed package.json, deno.json, or deno.jsonc file.
 */
export interface PackageJsonContent {
  name?: string
  version?: string
  [key: string]: unknown
}

/**
 * Configuration options for the Deno plugin.
 */
export interface DenoPluginOptions {
  skipChangelog?: boolean
  changelogPath?: string
  [key: string]: unknown
}

/**
 * Programming languages supported by the changelog system.
 */
export enum ProgrammingLanguage {
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
}

/**
 * Union type for supported Deno configuration file names.
 */
export type DenoConfigFileName = 'deno.json' | 'deno.jsonc' | 'package.json'

/**
 * Type guard to check if an unknown object conforms to PackageJsonContent interface.
 *
 * @param obj - The object to check
 * @returns True if the object is a valid PackageJsonContent
 */
export function isPackageJsonContent(obj: unknown): obj is PackageJsonContent {
  return typeof obj === 'object' && obj !== null
}

/**
 * Assertion function to ensure an object conforms to PackageJsonContent interface.
 * Throws an error if the object is not valid.
 *
 * @param obj - The object to validate
 * @throws {Error} If the object is not a valid PackageJsonContent
 */
export function assertPackageJsonContent(obj: unknown): asserts obj is PackageJsonContent {
  if (!isPackageJsonContent(obj)) {
    throw new Error('Invalid package.json content structure')
  }
}
