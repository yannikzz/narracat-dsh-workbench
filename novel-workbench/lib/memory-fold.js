/**
 * Pure folds over the file-backed chapter memory ledger.
 *
 * Each chapter record stores only what happened in that chapter (set / add /
 * remove actions plus events and foreshadowing moves). Current state is never
 * stored: it is folded here, at read time, over the records up to a chapter.
 * That keeps "change chapter k, only chapter k is affected" true.
 */

/**
 * Fold character state actions up to (and including) one chapter.
 * @param {Array<{ chapter: number, state_changes?: object[] }>} records - chapter records in any order.
 * @param {number} [atChapter] - inclusive upper bound; omit for the whole book.
 * @returns {Record<string, Record<string, { value: unknown, chapter: number }>>} subject → dimension → state.
 */
export function foldCharacterStates(records, atChapter = Number.POSITIVE_INFINITY) {
  const ordered = [...records].sort((left, right) => (left.chapter ?? 0) - (right.chapter ?? 0))
  /** @type {Map<string, Map<string, { values: unknown[], chapter: number }>>} */
  const subjects = new Map()
  for (const record of ordered) {
    if (typeof record?.chapter !== 'number' || record.chapter > atChapter) continue
    for (const change of Array.isArray(record.state_changes) ? record.state_changes : []) {
      const subject = typeof change?.character === 'string' ? change.character.normalize('NFC') : ''
      const dimension = typeof change?.dimension === 'string' ? change.dimension : ''
      if (subject.length === 0 || dimension.length === 0) continue
      const dimensions = subjects.get(subject) ?? new Map()
      const current = dimensions.get(dimension)?.values ?? []
      let values = current
      if (change.operation === 'set') values = [change.value]
      else if (change.operation === 'add') values = current.includes(change.value) ? [...current] : [...current, change.value]
      else if (change.operation === 'remove') values = current.filter((value) => value !== change.value)
      dimensions.set(dimension, { values, chapter: record.chapter })
      subjects.set(subject, dimensions)
    }
  }
  /** @type {Record<string, Record<string, { value: unknown, chapter: number }>>} */
  const folded = {}
  for (const [subject, dimensions] of subjects) {
    folded[subject] = {}
    for (const [dimension, state] of dimensions) {
      folded[subject][dimension] = {
        value: state.values.length <= 1 ? (state.values[0] ?? null) : state.values,
        chapter: state.chapter,
      }
    }
  }
  return folded
}

/**
 * Fold foreshadowing actions up to one chapter into each thread's latest state.
 * @param {Array<{ chapter: number, foreshadowing?: object[] }>} records - chapter records.
 * @param {number} [atChapter] - inclusive upper bound.
 * @returns {Record<string, { last_action: string, chapter: number, actions: string[] }>} id → state.
 */
export function foldForeshadowing(records, atChapter = Number.POSITIVE_INFINITY) {
  const ordered = [...records].sort((left, right) => (left.chapter ?? 0) - (right.chapter ?? 0))
  /** @type {Record<string, { last_action: string, chapter: number, actions: string[] }>} */
  const folded = {}
  for (const record of ordered) {
    if (typeof record?.chapter !== 'number' || record.chapter > atChapter) continue
    for (const action of Array.isArray(record.foreshadowing) ? record.foreshadowing : []) {
      const id = typeof action?.id === 'string' ? action.id : ''
      if (id.length === 0 || !['plant', 'develop', 'reveal'].includes(action?.action)) continue
      const current = folded[id]
      folded[id] = {
        last_action: action.action,
        chapter: record.chapter,
        actions: [...(current?.actions ?? []), action.action],
      }
    }
  }
  return folded
}
