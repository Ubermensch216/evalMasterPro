
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
  const { systemName, evaluators, candidates, items, scores, comments } = useStore();
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const selectedEvaluator = evaluators.find(e => e.id === selectedEvaluatorId);

  const handlePrint = () => {
    const printContent = printComponentRef.current;
    if (!printContent || !selectedEvaluator) return;

    const printWindow = window.open('', '', 'height=800,width=1200');
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
          /* Define theme variables for print */
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 3.9%;
            --primary: 231 48% 48%;
            --muted: 0 0% 96.1%;
          }

          /* Basic print setup */
          @media print {
            @page {
              size: A4 landscape; /* Use landscape for wider tables */
              margin: 1.5cm;
            }

            html, body {
              font-family: 'PT Sans', sans-serif;
              font-size: 10pt;
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print { display: none !important; }
            tr, footer { page-break-inside: avoid !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            thead { display: table-header-group !important; }
          }
          
          /* Report-specific styles */
          .report-header {
             border-bottom: 2px solid #333 !important;
             padding-bottom: 1rem !important;
             margin-bottom: 2rem !important;
          }
          .report-title {
              color: hsl(var(--primary)) !important;
              font-size: 24pt !important;
          }
          .report-info {
              padding-bottom: 1rem !important;
              border-bottom: 1px solid #ccc !important;
          }
          .report-table thead {
             background-color: hsl(var(--muted)) !important;
             color: hsl(var(--foreground)) !important;
          }
          .report-table th, .report-table td {
             border: 1px solid #ddd !important;
             padding: 0.75rem !important;
             vertical-align: middle !important;
             text-align: center;
          }
          .report-table th:first-child, .report-table td:first-child,
          .report-table th:last-child, .report-table td:last-child {
              text-align: left;
          }
          .report-table tbody tr:nth-child(even) {
            background-color: hsl(var(--muted)) !important;
          }
          .report-table .font-bold {
              font-weight: 700 !important;
          }
           /* Total Score column */
          .report-table td:nth-child(${items.length + 2}) {
            background-color: hsla(var(--primary), 0.1) !important;
          }

          .report-footer {
            padding-top: 2rem !important;
            margin-top: 4rem !important;
            border-top: 2px solid #333 !important;
          }
        </style>
      `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
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
                            systemName={systemName}
                        />
                    </DialogContent>
                )}
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
