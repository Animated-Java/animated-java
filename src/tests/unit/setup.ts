import * as nodePath from 'node:path'

// Blockbench exposes Node's `path` module as the `PathModule` global, and some
// util modules use it directly instead of importing `node:path`. Give the unit
// lane the real thing (POSIX semantics on the CI/dev platform).
;(globalThis as Record<string, unknown>).PathModule = nodePath
