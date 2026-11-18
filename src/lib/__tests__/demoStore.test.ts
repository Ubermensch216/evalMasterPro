import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialSeedData, createLocalId } from '../demoStore';
import { DEFAULT_SYSTEM_NAME } from '../../types/evaluation';

describe('demoStore helpers', () => {
  it('creates valid initial seed data with default evaluators, candidates, and items', () => {
    const seed = createInitialSeedData();
    assert.equal(seed.systemName, DEFAULT_SYSTEM_NAME);
    assert.equal(seed.evaluators.length, 3);
    assert.equal(seed.candidates.length, 3);
    assert.equal(seed.items.length, 4);
    assert.equal(seed.adminPassword, '1');
    assert.equal(seed.resultsPassword, '1');
    assert.equal(seed.allowScoreModification, true);
  });

  it('generates distinct prefixed local IDs', () => {
    const first = createLocalId('eval');
    const second = createLocalId('eval');
    assert.match(first, /^eval_/);
    assert.notEqual(first, second);
  });
});
