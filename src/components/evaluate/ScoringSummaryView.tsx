"use client";

import React from 'react';
import { type Candidate, type Comment, type EvaluationItem, type Evaluator, type Score } from '@/lib/store';
import { buildEvaluatorReportData, formatKoreanDate } from '@/lib/evaluation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ScoringSummaryViewProps {
  evaluator: Evaluator;
  candidates: Candidate[];
  items: EvaluationItem[];
  scores: Score[];
  comments: Comment[];
}

export const ScoringSummaryView = React.forwardRef<HTMLDivElement, ScoringSummaryViewProps>(
  ({ evaluator, candidates, items, scores, comments }, ref) => {
    const { rows, totalMaxScore } = buildEvaluatorReportData({
      evaluatorId: evaluator.id,
      candidates,
      items,
      scores,
      comments,
    });
    const currentDate = formatKoreanDate();

    return (
      <div ref={ref} className="summary-view p-1">
        <header className="mb-6">
          <p className="text-lg font-semibold">{evaluator.name} 위원님</p>
          <p className="text-sm text-muted-foreground">{currentDate} 기준, 현재까지의 채점 내역입니다.</p>
        </header>

        <main>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">평가 대상자</TableHead>
                  {items.map((item) => (
                    <TableHead key={item.id} className="text-center">
                      {item.name}
                      <br />({item.maxScore}점)
                    </TableHead>
                  ))}
                  <TableHead className="text-center">
                    총점
                    <br />({totalMaxScore}점)
                  </TableHead>
                  <TableHead className="min-w-[150px]">기타 의견</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.candidate.id}>
                    <TableCell className="font-medium">{row.candidate.name}</TableCell>
                    {items.map((item) => (
                      <TableCell key={item.id} className="text-center">
                        {row.scoresByItem[item.id] ?? '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold text-primary">{row.totalScore}</TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap break-words max-w-xs">{row.comment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    );
  },
);

ScoringSummaryView.displayName = 'ScoringSummaryView';
