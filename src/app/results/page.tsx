"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import ResultsTable from '@/components/results/ResultsTable';
import ResultsLogin from '@/components/results/ResultsLogin';
import PageLoadingSkeleton from '@/components/common/PageLoadingSkeleton';

export default function ResultsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { resultsPassword, superPassword, loading } = useStore();

  const handleLogin = (password: string) => {
    if (password === superPassword || (Boolean(resultsPassword) && password === resultsPassword)) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {!isAuthenticated ? (
        <ResultsLogin onLogin={handleLogin} />
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">채점 결과 집계</h1>
            <p className="mt-2 text-md text-muted-foreground">평가 대상자별 종합 점수 및 순위입니다.</p>
          </div>
          <ResultsTable />
        </>
      )}
    </div>
  );
}
