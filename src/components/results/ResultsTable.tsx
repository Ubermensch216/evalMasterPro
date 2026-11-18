"use client";

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { calculateCandidateResults } from '@/lib/evaluation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ResultsTableProps {
  showDetails?: boolean;
}

export default function ResultsTable({ showDetails = false }: ResultsTableProps) {
  const { candidates, items, scores, evaluators, loading } = useStore();

  const results = useMemo(() => {
    if (loading) return [];
    return calculateCandidateResults({ candidates, evaluators, items, scores });
  }, [candidates, evaluators, items, scores, loading]);

  if (loading) {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return <p className="text-center text-muted-foreground py-8">아직 등록된 평가 대상자가 없습니다.</p>;
  }

  if (scores.length === 0) {
    return <p className="text-center text-muted-foreground py-8">아직 채점 결과가 없습니다.</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table className="min-w-[600px] md:min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-[80px]">순위</TableHead>
            <TableHead>이름</TableHead>
            <TableHead className="text-center w-[120px]">총점</TableHead>
            <TableHead className="text-center w-[120px]">평균</TableHead>
            {showDetails && <TableHead className="text-center w-[100px]">상세보기</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="text-center font-bold text-lg">{result.rank}</TableCell>
              <TableCell className="font-medium">{result.name}</TableCell>
              <TableCell className="text-center font-semibold">{result.totalScore.toFixed(2)}</TableCell>
              <TableCell className="text-center">{result.averageScore.toFixed(2)}</TableCell>
              {showDetails && (
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={`${result.name} 평가위원별 점수 보기`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{result.name} - 평가위원별 점수</DialogTitle>
                      </DialogHeader>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>평가위원</TableHead>
                            <TableHead className="text-right">점수</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.scoreByEvaluator.map((entry) => (
                            <TableRow key={entry.evaluatorId}>
                              <TableCell>{entry.evaluatorName}</TableCell>
                              <TableCell className="text-right">
                                {entry.hasScored ? entry.total : '미채점'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
