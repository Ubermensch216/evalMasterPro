"use client";

import React from "react";
import { type Evaluator, type Candidate, type EvaluationItem, type Score, type Comment } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PrintableViewProps {
  evaluator: Evaluator;
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  systemName: string;
}

export const PrintableView = React.forwardRef<HTMLDivElement, PrintableViewProps>(
  ({ evaluator, candidates, items, scores, comments, systemName }, ref) => {
    const evaluatorScores = scores.filter(s => s.evaluatorId === evaluator.id);
    const evaluatorComments = comments.filter(c => c.evaluatorId === evaluator.id);

    const getScore = (candidateId: string, itemId: string) => {
      const score = evaluatorScores.find(s => s.candidateId === candidateId && s.evaluationItemId === itemId);
      return score !== undefined ? score.score : "-";
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

    const printDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div ref={ref} className="printable-report p-8 bg-white text-black font-sans">
        <header className="report-header mb-10 text-center">
          <h1 className="text-3xl font-bold report-title">{systemName}</h1>
          <p className="text-xl mt-4">평가위원별 채점 결과 보고서</p>
        </header>

        <div className="report-info mb-8 grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm text-gray-500">평가위원</p>
                <p className="font-semibold text-lg">{evaluator.name}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">평가일</p>
                <p className="font-semibold text-lg">{printDate}</p>
            </div>
        </div>
        
        <main>
          <Table className="report-table">
            <TableHeader>
              <TableRow>
                <TableHead>평가 대상자</TableHead>
                {items.map(item => (
                  <TableHead key={item.id} className="text-center">{item.name}<br/>({item.maxScore}점)</TableHead>
                ))}
                <TableHead className="text-center">총점<br/>({totalMaxScore}점)</TableHead>
                <TableHead>기타 의견</TableHead>
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

        <footer className="report-footer mt-20">
          <p className="text-center text-lg mb-16">
            상기 내용은 사실과 틀림없음을 확인합니다.
          </p>
          <div className="text-right">
              <p className="text-lg">
                성명: <span className="font-bold inline-block w-48 border-b border-black text-center pb-1">{evaluator.name}</span> (서명)
              </p>
          </div>
        </footer>
      </div>
    );
  }
);

PrintableView.displayName = 'PrintableView';
