
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
  where,
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
  id:string;
  candidateId: string;
  evaluatorId: string;
  commentText: string;
}

// --- Store State and Actions ---
interface StoreState {
  loading: boolean;
  permissionError: boolean;
  systemName: string;
  evaluators: Evaluator[];
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  adminPassword: string;
  superPassword: "0132";
  allowScoreModification: boolean;
}

interface StoreActions {
  addEvaluator: (name: string, password: string) => Promise<void>;
  updateEvaluator: (id: string, updatedEvaluator: Omit<Evaluator, 'id'>) => Promise<void>;
  deleteEvaluator: (id: string) => Promise<void>;
  addCandidate: (name: string) => Promise<void>;
  updateCandidate: (id: string, updatedCandidate: { name: string }) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  addItem: (name: string, maxScore: number) => Promise<void>;
  updateItem: (id: string, updatedItem: Omit<EvaluationItem, 'id'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  saveScore: (candidateId: string, evaluatorId: string, evaluationItemId: string, score: number) => Promise<void>;
  saveComment: (candidateId: string, evaluatorId: string, commentText: string) => Promise<void>;
  deleteComment: (candidateId: string, evaluatorId: string) => Promise<void>;
  setAdminPassword: (password: string) => Promise<void>;
  resetAdminPassword: () => Promise<void>;
  setSystemName: (name: string) => Promise<void>;
  resetStore: () => Promise<void>;
  setAllowScoreModification: (allow: boolean) => Promise<void>;
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
  systemName: '이발마스터 프로(EvalMaster Pro)',
  allowScoreModification: true,
});


