import {
  DEFAULT_SYSTEM_NAME,
  type Candidate,
  type Comment,
  type EvaluationItem,
  type Evaluator,
  type Score,
} from '@/types/evaluation';

export interface PersistedEvaluationData {
  evaluators: Evaluator[];
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  adminPassword: string;
  resultsPassword: string;
  systemName: string;
  allowScoreModification: boolean;
}

export const DEMO_STORAGE_KEY = 'evalmaster_pro_demo_state_v1';
export const DEMO_CHANNEL_NAME = 'evalmaster_pro_demo_sync';

/**
 * Generates initial seed data used both for fresh Firestore provisioning and Local Demo Mode.
 */
export function createInitialSeedData(): PersistedEvaluationData {
  return {
    evaluators: [
      { id: 'eval1', name: '김평가', password: '1', scoringLocked: false, createdAt: 1 },
      { id: 'eval2', name: '이평가', password: '1', scoringLocked: false, createdAt: 2 },
      { id: 'eval3', name: '박평가', password: '1', scoringLocked: false, createdAt: 3 },
    ],
    candidates: [
      { id: 'cand1', name: '최대상', createdAt: 1 },
      { id: 'cand2', name: '강대상', createdAt: 2 },
      { id: 'cand3', name: '조대상', createdAt: 3 },
    ],
    items: [
      { id: 'item1', name: '기술 이해도', maxScore: 20 },
      { id: 'item2', name: '창의성', maxScore: 30 },
      { id: 'item3', name: '발표력', maxScore: 25 },
      { id: 'item4', name: '완성도', maxScore: 25 },
    ],
    scores: [],
    comments: [],
    adminPassword: '1',
    resultsPassword: '1',
    systemName: DEFAULT_SYSTEM_NAME,
    allowScoreModification: true,
  };
}

/**
 * Loads Local Demo Mode state from localStorage, seeding defaults on first launch.
 */
export function loadDemoData(): PersistedEvaluationData {
  if (typeof window === 'undefined') {
    return createInitialSeedData();
  }
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const seeded = createInitialSeedData();
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as PersistedEvaluationData;
  } catch (error) {
    console.error('Failed to read demo state from localStorage:', error);
    return createInitialSeedData();
  }
}

/**
 * Saves Local Demo Mode state to localStorage and notifies other open tabs.
 */
export function saveDemoData(data: PersistedEvaluationData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
      channel.postMessage({ type: 'sync', updatedAt: Date.now() });
      channel.close();
    }
  } catch (error) {
    console.error('Failed to save demo state to localStorage:', error);
  }
}

/**
 * Generates a unique local entity ID for Local Demo Mode mutations.
 */
export function createLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
