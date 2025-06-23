"use client";

import { useStore, type Evaluator } from "@/lib/store";
import ResultsTable from "@/components/results/ResultsTable";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Printer, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PrintableView } from "./PrintableView";
import ReactToPrint from "react-to-print";
import { cn } from "@/lib/utils";

export default function ResultAggregation() {
  const { evaluators } = useStore();
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedEvaluator = evaluators.find(e => e.id === selectedEvaluatorId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>채점 결과 집계</CardTitle>
          <CardDescription>평가 대상자별 종합 점수 및 순위입니다. 상세 보기는 여기에서만 제공됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsTable showDetails />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>평가위원별 보고서 출력</CardTitle>
          <CardDescription>평가위원을 선택하여 채점 내역 보고서를 조회하고 출력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <Select onValueChange={setSelectedEvaluatorId} value={selectedEvaluatorId ?? undefined}>
                <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder={<div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span>평가위원을 선택하세요</span></div>} />
                </SelectTrigger>
                <SelectContent>
                    {evaluators.map((evaluator) => (
                        <SelectItem key={evaluator.id} value={evaluator.id}>{evaluator.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Dialog>
                <DialogTrigger asChild>
                    <Button disabled={!selectedEvaluator} className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" />
                        보고서 보기
                    </Button>
                </DialogTrigger>
                {selectedEvaluator && (
                     <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedEvaluator.name} 위원 채점 보고서</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                           <div className="no-print absolute top-4 right-16">
                             <ReactToPrint
                                trigger={() => (
                                    <button className={cn(buttonVariants())}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        인쇄
                                    </button>
                                )}
                                content={() => printRef.current}
                                documentTitle={`${selectedEvaluator?.name ?? ''} 평가위원 채점 결과`}
                              />
                           </div>
                           <PrintableView ref={printRef} evaluator={selectedEvaluator} />
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
