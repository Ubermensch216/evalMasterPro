"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot,
  type UpdateData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  createInitialSeedData,
  createLocalId,
  DEMO_CHANNEL_NAME,
  DEMO_STORAGE_KEY,
  loadDemoData,
  saveDemoData,
  type PersistedEvaluationData,
} from '@/lib/demoStore';
import {
  DEFAULT_SYSTEM_NAME,
  SUPER_PASSWORD,
  type Candidate,
  type Comment,
  type EvaluationItem,
  type Evaluator,
  type Score,
} from '@/types/evaluation';

export type { Evaluator, Candidate, EvaluationItem, Score, Comment };

const COLLECTIONS = {
  evaluators: 'evaluators',
  candidates: 'candidates',
  items: 'items',
  scores: 'scores',
  comments: 'comments',
  settings: 'settings',
} as const;

const ADMIN_SETTINGS_DOC_ID = 'admin';
const FIRESTORE_BATCH_LIMIT = 450;

interface StoreState extends PersistedEvaluationData {
  loading: boolean;
  permissionError: boolean;
  isDemoMode: boolean;
  superPassword: typeof SUPER_PASSWORD;
}

interface StoreActions {
  addEvaluator: (name: string, password: string) => Promise<void>;
  updateEvaluator: (id: string, updatedEvaluator: Omit<Evaluator, 'id' | 'scoringLocked' | 'createdAt'>) => Promise<void>;
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
  setResultsPassword: (password: string) => Promise<void>;
  resetResultsPassword: () => Promise<void>;
  setSystemName: (name: string) => Promise<void>;
  resetStore: () => Promise<void>;
  setAllowScoreModification: (allow: boolean) => Promise<void>;
  setEvaluatorScoringLock: (evaluatorId: string, locked: boolean) => Promise<void>;
}

type StoreContextType = StoreState & StoreActions;

function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  return db;
}

/**
 * Deletes document references in chunks to stay safely under Firestore's 500-op batch limit.
 */
