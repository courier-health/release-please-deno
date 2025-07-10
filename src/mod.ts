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
 * Main entry point for the release-please Deno plugin.
 *
 * This module exports the main classes and types for the Deno release-please strategy.
 * It provides support for Deno projects using deno.json, deno.jsonc, and package.json files.
 */

// Re-export all public APIs from their respective modules
export { Deno } from './strategy/deno.ts'
export { DenoStrategyPlugin } from './plugin/deno-strategy-plugin.ts'

// Re-export types for external consumers
export type { DenoConfigFileName, DenoPluginOptions, PackageJsonContent } from './types.ts'

// Re-export enum
export { ProgrammingLanguage } from './types.ts'
