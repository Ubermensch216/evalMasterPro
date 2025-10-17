
"use client";

import React from "react";
import { type Evaluator, type Candidate, type EvaluationItem, type Score, type Comment } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScoringSummaryViewProps {
  evaluator: Evaluator;
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
  systemName: string;
}

export const ScoringSummaryView = React.forwardRef<HTMLDivElement, ScoringSummaryViewProps>(
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
      <div ref={ref} className="summary-view p-1">
        <header className="mb-6">
          <p className="text-lg font-semibold">{evaluator.name} 위원님</p>
          <p className="text-sm text-muted-foreground">
            {printDate} 기준, 현재까지의 채점 내역입니다.
          </p>
        </header>
        
        <main>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">평가 대상자</TableHead>
                  {items.map(item => (
                    <TableHead key={item.id} className="text-center">{item.name}<br/>({item.maxScore}점)</TableHead>
                  ))}
                  <TableHead className="text-center">총점<br/>({totalMaxScore}점)</TableHead>
                  <TableHead className="min-w-[150px]">기타 의견</TableHead>
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
                    <TableCell className="text-center font-bold text-primary">
                      {getTotalScore(candidate.id)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap break-words max-w-xs">
                      {getComment(candidate.id)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    );
  }
);

ScoringSummaryView.displayName = 'ScoringSummaryView';
