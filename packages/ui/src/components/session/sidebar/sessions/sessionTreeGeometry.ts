import { FILE_TREE_INDENT_PX, fileTreeRowPaddingLeft } from '@/components/views/files/fileTreeRow';

// Project/zone headers pull out of the scroller's 10px start padding with
// -ms-2.5, then pad 16px + a 14px icon + a 6px gap: their labels sit 26px
// from the scroller content edge. The tree row pads `base` then a 14px slot
// and a 6px gap, so base = 6px puts root session titles on that same line.
export const SESSION_TREE_BASE_PADDING_PX = 6;

export const sessionTreeRowPaddingLeft = (depth: number): string => fileTreeRowPaddingLeft(depth, SESSION_TREE_BASE_PADDING_PX);

// Flat list rows have no chevron slot: their content starts where tree-row
// titles do at depth 0 (26px), then steps one indent per level so sessions
// under a project read as children of its header. `sessionTimelineTextInset`
// is that same title start, for rows that pad by text inset rather than box.
export const SESSION_TIMELINE_ROW_LEFT_PX = 26;

export const sessionTimelineRowPaddingLeft = (depth: number): string =>
  `${SESSION_TIMELINE_ROW_LEFT_PX + depth * FILE_TREE_INDENT_PX}px`;

/** Where the text of a tree row starts: past the level's chevron slot (14px) and gap (6px). */
export const sessionTreeTextInset = (depth: number): string => `calc(${sessionTreeRowPaddingLeft(depth)} + 20px)`;

/**
 * One guide line a tree row draws: the line of `level`, which runs under the
 * slot of the row's ancestor one level up and frames that ancestor's
 * children. `end` marks its last child, where the line turns toward it.
 */
export type SessionTreeGuide = { level: number; end: boolean };

/**
 * The guides of each row in a run of tree rows, given their levels in display
 * order. A row's own level gets a guide that runs on, or ends at the row when
 * no later sibling follows; every shallower level whose line still has a
 * sibling to reach below runs through it. `null` breaks the run: a row that
 * is not part of a tree, such as a header or a Show more line.
 */
export const computeSessionTreeGuides = (levels: readonly (number | null)[]): (readonly SessionTreeGuide[] | null)[] => {
  const result: (readonly SessionTreeGuide[] | null)[] = new Array(levels.length).fill(null);
  // `siblingBelow[level]`: a later row sits at `level` before any shallower
  // row closes that level's line.
  let siblingBelow: boolean[] = [];
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index];
    if (level === null || level === undefined) {
      siblingBelow = [];
      continue;
    }
    const guides: SessionTreeGuide[] = [];
    for (let line = 1; line < level; line += 1) {
      if (siblingBelow[line]) guides.push({ level: line, end: false });
    }
    if (level > 0) guides.push({ level, end: !siblingBelow[level] });
    if (guides.length > 0) result[index] = Object.freeze(guides);
    siblingBelow = siblingBelow.slice(0, level);
    siblingBelow[level] = true;
  }
  return result;
};
