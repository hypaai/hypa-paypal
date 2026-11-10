import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASK_HYPA_CONTEXT_LIMIT,
  ASK_HYPA_PROMPT_LIMIT,
  askAction,
  askContextTooLong,
  askFailedToolMessage,
  askToolStatus,
  clipAskPrompt,
  shouldApplyAskEdit,
} from './ask-hypa';

const fresh = {
  confirmed: true,
  action: 'replace' as const,
  recovered: false,
  generation: 1,
  snapshotGeneration: 1,
  document: 'hello',
  snapshotDocument: 'hello',
  selected: '',
  snapshotSelected: '',
  selectionStart: 0,
  selectionEnd: 0,
  snapshotStart: 0,
  snapshotEnd: 0,
};

test('prompt stays on one capped line', () => {
  assert.equal(clipAskPrompt('a'.repeat(ASK_HYPA_PROMPT_LIMIT + 20)).length, ASK_HYPA_PROMPT_LIMIT);
});

test('a long field is blocked unless a short selection is the context', () => {
  const long = 'a'.repeat(ASK_HYPA_CONTEXT_LIMIT + 1);
  assert.equal(askContextTooLong(long, ''), true);
  assert.equal(askContextTooLong(long, 'short'), false);
});

test('tool status is one live line and a failed tool is one message', () => {
  assert.equal(askToolStatus('translate_message'), 'Translating…');
  assert.equal(askToolStatus('unknown_tool'), 'Working…');
  assert.equal(askFailedToolMessage('text_to_speech', ''), "Couldn't create the audio.");
  assert.equal(askFailedToolMessage('translate_message', 'Budget exceeded'), 'Budget exceeded');
});

test('a preview requires Insert, and confirmation never bypasses stale or recovery checks', () => {
  assert.equal(shouldApplyAskEdit({ ...fresh, confirmed: false }), false);
  assert.equal(shouldApplyAskEdit(fresh), true);
  assert.equal(shouldApplyAskEdit({ ...fresh, document: 'hello!' }), false);
  assert.equal(shouldApplyAskEdit({ ...fresh, generation: 2 }), false);
  assert.equal(shouldApplyAskEdit({ ...fresh, action: 'show' }), false);
  assert.equal(shouldApplyAskEdit({ ...fresh, recovered: true }), false);
  assert.equal(askAction('nope'), 'show');
});

test('a selection is replaced only while that same range is still selected', () => {
  const selected = {
    ...fresh,
    document: 'aaa bbb',
    snapshotDocument: 'aaa bbb',
    selected: 'bbb',
    snapshotSelected: 'bbb',
    selectionStart: 4,
    selectionEnd: 7,
    snapshotStart: 4,
    snapshotEnd: 7,
  };
  assert.equal(shouldApplyAskEdit(selected), true);
  assert.equal(shouldApplyAskEdit({ ...selected, selectionStart: 0, selectionEnd: 3, selected: 'aaa' }), false);
});
