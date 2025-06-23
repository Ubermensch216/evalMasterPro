"use client";

import React from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PrintableViewProps {
  evaluator: Evaluator;
}

export const PrintableView = React.forwardRef<HTMLDivElement, PrintableViewProps>(({ evaluator }, ref) => {
  const { candidates, items, scores, comments } = useStore();

  const evaluatorScores = scores.filter(s => s.evaluatorId === evaluator.id);
  const evaluatorComments = comments.filter(c => c.evaluatorId === evaluator.id);

  const getScore = (candidateId: string, itemId: string) => {
    return evaluatorScores.find(s => s.candidateId === candidateId && s.evaluationItemId === itemId)?.score ?? "-";
  };

  const getComment = (candidateId: string) => {
    return evaluatorComments.find(c => c.candidateId === candidateId)?.commentText ?? "";
  };

  const getTotalScore = (candidateId: string) => {
    return evaluatorScores
        .filter(s => s.candidateId === candidateId)
        .reduce((sum, s) => sum + s.score, 0);
  };

  const totalMaxScore = items.reduce((sum, item) => sum + item.maxScore, 0);

  return (
    <div ref={ref} className="p-8 bg-white text-black">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold">평가위원별 채점 결과 보고서</h1>
        <p className="text-xl mt-2">평가위원: <span className="font-semibold">{evaluator.name}</span></p>
      </header>
      
      <main>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">평가 대상자</TableHead>
              {items.map(item => (
                <TableHead key={item.id} className="text-center min-w-[100px]">{item.name}<br/>({item.maxScore}점)</TableHead>
              ))}
              <TableHead className="text-center min-w-[80px]">총점<br/>({totalMaxScore}점)</TableHead>
              <TableHead className="min-w-[200px]">기타 의견</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map(candidate => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                {items.map(item => (
                  <TableCell key={item.id} className="text-center">
                    {getScore(candidate.id, item.id)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold">
                  {getTotalScore(candidate.id)}
                </TableCell>
                <TableCell className="text-sm whitespace-pre-wrap break-all">
                  {getComment(candidate.id)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>

      <footer className="mt-20 text-right">
        <p className="text-lg">성명: <span className="font-bold inline-block w-48 border-b border-black text-center">{evaluator.name}</span> (서명)</p>
        <p className="text-sm mt-2">상기 내용은 사실과 틀림없음을 확인합니다.</p>
      </footer>
    </div>
  );
});
PrintableView.displayName = "PrintableView";
