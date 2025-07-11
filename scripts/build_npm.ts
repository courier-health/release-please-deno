#!/usr/bin/env -S deno run -A

import { build, emptyDir } from '@deno/dnt'
import { copy } from 'https://deno.land/std@0.224.0/fs/mod.ts'

const outDir = 'dist/npm'

await emptyDir(`./${outDir}`)

// Copy test files before building
await copy('test/fixtures', `${outDir}/esm/test/fixtures`, { overwrite: true })
await copy('test/fixtures', `${outDir}/script/test/fixtures`, { overwrite: true })

await build({
  entryPoints: ['./src/mod.ts'],
  outDir: `./${outDir}`,
  shims: {
    // see JS docs for overview and more options
    deno: true,
    timers: true,
  },
  compilerOptions: {
    lib: ['ES2022', 'DOM'],
    target: 'ES2022',
    skipLibCheck: true,
  },
  filterDiagnostic(diagnostic) {
    // Filter out Set method compatibility issues from @std libraries
    if (
      diagnostic.file?.fileName.includes('/@std/assert/') ||
      diagnostic.file?.fileName.includes('/@std/expect/') ||
      diagnostic.file?.fileName.includes('/@std/testing/') ||
      diagnostic.file?.fileName.includes('/@std/internal/')
    ) {
      return false // ignore diagnostics in std library files
    }
    return true
  },
  package: {
    // package.json properties
    name: '@courier-health/release-please-deno',
    version: Deno.args[0],
    description: 'A release-please strategy for Deno projects',
    license: 'Apache-2.0',
    repository: {
      type: 'git',
      url: 'git+https://github.com/courier-health/release-please-deno.git',
    },
    bugs: {
      url: 'https://github.com/courier-health/release-please-deno/issues',
    },
    keywords: [
      'release-please',
      'deno',
      'npm',
      'typescript',
      'semantic-versioning',
    ],
    engines: {
      node: '>=16.0.0',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', `${outDir}/LICENSE`)
    Deno.copyFileSync('README.md', `${outDir}/README.md`)
  },
  // We dont want to run the snapshot tests since the snapshot lib isnt working in the npm package
  testPattern: 'test/main_test.ts',
})

// Ensure the test data is ignored in the `.npmignore` file
// so it doesn't get published with your npm package
await Deno.writeTextFile(
  `${outDir}/.npmignore`,
  'esm/test/\nscript/test/\n',
  { append: true },
)
