"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// --- Type Definitions ---
export interface Evaluator {
  id: string;
  name: string;
  password: string;
}

export interface Candidate {
  id: string;
  name: string;
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

// --- Store State and Actions ---
interface StoreState {
  evaluators: Evaluator[];
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  adminPassword: string;
  superPassword: "0000";
}

interface StoreActions {
  addEvaluator: (name: string, password: string) => void;
  updateEvaluator: (id: string, updatedEvaluator: Evaluator) => void;
  deleteEvaluator: (id: string) => void;
  addCandidate: (name: string) => void;
  updateCandidate: (id: string, updatedCandidate: Candidate) => void;
  deleteCandidate: (id: string) => void;
  addItem: (name: string, maxScore: number) => void;
  updateItem: (id: string, updatedItem: EvaluationItem) => void;
  deleteItem: (id: string) => void;
  addScore: (candidateId: string, evaluatorId: string, evaluationItemId: string, score: number) => void;
  addComment: (candidateId: string, evaluatorId: string, commentText: string) => void;
  setAdminPassword: (password: string) => void;
  resetStore: () => void;
}

type StoreContextType = StoreState & StoreActions;

// --- Initial Data ---
const createInitialState = (): StoreState => ({
  evaluators: [
    { id: 'eval1', name: '김평가', password: '1' },
    { id: 'eval2', name: '이평가', password: '1' },
    { id: 'eval3', name: '박평가', password: '1' },
  ],
  candidates: [
    { id: 'cand1', name: '최대상' },
    { id: 'cand2', name: '강대상' },
    { id: 'cand3', name: '조대상' },
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
  superPassword: "0000",
});

// --- Context and Provider ---
const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<StoreState>('evalmaster-pro-store', createInitialState());

  const generateId = () => new Date().getTime().toString();

  const actions: StoreActions = {
    // Evaluators
    addEvaluator: (name, password) => setData(prev => ({ ...prev, evaluators: [...prev.evaluators, { id: generateId(), name, password }] })),
    updateEvaluator: (id, updated) => setData(prev => ({ ...prev, evaluators: prev.evaluators.map(e => e.id === id ? updated : e) })),
    deleteEvaluator: (id) => setData(prev => ({ ...prev, evaluators: prev.evaluators.filter(e => e.id !== id) })),
    // Candidates
    addCandidate: (name) => setData(prev => ({ ...prev, candidates: [...prev.candidates, { id: generateId(), name }] })),
    updateCandidate: (id, updated) => setData(prev => ({ ...prev, candidates: prev.candidates.map(c => c.id === id ? updated : c) })),
    deleteCandidate: (id: string) => setData(prev => ({ ...prev, candidates: prev.candidates.filter(c => c.id !== id) })),
    // Items
    addItem: (name, maxScore) => setData(prev => ({ ...prev, items: [...prev.items, { id: generateId(), name, maxScore }] })),
    updateItem: (id, updated) => setData(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? updated : i) })),
    deleteItem: (id) => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) })),
    // Scores & Comments
    addScore: (candidateId, evaluatorId, evaluationItemId, score) => setData(prev => ({ ...prev, scores: [...prev.scores, { id: generateId(), candidateId, evaluatorId, evaluationItemId, score }] })),
    addComment: (candidateId, evaluatorId, commentText) => setData(prev => ({ ...prev, comments: [...prev.comments, { id: generateId(), candidateId, evaluatorId, commentText }] })),
    // Settings
    setAdminPassword: (password) => setData(prev => ({ ...prev, adminPassword: password })),
    resetStore: () => setData(createInitialState()),
  };

  return React.createElement(StoreContext.Provider, { value: { ...data, ...actions } }, children);
}

// --- Custom Hook ---
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
