"use client";

import { useStore } from "@/lib/store";
import ResultsTable from "@/components/results/ResultsTable";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Printer, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PrintableView } from "./PrintableView";
import { cn } from "@/lib/utils";

export default function ResultAggregation() {
  const { evaluators, candidates, items, scores, comments } = useStore();
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const selectedEvaluator = evaluators.find(e => e.id === selectedEvaluatorId);

  const handlePrint = () => {
    const printContent = printComponentRef.current;
    if (!printContent || !selectedEvaluator) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
      alert('팝업 창이 차단되었습니다. 팝업을 허용하고 다시 시도해 주세요.');
      return;
    }

    printWindow.document.write(`<html><head><title>${selectedEvaluator.name} 위원 채점 보고서</title>`);

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    styles.forEach(style => {
      printWindow.document.write(style.outerHTML);
    });

    printWindow.document.write(`
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body { margin: 1.5rem; }
        </style>
      `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

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
                     <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto printable-dialog-content">
                        <DialogHeader className="flex-row items-center justify-between pr-6 no-print">
                            <DialogTitle>{selectedEvaluator.name} 위원 채점 보고서</DialogTitle>
                            <button
                              onClick={handlePrint}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄
                            </button>
                        </DialogHeader>
                        <PrintableView
                            ref={printComponentRef}
                            evaluator={selectedEvaluator}
                            candidates={candidates}
                            items={items}
                            scores={scores}
                            comments={comments}
                        />
                    </DialogContent>
                )}
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
