export interface Evaluator {
  id: string;
  name: string;
  password: string;
  scoringLocked: boolean;
  createdAt?: number;
}

export interface Candidate {
  id: string;
  name: string;
  createdAt: number;
}

export interface EvaluationItem {
  id: string;
  name: string;
  maxScore: number;
}

export interface Score {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluationItemId: string;
  score: number;
}

export interface Comment {
  id: string;
  candidateId: string;
  evaluatorId: string;
  commentText: string;
}

export interface EvaluatorScoreBreakdown {
  evaluatorId: string;
  evaluatorName: string;
  total: number;
  hasScored: boolean;
}

export interface CandidateResult {
  id: string;
  name: string;
  totalScore: number;
  averageScore: number;
  rank: number;
  scoreByEvaluator: EvaluatorScoreBreakdown[];
}

export const DEFAULT_SYSTEM_NAME = '이발마스터 프로(EvalMaster Pro)';
export const SUPER_PASSWORD = '0132' as const;
export const MAX_COMMENT_LENGTH = 300;
