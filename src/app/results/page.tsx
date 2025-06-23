"use client";

import ResultsTable from "@/components/results/ResultsTable";

export default function ResultsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">채점 결과 집계</h1>
        <p className="mt-2 text-md text-muted-foreground">
          평가 대상자별 종합 점수 및 순위입니다.
        </p>
      </div>
      <ResultsTable />
    </div>
  );
}
