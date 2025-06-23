"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  getDocs,
  setDoc,
  getDoc,
  DocumentData,
  limit,
} from 'firebase/firestore';

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
  id:string;
  candidateId: string;
  evaluatorId: string;
  commentText: string;
}

// --- Store State and Actions ---
interface StoreState {
  loading: boolean;
  permissionError: boolean;
  evaluators: Evaluator[];
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  adminPassword: string;
  superPassword: "0132";
}

interface StoreActions {
  addEvaluator: (name: string, password: string) => Promise<void>;
  updateEvaluator: (id: string, updatedEvaluator: Omit<Evaluator, 'id'>) => Promise<void>;
  deleteEvaluator: (id: string) => Promise<void>;
  addCandidate: (name: string) => Promise<void>;
  updateCandidate: (id: string, updatedCandidate: Omit<Candidate, 'id'>) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  addItem: (name: string, maxScore: number) => Promise<void>;
  updateItem: (id: string, updatedItem: Omit<EvaluationItem, 'id'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addScore: (candidateId: string, evaluatorId: string, evaluationItemId: string, score: number) => Promise<void>;
  addComment: (candidateId: string, evaluatorId: string, commentText: string) => Promise<void>;
  setAdminPassword: (password: string) => Promise<void>;
  resetStore: () => Promise<void>;
}

type StoreContextType = StoreState & StoreActions;

// --- Initial Data for Seeding ---
const createInitialState = (): Omit<StoreState, 'loading' | 'superPassword' | 'permissionError'> => ({
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
});


// --- Context and Provider ---
const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    loading: true,
    permissionError: false,
    evaluators: [],
    candidates: [],
    items: [],
    scores: [],
    comments: [],
    adminPassword: '',
    superPassword: "0132",
  });

  const resetStore = useCallback(async () => {
    setState(prev => ({...prev, loading: true}));
    const collectionsToDelete = ['evaluators', 'candidates', 'items', 'scores', 'comments'];
    for (const coll of collectionsToDelete) {
        const snapshot = await getDocs(collection(db, coll));
        if (snapshot.size > 0) {
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    }

    const initialData = createInitialState();
    const seedBatch = writeBatch(db);
    initialData.evaluators.forEach(e => seedBatch.set(doc(db, 'evaluators', e.id), { name: e.name, password: e.password }));
    initialData.candidates.forEach(c => seedBatch.set(doc(db, 'candidates', c.id), { name: c.name }));
    initialData.items.forEach(i => seedBatch.set(doc(db, 'items', i.id), { name: i.name, maxScore: i.maxScore }));
    await seedBatch.commit();
    
    await setDoc(doc(db, 'settings', 'admin'), { password: initialData.adminPassword });
    
    setState(prev => ({...prev, loading: false}));
  }, []);

  useEffect(() => {
    const mapSnapshot = <T extends { id: string }>(snapshot: DocumentData): T[] => {
      return snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as T));
    };

    const handleError = (error: Error & { code?: string }) => {
      if (error.code === 'permission-denied') {
        console.error("Firestore Permission Denied. Please check your security rules in the Firebase Console.");
        setState(prev => ({ ...prev, permissionError: true, loading: false }));
      } else {
        console.error("Firestore snapshot error:", error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    const unsubscribers = [
      onSnapshot(collection(db, 'evaluators'), (snapshot) => setState(prev => ({ ...prev, evaluators: mapSnapshot<Evaluator>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'candidates'), (snapshot) => setState(prev => ({ ...prev, candidates: mapSnapshot<Candidate>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'items'), (snapshot) => setState(prev => ({ ...prev, items: mapSnapshot<EvaluationItem>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'scores'), (snapshot) => setState(prev => ({ ...prev, scores: mapSnapshot<Score>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'comments'), (snapshot) => setState(prev => ({ ...prev, comments: mapSnapshot<Comment>(snapshot), permissionError: false })), handleError),
      onSnapshot(doc(db, 'settings', 'admin'), (doc) => {
        if (doc.exists()) {
          setState(prev => ({...prev, adminPassword: doc.data().password, permissionError: false}));
        }
      }, handleError),
    ];

    const checkAndSeedData = async () => {
      try {
        const evaluatorsQuery = query(collection(db, 'evaluators'), limit(1));
        const evaluatorsSnap = await getDocs(evaluatorsQuery);
        if (evaluatorsSnap.empty) {
          console.log("No data found in Firestore. Seeding initial data...");
          await resetStore();
        } else {
          setState(prev => ({ ...prev, loading: false, permissionError: false }));
        }
      } catch (error: any) {
        handleError(error);
      }
    };
    
    checkAndSeedData();

    return () => unsubscribers.forEach(unsub => unsub());
  }, [resetStore]);


  const actions: StoreActions = {
    addEvaluator: useCallback(async (name, password) => { await addDoc(collection(db, 'evaluators'), { name, password }); }, []),
    updateEvaluator: useCallback(async (id, updated) => { await updateDoc(doc(db, 'evaluators', id), updated); }, []),
    deleteEvaluator: useCallback(async (id) => { await deleteDoc(doc(db, 'evaluators', id)); }, []),
    addCandidate: useCallback(async (name) => { await addDoc(collection(db, 'candidates'), { name }); }, []),
    updateCandidate: useCallback(async (id, updated) => { await updateDoc(doc(db, 'candidates', id), updated); }, []),
    deleteCandidate: useCallback(async (id) => { await deleteDoc(doc(db, 'candidates', id)); }, []),
    addItem: useCallback(async (name, maxScore) => { await addDoc(collection(db, 'items'), { name, maxScore }); }, []),
    updateItem: useCallback(async (id, updated) => { await updateDoc(doc(db, 'items', id), updated); }, []),
    deleteItem: useCallback(async (id) => { await deleteDoc(doc(db, 'items', id)); }, []),
    addScore: useCallback(async (candidateId, evaluatorId, evaluationItemId, score) => { await addDoc(collection(db, 'scores'), { candidateId, evaluatorId, evaluationItemId, score }); }, []),
    addComment: useCallback(async (candidateId, evaluatorId, commentText) => { await addDoc(collection(db, 'comments'), { candidateId, evaluatorId, commentText }); }, []),
    setAdminPassword: useCallback(async (password) => { await setDoc(doc(db, 'settings', 'admin'), { password }); }, []),
    resetStore,
  };

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return React.createElement(StoreContext.Provider, { value }, children);
}

// --- Custom Hook ---
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