async function deleteRefsInChunks(firestore: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(firestore);
    for (const ref of refs.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

async function deleteCollectionDocs(firestore: Firestore, collectionName: string): Promise<void> {
  const snapshot = await getDocs(collection(firestore, collectionName));
  if (snapshot.empty) return;
  await deleteRefsInChunks(firestore, snapshot.docs.map((d) => d.ref));
}

async function deleteDocsWhereEquals(
  firestore: Firestore,
  collectionName: string,
  field: string,
  value: string,
): Promise<void> {
  const snapshot = await getDocs(query(collection(firestore, collectionName), where(field, '==', value)));
  if (snapshot.empty) return;
  await deleteRefsInChunks(firestore, snapshot.docs.map((d) => d.ref));
}

const mapSnapshot = <T extends { id: string }>(snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] }): T[] => {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

/**
 * Provides real-time Firestore-backed state (or Local Demo Mode fallback when
 * Firebase is unconfigured or NEXT_PUBLIC_DEMO_MODE=true) and mutation actions.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const isDemoMode = !isFirebaseConfigured || !db;

  const [state, setState] = useState<StoreState>({
    loading: true,
    permissionError: false,
    isDemoMode,
    systemName: '',
    evaluators: [],
    candidates: [],
    items: [],
    scores: [],
    comments: [],
    adminPassword: '',
    resultsPassword: '',
    superPassword: SUPER_PASSWORD,
    allowScoreModification: true,
  });

  const updateDemoState = useCallback(
    (updater: (prev: PersistedEvaluationData) => PersistedEvaluationData) => {
      setState((prev) => {
        const current: PersistedEvaluationData = {
          evaluators: prev.evaluators,
          candidates: prev.candidates,
          items: prev.items,
          scores: prev.scores,
          comments: prev.comments,
          adminPassword: prev.adminPassword,
          resultsPassword: prev.resultsPassword,
          systemName: prev.systemName,
          allowScoreModification: prev.allowScoreModification,
        };
        const next = updater(current);
        saveDemoData(next);
        return { ...prev, ...next };
      });
    },
    [],
  );

  const resetStore = useCallback(async () => {
    if (isDemoMode) {
      const seeded = createInitialSeedData();
      saveDemoData(seeded);
      setState((prev) => ({ ...prev, ...seeded, loading: false, permissionError: false }));
      return;
    }

    const firestore = requireDb();
    setState((prev) => ({ ...prev, loading: true }));

    const collectionsToClear = [
      COLLECTIONS.evaluators,
      COLLECTIONS.candidates,
      COLLECTIONS.items,
      COLLECTIONS.scores,
      COLLECTIONS.comments,
    ];
    for (const coll of collectionsToClear) {
      await deleteCollectionDocs(firestore, coll);
    }

    const initialData = createInitialSeedData();
    const seedBatch = writeBatch(firestore);

    initialData.evaluators.forEach((e) =>
      seedBatch.set(doc(firestore, COLLECTIONS.evaluators, e.id), {
        name: e.name,
        password: e.password,
        scoringLocked: e.scoringLocked,
        createdAt: e.createdAt,
      }),
    );
    initialData.candidates.forEach((c) =>
      seedBatch.set(doc(firestore, COLLECTIONS.candidates, c.id), {
        name: c.name,
        createdAt: c.createdAt,
      }),
    );
    initialData.items.forEach((i) =>
      seedBatch.set(doc(firestore, COLLECTIONS.items, i.id), {
        name: i.name,
        maxScore: i.maxScore,
      }),
    );
    await seedBatch.commit();

    await setDoc(doc(firestore, COLLECTIONS.settings, ADMIN_SETTINGS_DOC_ID), {
      password: initialData.adminPassword,
      resultsPassword: initialData.resultsPassword,
      systemName: initialData.systemName,
      allowScoreModification: initialData.allowScoreModification,
    });

    setState((prev) => ({ ...prev, loading: false }));
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      const syncFromLocalStorage = () => {
        const loaded = loadDemoData();
        setState((prev) => ({ ...prev, ...loaded, loading: false, permissionError: false }));
      };

      syncFromLocalStorage();

      const handleStorage = (event: StorageEvent) => {
        if (event.key === DEMO_STORAGE_KEY) {
          syncFromLocalStorage();
        }
      };

      window.addEventListener('storage', handleStorage);
      let channel: BroadcastChannel | null = null;
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
        channel.onmessage = () => syncFromLocalStorage();
      }

      return () => {
        window.removeEventListener('storage', handleStorage);
        channel?.close();
      };
    }

    const firestore = requireDb();

    const handleError = (error: Error & { code?: string }) => {
      if (error.code === 'permission-denied') {
        setState((prev) => ({ ...prev, permissionError: true, loading: false }));
      } else {
        console.error('Firestore snapshot error:', error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    const unsubscribers = [
      onSnapshot(
        query(collection(firestore, COLLECTIONS.evaluators), orderBy('createdAt', 'asc')),
        (snapshot) => setState((prev) => ({ ...prev, evaluators: mapSnapshot<Evaluator>(snapshot), permissionError: false })),
        handleError,
      ),
      onSnapshot(
        query(collection(firestore, COLLECTIONS.candidates), orderBy('createdAt', 'asc')),
        (snapshot) => setState((prev) => ({ ...prev, candidates: mapSnapshot<Candidate>(snapshot), permissionError: false })),
        handleError,
      ),
      onSnapshot(
        collection(firestore, COLLECTIONS.items),
        (snapshot) => setState((prev) => ({ ...prev, items: mapSnapshot<EvaluationItem>(snapshot), permissionError: false })),
        handleError,
      ),
      onSnapshot(
        collection(firestore, COLLECTIONS.scores),
        (snapshot) => setState((prev) => ({ ...prev, scores: mapSnapshot<Score>(snapshot), permissionError: false })),
        handleError,
      ),
      onSnapshot(
        collection(firestore, COLLECTIONS.comments),
        (snapshot) => setState((prev) => ({ ...prev, comments: mapSnapshot<Comment>(snapshot), permissionError: false })),
        handleError,
      ),
      onSnapshot(
        doc(firestore, COLLECTIONS.settings, ADMIN_SETTINGS_DOC_ID),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          setState((prev) => ({
            ...prev,
            adminPassword: data.password ?? '',
            resultsPassword: data.resultsPassword ?? '',
            systemName: data.systemName || DEFAULT_SYSTEM_NAME,
            allowScoreModification: data.allowScoreModification !== false,
            permissionError: false,
          }));
        },
        handleError,
      ),
    ];

    const checkAndSeedData = async () => {
      try {
        const settingsDoc = await getDoc(doc(firestore, COLLECTIONS.settings, ADMIN_SETTINGS_DOC_ID));
        if (!settingsDoc.exists()) {
          await resetStore();
        } else {
          setState((prev) => ({ ...prev, loading: false, permissionError: false }));
        }
      } catch (error) {
        handleError(error as Error & { code?: string });
      }
    };

    checkAndSeedData();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isDemoMode, resetStore]);

  const addEvaluator = useCallback(
    async (name: string, password: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          evaluators: [
            ...prev.evaluators,
            { id: createLocalId('eval'), name, password, scoringLocked: false, createdAt: Date.now() },
          ],
        }));
        return;
      }
      await addDoc(collection(requireDb(), COLLECTIONS.evaluators), {
        name,
        password,
        scoringLocked: false,
        createdAt: Date.now(),
      });
    },
    [isDemoMode, updateDemoState],
  );

  const updateEvaluator = useCallback(
    async (id: string, updated: Omit<Evaluator, 'id' | 'scoringLocked' | 'createdAt'>) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          evaluators: prev.evaluators.map((e) => (e.id === id ? { ...e, ...updated } : e)),
        }));
        return;
      }
      await updateDoc(doc(requireDb(), COLLECTIONS.evaluators, id), updated);
    },
    [isDemoMode, updateDemoState],
  );

  const deleteEvaluator = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          evaluators: prev.evaluators.filter((e) => e.id !== id),
          scores: prev.scores.filter((s) => s.evaluatorId !== id),
          comments: prev.comments.filter((c) => c.evaluatorId !== id),
        }));
        return;
      }
      const firestore = requireDb();
      await Promise.all([
        deleteDocsWhereEquals(firestore, COLLECTIONS.scores, 'evaluatorId', id),
        deleteDocsWhereEquals(firestore, COLLECTIONS.comments, 'evaluatorId', id),
      ]);
      await deleteDoc(doc(firestore, COLLECTIONS.evaluators, id));
    },
    [isDemoMode, updateDemoState],
  );

  const addCandidate = useCallback(
    async (name: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          candidates: [...prev.candidates, { id: createLocalId('cand'), name, createdAt: Date.now() }],
        }));
        return;
      }
      await addDoc(collection(requireDb(), COLLECTIONS.candidates), { name, createdAt: Date.now() });
    },
    [isDemoMode, updateDemoState],
  );

  const updateCandidate = useCallback(
    async (id: string, updated: { name: string }) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          candidates: prev.candidates.map((c) => (c.id === id ? { ...c, name: updated.name } : c)),
        }));
        return;
      }
      await updateDoc(doc(requireDb(), COLLECTIONS.candidates, id), { name: updated.name });
    },
    [isDemoMode, updateDemoState],
  );

  const deleteCandidate = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          candidates: prev.candidates.filter((c) => c.id !== id),
          scores: prev.scores.filter((s) => s.candidateId !== id),
          comments: prev.comments.filter((c) => c.candidateId !== id),
        }));
        return;
      }
      const firestore = requireDb();
      await Promise.all([
        deleteDocsWhereEquals(firestore, COLLECTIONS.scores, 'candidateId', id),
        deleteDocsWhereEquals(firestore, COLLECTIONS.comments, 'candidateId', id),
      ]);
      await deleteDoc(doc(firestore, COLLECTIONS.candidates, id));
    },
    [isDemoMode, updateDemoState],
  );

  const addItem = useCallback(
    async (name: string, maxScore: number) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          items: [...prev.items, { id: createLocalId('item'), name, maxScore }],
        }));
        return;
      }
      await addDoc(collection(requireDb(), COLLECTIONS.items), { name, maxScore });
    },
    [isDemoMode, updateDemoState],
  );

  const updateItem = useCallback(
    async (id: string, updated: Omit<EvaluationItem, 'id'>) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        }));
        return;
      }
      await updateDoc(doc(requireDb(), COLLECTIONS.items, id), updated);
    },
    [isDemoMode, updateDemoState],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== id),
          scores: prev.scores.filter((s) => s.evaluationItemId !== id),
        }));
        return;
      }
      const firestore = requireDb();
      await deleteDocsWhereEquals(firestore, COLLECTIONS.scores, 'evaluationItemId', id);
      await deleteDoc(doc(firestore, COLLECTIONS.items, id));
    },
    [isDemoMode, updateDemoState],
  );

  const saveScore = useCallback(
    async (candidateId: string, evaluatorId: string, evaluationItemId: string, score: number) => {
      const deterministicId = `${candidateId}-${evaluatorId}-${evaluationItemId}`;
      if (isDemoMode) {
        updateDemoState((prev) => {
          const filtered = prev.scores.filter(
            (s) =>
              !(
                s.candidateId === candidateId &&
                s.evaluatorId === evaluatorId &&
                s.evaluationItemId === evaluationItemId
              ),
          );
          return {
            ...prev,
            scores: [...filtered, { id: deterministicId, candidateId, evaluatorId, evaluationItemId, score }],
          };
        });
        return;
      }

      const firestore = requireDb();
      const duplicateQuery = query(
        collection(firestore, COLLECTIONS.scores),
        where('candidateId', '==', candidateId),
        where('evaluatorId', '==', evaluatorId),
        where('evaluationItemId', '==', evaluationItemId),
      );

      const querySnapshot = await getDocs(duplicateQuery);
      const batch = writeBatch(firestore);

      querySnapshot.forEach((existingDoc) => {
        if (existingDoc.id !== deterministicId) {
          batch.delete(existingDoc.ref);
        }
      });

      batch.set(doc(firestore, COLLECTIONS.scores, deterministicId), {
        candidateId,
        evaluatorId,
        evaluationItemId,
        score,
      });

      await batch.commit();
    },
    [isDemoMode, updateDemoState],
  );

  const saveComment = useCallback(
    async (candidateId: string, evaluatorId: string, commentText: string) => {
      const docId = `${candidateId}-${evaluatorId}`;
      if (isDemoMode) {
        updateDemoState((prev) => {
          const filtered = prev.comments.filter(
            (c) => !(c.candidateId === candidateId && c.evaluatorId === evaluatorId),
          );
          return {
            ...prev,
            comments: [...filtered, { id: docId, candidateId, evaluatorId, commentText }],
          };
        });
        return;
      }
      await setDoc(doc(requireDb(), COLLECTIONS.comments, docId), { candidateId, evaluatorId, commentText });
    },
    [isDemoMode, updateDemoState],
  );

  const deleteComment = useCallback(
    async (candidateId: string, evaluatorId: string) => {
      const docId = `${candidateId}-${evaluatorId}`;
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => !(c.candidateId === candidateId && c.evaluatorId === evaluatorId)),
        }));
        return;
      }
      await deleteDoc(doc(requireDb(), COLLECTIONS.comments, docId));
    },
    [isDemoMode, updateDemoState],
  );

  const updateAdminSettings = useCallback(async (fields: UpdateData<DocumentData>) => {
    await updateDoc(doc(requireDb(), COLLECTIONS.settings, ADMIN_SETTINGS_DOC_ID), fields);
  }, []);

  const setAdminPassword = useCallback(
    async (password: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({ ...prev, adminPassword: password }));
        return;
      }
      await updateAdminSettings({ password });
    },
    [isDemoMode, updateAdminSettings, updateDemoState],
  );

  const resetAdminPassword = useCallback(async () => {
    if (isDemoMode) {
      updateDemoState((prev) => ({ ...prev, adminPassword: '' }));
      return;
    }
    await updateAdminSettings({ password: '' });
  }, [isDemoMode, updateAdminSettings, updateDemoState]);

  const setResultsPassword = useCallback(
    async (password: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({ ...prev, resultsPassword: password }));
        return;
      }
      await updateAdminSettings({ resultsPassword: password });
    },
    [isDemoMode, updateAdminSettings, updateDemoState],
  );

  const resetResultsPassword = useCallback(async () => {
    if (isDemoMode) {
      updateDemoState((prev) => ({ ...prev, resultsPassword: '' }));
      return;
    }
    await updateAdminSettings({ resultsPassword: '' });
  }, [isDemoMode, updateAdminSettings, updateDemoState]);

  const setSystemName = useCallback(
    async (name: string) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({ ...prev, systemName: name }));
        return;
      }
      await updateAdminSettings({ systemName: name });
    },
    [isDemoMode, updateAdminSettings, updateDemoState],
  );

  const setAllowScoreModification = useCallback(
    async (allow: boolean) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          allowScoreModification: allow,
          evaluators: prev.evaluators.map((e) => ({ ...e, scoringLocked: !allow })),
        }));
        return;
      }
      const firestore = requireDb();
      const evaluatorsSnapshot = await getDocs(collection(firestore, COLLECTIONS.evaluators));
      const batch = writeBatch(firestore);

      batch.update(doc(firestore, COLLECTIONS.settings, ADMIN_SETTINGS_DOC_ID), { allowScoreModification: allow });
      evaluatorsSnapshot.forEach((evaluatorDoc) => {
        batch.update(evaluatorDoc.ref, { scoringLocked: !allow });
      });

      await batch.commit();
    },
    [isDemoMode, updateDemoState],
  );

  const setEvaluatorScoringLock = useCallback(
    async (evaluatorId: string, locked: boolean) => {
      if (isDemoMode) {
        updateDemoState((prev) => ({
          ...prev,
          evaluators: prev.evaluators.map((e) => (e.id === evaluatorId ? { ...e, scoringLocked: locked } : e)),
        }));
        return;
      }
      await updateDoc(doc(requireDb(), COLLECTIONS.evaluators, evaluatorId), { scoringLocked: locked });
    },
    [isDemoMode, updateDemoState],
  );

  const value = useMemo<StoreContextType>(
    () => ({
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
      setResultsPassword,
      resetResultsPassword,
      setSystemName,
      resetStore,
      setAllowScoreModification,
      setEvaluatorScoringLock,
    }),
    [
      state,
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
      setResultsPassword,
      resetResultsPassword,
      setSystemName,
      resetStore,
      setAllowScoreModification,
      setEvaluatorScoringLock,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * Accesses the global evaluation store context. Must be called inside StoreProvider.
 */
export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
