import assert from 'node:assert/strict';
import test from 'node:test';
import {
  alternateCaseForms,
  keyboardAlphabetRowsByCode as rows,
  keyboardAlternatePopupsByCode as popups,
} from './keyboard-layouts';

test('Yoruba keeps QWERTY positions and promotes only distinct letters', () => {
  assert.deepEqual(
    rows.yo.map((row) => row.join('')),
    ['qwẹrtyuiọp', 'aṣdfghjkl', 'zxcvbnm']
  );
  assert.deepEqual(rows.igl, rows.yo);
  assert.deepEqual(popups.igl, popups.yo);
});
test('promoted keys expose plain letters first and preserve tone order', () => {
  assert.deepEqual(popups.yo.ẹ, ['e', 'ẹ́', 'ẹ̀', 'ẹ̄', 'é', 'è', 'ē']);
  assert.deepEqual(popups.yo.ọ, ['o', 'ọ́', 'ọ̀', 'ọ̄', 'ó', 'ò', 'ō']);
  assert.deepEqual(popups.yo.ṣ, ['s']);
  assert.deepEqual(popups.yo.n, ['ń', 'ǹ', 'n̄']);
  assert.deepEqual(popups.yo.m, ['ḿ', 'm̀', 'm̄']);
});
test('every alternate has explicit NFC Shift-once and Caps-lock forms', () => {
  const segmenter = new Intl.Segmenter('yo', { granularity: 'grapheme' });
  for (const table of Object.values(popups))
    for (const variants of Object.values(table)) {
      for (const lower of variants) {
        const forms = alternateCaseForms[lower];
        assert.ok(forms);
        for (const form of [lower, ...forms]) assert.equal(form, form.normalize('NFC'));
        if ([...segmenter.segment(lower)].length === 1) assert.equal(forms[0], forms[1]);
      }
    }
  for (const digraph of ['gb', 'ch', 'nw', 'ny', 'gh', 'gw', 'kp', 'kw', 'sh', 'ts']) {
    assert.deepEqual(alternateCaseForms[digraph], [
      digraph[0].toUpperCase() + digraph[1],
      digraph.toUpperCase(),
    ]);
  }
});

test('Igbo promotes dotted vowels at QWERTY positions with plain vowels first', () => {
  assert.deepEqual(rows.ig.map(row => row.join('')), ['qwẹrtyụịọp', 'asdfghjkl', 'zxcvbnm']);
  assert.deepEqual(popups.ig.ị, ['i', 'ị́', 'ị̀', 'ị̄', 'í', 'ì', 'ī']);
  assert.deepEqual(popups.ig.ọ, ['o', 'ọ́', 'ọ̀', 'ọ̄', 'ó', 'ò', 'ō']);
  assert.deepEqual(popups.ig.ụ, ['u', 'ụ́', 'ụ̀', 'ụ̄', 'ú', 'ù', 'ū']);
  assert.deepEqual(popups.ig.ẹ, ['e', 'ẹ́', 'ẹ̀', 'ẹ̄', 'é', 'è', 'ē']);
  assert.deepEqual(popups.ig.n, ['ṅ', 'ñ', 'nw', 'ny', 'ń', 'ǹ', 'n̄']);
  assert.deepEqual(popups.ig.g, ['gb', 'gh', 'gw']);
  assert.deepEqual(popups.ig.k, ['kp', 'kw']);
  assert.deepEqual(popups.ig.c, ['ch']);
  assert.deepEqual(alternateCaseForms.ṅ, ['Ṅ', 'Ṅ']);
  for (const vowel of ['ị', 'ọ', 'ụ', 'ẹ']) {
    for (const mark of ['́', '̀', '̄']) {
      const lower = (vowel + mark).normalize('NFC');
      assert.deepEqual(alternateCaseForms[lower], [lower.toUpperCase(), lower.toUpperCase()]);
      assert.equal([...new Intl.Segmenter('ig', {granularity:'grapheme'}).segment(lower)].length, 1);
    }
  }
});
test('Hausa promotes hooked letters and keeps plain letters reachable first', () => {
  assert.deepEqual(rows.ha.map(row => row.join('')), ['qwertƴuiop', 'asɗfghjƙl', 'zxcvɓnm']);
  assert.deepEqual(popups.ha.ɓ, ['b']);
  assert.deepEqual(popups.ha.ɗ, ['d']);
  assert.deepEqual(popups.ha.ƙ, ['k', 'ƙw', 'ƙy', 'kw', 'ky']);
  assert.deepEqual(popups.ha.ƴ, ['y', 'ʼy', 'ʼ']);
  for (const [lower, upper] of [['ɓ', 'Ɓ'], ['ɗ', 'Ɗ'], ['ƙ', 'Ƙ'], ['ƴ', 'Ƴ']]) {
    assert.equal(lower.toUpperCase(), upper);
    assert.deepEqual(alternateCaseForms[lower], [upper, upper]);
  }
  assert.deepEqual(alternateCaseForms.ƙw, ['Ƙw', 'ƘW']);
  assert.deepEqual(alternateCaseForms.ƙy, ['Ƙy', 'ƘY']);
  assert.deepEqual(alternateCaseForms['ʼy'], ['ʼY', 'ʼY']);
});