// --- Context and Provider ---
const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    loading: true,
    permissionError: false,
    systemName: '',
    evaluators: [],
    candidates: [],
    items: [],
    scores: [],
    comments: [],
    adminPassword: '',
    superPassword: "0132",
    allowScoreModification: true,
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
    initialData.candidates.forEach(c => seedBatch.set(doc(db, 'candidates', c.id), { name: c.name, createdAt: c.createdAt }));
    initialData.items.forEach(i => seedBatch.set(doc(db, 'items', i.id), { name: i.name, maxScore: i.maxScore }));
    await seedBatch.commit();
    
    await setDoc(doc(db, 'settings', 'admin'), { 
      password: initialData.adminPassword, 
      systemName: initialData.systemName,
      allowScoreModification: initialData.allowScoreModification
    });
    
    setState(prev => ({...prev, loading: false}));
  }, []);

  useEffect(() => {
    const mapSnapshot = <T extends { id: string }>(snapshot: DocumentData): T[] => {
      return snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as T));
    };

    const handleError = (error: Error & { code?: string }) => {
      if (error.code === 'permission-denied') {
        setState(prev => ({ ...prev, permissionError: true, loading: false }));
      } else {
        console.error("Firestore snapshot error:", error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    const unsubscribers = [
      onSnapshot(collection(db, 'evaluators'), (snapshot) => setState(prev => ({ ...prev, evaluators: mapSnapshot<Evaluator>(snapshot), permissionError: false })), handleError),
      onSnapshot(query(collection(db, 'candidates')), (snapshot) => {
        const fetchedCandidates = mapSnapshot<Candidate>(snapshot);
        fetchedCandidates.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setState(prev => ({ ...prev, candidates: fetchedCandidates, permissionError: false }));
      }, handleError),
      onSnapshot(collection(db, 'items'), (snapshot) => setState(prev => ({ ...prev, items: mapSnapshot<EvaluationItem>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'scores'), (snapshot) => setState(prev => ({ ...prev, scores: mapSnapshot<Score>(snapshot), permissionError: false })), handleError),
      onSnapshot(collection(db, 'comments'), (snapshot) => setState(prev => ({ ...prev, comments: mapSnapshot<Comment>(snapshot), permissionError: false })), handleError),
      onSnapshot(doc(db, 'settings', 'admin'), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setState(prev => ({
            ...prev, 
            adminPassword: data.password,
            systemName: data.systemName || '이발마스터 프로(EvalMaster Pro)',
            allowScoreModification: data.allowScoreModification !== false, // Default to true
            permissionError: false
          }));
        }
      }, handleError),
    ];

    const checkAndSeedData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
        if (!settingsDoc.exists()) {
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


  const addEvaluator = useCallback(async (name: string, password: string) => { await addDoc(collection(db, 'evaluators'), { name, password }); }, []);
  const updateEvaluator = useCallback(async (id: string, updated: Omit<Evaluator, 'id'>) => { await updateDoc(doc(db, 'evaluators', id), updated); }, []);
  const deleteEvaluator = useCallback(async (id: string) => { await deleteDoc(doc(db, 'evaluators', id)); }, []);
  const addCandidate = useCallback(async (name: string) => { await addDoc(collection(db, 'candidates'), { name, createdAt: Date.now() }); }, []);
  const updateCandidate = useCallback(async (id: string, updated: { name: string }) => { await updateDoc(doc(db, 'candidates', id), { name: updated.name }); }, []);
  const deleteCandidate = useCallback(async (id: string) => { await deleteDoc(doc(db, 'candidates', id)); }, []);
  const addItem = useCallback(async (name: string, maxScore: number) => { await addDoc(collection(db, 'items'), { name, maxScore }); }, []);
  const updateItem = useCallback(async (id: string, updated: Omit<EvaluationItem, 'id'>) => { await updateDoc(doc(db, 'items', id), updated); }, []);
  const deleteItem = useCallback(async (id: string) => { await deleteDoc(doc(db, 'items', id)); }, []);
  
  const saveScore = useCallback(async (candidateId: string, evaluatorId: string, evaluationItemId: string, score: number) => {
    const scoresRef = collection(db, 'scores');
    const q = query(scoresRef, 
      where('candidateId', '==', candidateId),
      where('evaluatorId', '==', evaluatorId),
      where('evaluationItemId', '==', evaluationItemId)
    );
    
    const batch = writeBatch(db);
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    const newDocRef = doc(collection(db, 'scores')); // Let Firestore generate ID
    batch.set(newDocRef, { candidateId, evaluatorId, evaluationItemId, score });
    
    await batch.commit();
  }, []);

  const saveComment = useCallback(async (candidateId: string, evaluatorId: string, commentText: string) => {
      const docId = `${candidateId}-${evaluatorId}`;
      await setDoc(doc(db, 'comments', docId), { candidateId, evaluatorId, commentText });
  }, []);
  const deleteComment = useCallback(async (candidateId: string, evaluatorId: string) => {
      const docId = `${candidateId}-${evaluatorId}`;
      await deleteDoc(doc(db, 'comments', docId));
  }, []);
  const setAdminPassword = useCallback(async (password: string) => { await updateDoc(doc(db, 'settings', 'admin'), { password }); }, []);
  const resetAdminPassword = useCallback(async () => { await updateDoc(doc(db, 'settings', 'admin'), { password: "" }); }, []);
  const setSystemName = useCallback(async (name: string) => { await updateDoc(doc(db, 'settings', 'admin'), { systemName: name }); }, []);
  const setAllowScoreModification = useCallback(async (allow: boolean) => { await updateDoc(doc(db, 'settings', 'admin'), { allowScoreModification: allow }); }, []);


  const value = useMemo(() => ({
    ...state,
    addEvaluator,
    updateEvaluator,
    deleteEvaluator,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addItem,
    updateItem,
    deleteItem,
    saveScore,
    saveComment,
    deleteComment,
    setAdminPassword,
    resetAdminPassword,
    setSystemName,
    resetStore,
    setAllowScoreModification
  }), [state, addEvaluator, updateEvaluator, deleteEvaluator, addCandidate, updateCandidate, deleteCandidate, addItem, updateItem, deleteItem, saveScore, saveComment, deleteComment, setAdminPassword, resetAdminPassword, setSystemName, resetStore, setAllowScoreModification]);

  return React.createElement(StoreContext.Provider, { value: value }, children);
}

// --- Custom Hook ---
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
