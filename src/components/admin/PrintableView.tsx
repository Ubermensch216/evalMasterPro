"use client";

import React from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    return evaluatorComments.find(c => c.candidateId === candidateId)?.commentText ?? "-";
  };

  return (
    <div ref={ref} className="p-8 bg-white text-black">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold">평가위원별 채점 결과 보고서</h1>
        <p className="text-xl mt-2">평가위원: <span className="font-semibold">{evaluator.name}</span></p>
      </header>
      
      <main>
        {candidates.map(candidate => (
          <Card key={candidate.id} className="mb-6 break-inside-avoid">
            <CardHeader>
              <CardTitle>{candidate.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/3">평가 항목</TableHead>
                    <TableHead className="text-center">배점</TableHead>
                    <TableHead className="text-center">점수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">{item.maxScore}</TableCell>
                      <TableCell className="text-center font-bold">{getScore(candidate.id, item.id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4"/>
              <div>
                <h4 className="font-bold mb-2">기타 의견</h4>
                <p className="text-sm p-3 border rounded-md min-h-[60px] bg-gray-50">{getComment(candidate.id)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="mt-20 text-right">
        <p className="text-lg">성명: <span className="font-bold inline-block w-48 border-b border-black text-center">{evaluator.name}</span> (서명)</p>
        <p className="text-sm mt-2">상기 내용은 사실과 틀림없음을 확인합니다.</p>
      </footer>
    </div>
  );
});
PrintableView.displayName = "PrintableView";
