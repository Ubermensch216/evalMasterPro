import type {
  Candidate,
  CandidateResult,
  Comment,
  EvaluationItem,
  Evaluator,
  Score,
} from '@/types/evaluation';

/**
 * Computes the sum of maximum scores across all evaluation items.
 */
export function computeTotalMaxScore(items: EvaluationItem[]): number {
  return items.reduce((sum, item) => sum + item.maxScore, 0);
}

/**
 * Formats a date using Korean locale conventions (YYYY년 M월 D일).
 */
export function formatKoreanDate(date: Date = new Date()): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Escapes HTML special characters for safe interpolation into generated HTML strings.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Builds a composite key uniquely identifying a score cell.
 */
export function makeScoreKey(candidateId: string, evaluatorId: string, itemId: string): string {
  return `${candidateId}::${evaluatorId}::${itemId}`;
}

/**
 * Builds a composite key uniquely identifying a candidate-evaluator comment.
 */
export function makeCommentKey(candidateId: string, evaluatorId: string): string {
  return `${candidateId}::${evaluatorId}`;
}

/**
 * Aggregates scores by candidate and evaluator, ignoring orphaned scores from
 * deleted evaluators or items, and sorts candidates by average score descending.
 */
export function calculateCandidateResults({
  candidates,
  evaluators,
  items,
  scores,
}: {
  candidates: Candidate[];
  evaluators: Evaluator[];
  items: EvaluationItem[];
  scores: Score[];
}): CandidateResult[] {
  const validEvaluatorIds = new Set(evaluators.map((e) => e.id));
  const validItemIds = new Set(items.map((i) => i.id));
  const activeScores = scores.filter(
    (s) => validEvaluatorIds.has(s.evaluatorId) && validItemIds.has(s.evaluationItemId),
  );

  const candidateResults = candidates.map((candidate) => {
    const relatedScores = activeScores.filter((s) => s.candidateId === candidate.id);
    const totalScore = relatedScores.reduce((acc, s) => acc + s.score, 0);
    const numEvaluatorsWhoScored = new Set(relatedScores.map((s) => s.evaluatorId)).size;
    const averageScore = numEvaluatorsWhoScored > 0 ? totalScore / numEvaluatorsWhoScored : 0;

    const scoreByEvaluator = evaluators.map((evaluator) => {
      const evaluatorScores = relatedScores.filter((s) => s.evaluatorId === evaluator.id);
      const total = evaluatorScores.reduce((sum, s) => sum + s.score, 0);
      return {
        evaluatorId: evaluator.id,
        evaluatorName: evaluator.name,
        total,
        hasScored: evaluatorScores.length > 0,
      };
    });

    return {
      id: candidate.id,
      name: candidate.name,
      totalScore,
      averageScore,
      scoreByEvaluator,
    };
  });

  candidateResults.sort((a, b) => b.averageScore - a.averageScore);

  return candidateResults.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));
}

export interface EvaluatorReportRow {
  candidate: Candidate;
  scoresByItem: Record<string, number | undefined>;
  totalScore: number;
  comment: string;
}

/**
 * Builds indexed per-candidate scoring data for a single evaluator's summary or print report.
 */
export function buildEvaluatorReportData({
  evaluatorId,
  candidates,
  items,
  scores,
  comments,
}: {
  evaluatorId: string;
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
}): {
  rows: EvaluatorReportRow[];
  totalMaxScore: number;
} {
  const validItemIds = new Set(items.map((item) => item.id));
  const scoreMap = new Map<string, number>();

  for (const score of scores) {
    if (score.evaluatorId === evaluatorId && validItemIds.has(score.evaluationItemId)) {
      scoreMap.set(`${score.candidateId}::${score.evaluationItemId}`, score.score);
    }
  }

  const commentMap = new Map<string, string>();
  for (const comment of comments) {
    if (comment.evaluatorId === evaluatorId) {
      commentMap.set(comment.candidateId, comment.commentText);
    }
  }

  const rows: EvaluatorReportRow[] = candidates.map((candidate) => {
    const scoresByItem: Record<string, number | undefined> = {};
    let totalScore = 0;

    for (const item of items) {
      const value = scoreMap.get(`${candidate.id}::${item.id}`);
      scoresByItem[item.id] = value;
      if (typeof value === 'number') {
        totalScore += value;
      }
    }

    return {
      candidate,
      scoresByItem,
      totalScore,
      comment: commentMap.get(candidate.id) ?? '',
    };
  });

  return {
    rows,
    totalMaxScore: computeTotalMaxScore(items),
  };
}
