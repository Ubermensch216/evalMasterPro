import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvaluatorReportData,
  calculateCandidateResults,
  computeTotalMaxScore,
  escapeHtml,
  formatKoreanDate,
} from '../evaluation';
import type { Candidate, Comment, EvaluationItem, Evaluator, Score } from '../../types/evaluation';

const evaluators: Evaluator[] = [
  { id: 'eval1', name: '김평가', password: '1', scoringLocked: false, createdAt: 1 },
  { id: 'eval2', name: '이평가', password: '1', scoringLocked: false, createdAt: 2 },
];

const candidates: Candidate[] = [
  { id: 'cand1', name: '최대상', createdAt: 1 },
  { id: 'cand2', name: '강대상', createdAt: 2 },
  { id: 'cand3', name: '조대상', createdAt: 3 },
];

const items: EvaluationItem[] = [
  { id: 'item1', name: '기술 이해도', maxScore: 20 },
  { id: 'item2', name: '창의성', maxScore: 30 },
];

describe('evaluation domain helpers', () => {
  it('computes total max score across items', () => {
    assert.equal(computeTotalMaxScore(items), 50);
    assert.equal(computeTotalMaxScore([]), 0);
  });

  it('calculates rankings, averages, zero-score submissions, and ignores orphaned scores', () => {
    const scores: Score[] = [
      // cand1: eval1 = 40, eval2 = 50 -> total 90, avg 45
      { id: 's1', candidateId: 'cand1', evaluatorId: 'eval1', evaluationItemId: 'item1', score: 15 },
      { id: 's2', candidateId: 'cand1', evaluatorId: 'eval1', evaluationItemId: 'item2', score: 25 },
      { id: 's3', candidateId: 'cand1', evaluatorId: 'eval2', evaluationItemId: 'item1', score: 20 },
      { id: 's4', candidateId: 'cand1', evaluatorId: 'eval2', evaluationItemId: 'item2', score: 30 },
      // cand2: eval1 intentionally scored 0 -> total 0, avg 0, hasScored = true; eval2 did not score
      { id: 's5', candidateId: 'cand2', evaluatorId: 'eval1', evaluationItemId: 'item1', score: 0 },
      { id: 's6', candidateId: 'cand2', evaluatorId: 'eval1', evaluationItemId: 'item2', score: 0 },
      // cand3: eval1 = 50, eval2 un-scored -> total 50, avg 50 (highest average)
      { id: 's7', candidateId: 'cand3', evaluatorId: 'eval1', evaluationItemId: 'item1', score: 20 },
      { id: 's8', candidateId: 'cand3', evaluatorId: 'eval1', evaluationItemId: 'item2', score: 30 },
      // Orphaned scores from deleted evaluator/item should be ignored
      { id: 's9', candidateId: 'cand2', evaluatorId: 'deleted-eval', evaluationItemId: 'item1', score: 100 },
      { id: 's10', candidateId: 'cand2', evaluatorId: 'eval2', evaluationItemId: 'deleted-item', score: 100 },
    ];

    const results = calculateCandidateResults({ candidates, evaluators, items, scores });

    assert.deepEqual(
      results.map((r) => ({ id: r.id, rank: r.rank, totalScore: r.totalScore, averageScore: r.averageScore })),
      [
        { id: 'cand3', rank: 1, totalScore: 50, averageScore: 50 },
        { id: 'cand1', rank: 2, totalScore: 90, averageScore: 45 },
        { id: 'cand2', rank: 3, totalScore: 0, averageScore: 0 },
      ],
    );

    const cand2 = results.find((r) => r.id === 'cand2')!;
    assert.deepEqual(cand2.scoreByEvaluator, [
      { evaluatorId: 'eval1', evaluatorName: '김평가', total: 0, hasScored: true },
      { evaluatorId: 'eval2', evaluatorName: '이평가', total: 0, hasScored: false },
    ]);
  });

  it('builds evaluator report rows with item totals and comments', () => {
    const scores: Score[] = [
      { id: 's1', candidateId: 'cand1', evaluatorId: 'eval1', evaluationItemId: 'item1', score: 18 },
      { id: 's2', candidateId: 'cand1', evaluatorId: 'eval1', evaluationItemId: 'item2', score: 27 },
      { id: 's3', candidateId: 'cand1', evaluatorId: 'eval2', evaluationItemId: 'item1', score: 10 },
    ];
    const comments: Comment[] = [
      { id: 'c1', candidateId: 'cand1', evaluatorId: 'eval1', commentText: '우수한 발표였습니다.' },
      { id: 'c2', candidateId: 'cand1', evaluatorId: 'eval2', commentText: '다른 위원 의견' },
    ];

    const report = buildEvaluatorReportData({
      evaluatorId: 'eval1',
      candidates,
      items,
      scores,
      comments,
    });

    assert.equal(report.totalMaxScore, 50);
    assert.equal(report.rows.length, 3);
    assert.deepEqual(report.rows[0].scoresByItem, { item1: 18, item2: 27 });
    assert.equal(report.rows[0].totalScore, 45);
    assert.equal(report.rows[0].comment, '우수한 발표였습니다.');
    assert.deepEqual(report.rows[1].scoresByItem, { item1: undefined, item2: undefined });
    assert.equal(report.rows[1].totalScore, 0);
    assert.equal(report.rows[1].comment, '');
  });

  it('escapes HTML special characters safely', () => {
    assert.equal(escapeHtml('<script>"test"&\'x\'</script>'), '&lt;script&gt;&quot;test&quot;&amp;&#39;x&#39;&lt;/script&gt;');
  });

  it('formats Korean dates consistently', () => {
    const formatted = formatKoreanDate(new Date('2026-08-20T00:00:00Z'));
    assert.match(formatted, /2026년/);
  });
});
