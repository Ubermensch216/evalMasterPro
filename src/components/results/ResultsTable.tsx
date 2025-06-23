"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsTableProps {
  showDetails?: boolean;
}

export default function ResultsTable({ showDetails = false }: ResultsTableProps) {
  const { candidates, items, scores, evaluators, loading } = useStore();

  const results = useMemo(() => {
    if (loading) return [];

    const candidateScores = candidates.map(candidate => {
      const candidateId = candidate.id;
      const relatedScores = scores.filter(s => s.candidateId === candidateId);
      const totalScore = relatedScores.reduce((acc, s) => acc + s.score, 0);
      const numEvaluatorsWhoScored = new Set(relatedScores.map(s => s.evaluatorId)).size;
      const averageScore = numEvaluatorsWhoScored > 0 ? totalScore / numEvaluatorsWhoScored : 0;
      
      const scoreByEvaluator = evaluators.map(evaluator => {
          const evaluatorScores = relatedScores.filter(s => s.evaluatorId === evaluator.id);
          const total = evaluatorScores.reduce((sum, s) => sum + s.score, 0);
          return {
              evaluatorName: evaluator.name,
              total,
          }
      });

      return {
        id: candidate.id,
        name: candidate.name,
        totalScore,
        averageScore,
        scoreByEvaluator,
      };
    });

    const sortedResults = [...candidateScores].sort((a, b) => b.totalScore - a.totalScore);

    return sortedResults.map((res, index) => ({
      ...res,
      rank: index + 1,
    }));
  }, [candidates, scores, evaluators, loading]);
  
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-[15%]">순위</TableHead>
            <TableHead className="w-[30%]">이름</TableHead>
            <TableHead className="text-center w-[20%]">총점</TableHead>
            <TableHead className="text-center w-[20%]">평균</TableHead>
            {showDetails && <TableHead className="text-center w-[15%]">상세보기</TableHead>}
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
                       <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
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
                                {result.scoreByEvaluator.map(score => (
                                    <TableRow key={score.evaluatorName}>
                                        <TableCell>{score.evaluatorName}</TableCell>
                                        <TableCell className="text-right">{score.total > 0 ? score.total : '미채점'}</TableCell>
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
