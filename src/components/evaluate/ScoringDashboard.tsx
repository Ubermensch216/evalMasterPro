
"use client";

import { useState, useMemo } from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, CheckCircle, AlertCircle, Loader2, Save, Lock, ShieldCheck, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ScoringSummaryView } from "./ScoringSummaryView";

interface ScoringDashboardProps {
  evaluator: Evaluator;
  onLogout: () => void;
}

type ScoresState = { [candidateId: string]: { [itemId: string]: number | undefined } };
type CommentsState = { [candidateId: string]: string | undefined };

export default function ScoringDashboard({ evaluator: initialEvaluator, onLogout }: ScoringDashboardProps) {
  const { systemName, evaluators, candidates, items, scores, comments, saveScore, saveComment, deleteComment, loading, allowScoreModification, setEvaluatorScoringLock } = useStore();
  const { toast } = useToast();

  const [localScores, setLocalScores] = useState<ScoresState>({});
  const [localComments, setLocalComments] = useState<CommentsState>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const evaluator = useMemo(() => evaluators.find(e => e.id === initialEvaluator.id) ?? initialEvaluator, [evaluators, initialEvaluator]);


  const hasEvaluatorScored = (candidateId: string) => {
    return scores.some(s => s.evaluatorId === evaluator.id && s.candidateId === candidateId);
  };
  
  const getStoredScore = (candidateId: string, itemId: string) => {
    return scores.find(s => s.evaluatorId === evaluator.id && s.candidateId === candidateId && s.evaluationItemId === itemId)?.score;
  }
  
  const getStoredComment = (candidateId: string) => {
      return comments.find(c => c.evaluatorId === evaluator.id && s.candidateId === candidateId)?.commentText;
  }

  const handleScoreChange = (candidateId: string, itemId: string, value: number, maxScore: number) => {
    let newScore: number | undefined = value;
    if (isNaN(newScore)) {
      newScore = undefined;
    } else {
      if (newScore < 0) newScore = 0;
      if (newScore > maxScore) newScore = maxScore;
    }
    
    setLocalScores(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [itemId]: newScore,
      }
    }));
  };
  
  const handleCommentChange = (candidateId: string, value: string) => {
    setLocalComments(prev => ({ ...prev, [candidateId]: value }));
  };

  const handleSubmit = async (candidateId: string) => {
    const scoresToSubmit: { [itemId: string]: number } = {};
    for (const item of items) {
        const score = localScores[candidateId]?.[item.id] ?? getStoredScore(candidateId, item.id);
        if (typeof score !== 'number') {
            toast({ title: "오류", description: `"${item.name}" 항목의 점수를 입력해주세요.`, variant: "destructive" });
            return;
        }
        scoresToSubmit[item.id] = score;
    }
    
    setIsSubmitting(candidateId);
    try {
      const scorePromises = Object.entries(scoresToSubmit).map(([itemId, score]) => {
        return saveScore(candidateId, evaluator.id, itemId, score);
      });
      await Promise.all(scorePromises);
  
      const commentToSave = localComments[candidateId] ?? getStoredComment(candidateId);
      if (commentToSave) {
        await saveComment(candidateId, evaluator.id, commentToSave);
      } else if (getStoredComment(candidateId) !== undefined) {
        await deleteComment(candidateId, evaluator.id);
      }
      
      toast({ title: "성공", description: `${candidates.find(c=>c.id === candidateId)?.name} 님의 채점 결과가 저장되었습니다.` });
      
    } catch (error) {
      console.error("Failed to save scores", error);
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleFinalSubmit = async () => {
    setIsCompleting(true);
    try {
        await setEvaluatorScoringLock(evaluator.id, true);
        toast({
            title: "평가 완료",
            description: "모든 채점 결과가 최종 제출되었습니다. 더 이상 수정할 수 없습니다."
        });
    } catch (error) {
        console.error("Failed to lock scoring:", error);
        toast({ title: "오류", description: "최종 제출 처리에 실패했습니다.", variant: "destructive" });
    } finally {
        setIsCompleting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary">채점 페이지</h1>
            <p className="text-muted-foreground">{evaluator.name} 위원님, 환영합니다.</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>채점 대상자 목록</CardTitle>
            <CardDescription>{allowScoreModification && !evaluator.scoringLocked ? "대상자를 선택하여 채점을 진행하세요. 저장 후에도 수정할 수 있습니다. 모든 평가 완료 후 하단의 '최종 평가 완료' 버튼을 눌러주세요." : "채점이 잠겨있습니다. 점수 확인만 가능합니다."}</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                  {candidates.map(candidate => {
                      const isScored = hasEvaluatorScored(candidate.id);
                      const isSaving = isSubmitting === candidate.id;
                      const isLocked = evaluator.scoringLocked || (!allowScoreModification && isScored);
                      return (
                          <AccordionItem value={candidate.id} key={candidate.id} disabled={isSaving}>
                              <AccordionTrigger disabled={isLocked && !evaluator.scoringLocked} className="text-lg">
                                  <div className="flex items-center gap-2">
                                      {isLocked ? <Lock className="h-5 w-5 text-destructive"/> : (isScored ? <CheckCircle className="h-5 w-5 text-green-500"/> : <AlertCircle className="h-5 w-5 text-yellow-500"/>)}
                                      {candidate.name}
                                      {isScored && <span className="text-sm font-normal ml-2">({isLocked ? '수정 불가' : '저장됨'})</span>}
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-8 p-2 md:p-4 border rounded-md">
                                  {items.map(item => {
                                    const currentScore = localScores[candidate.id]?.[item.id] ?? getStoredScore(candidate.id, item.id) ?? 0;
                                    return (
                                      <div key={item.id} className="grid grid-cols-1 gap-3">
                                          <Label htmlFor={`${candidate.id}-${item.id}`} className="text-base">{item.name} <span className="text-muted-foreground">({item.maxScore}점)</span></Label>
                                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
                                            <Slider
                                                id={`${candidate.id}-${item.id}-slider`}
                                                value={[currentScore]}
                                                onValueChange={(value) => handleScoreChange(candidate.id, item.id, value[0], item.maxScore)}
                                                max={item.maxScore}
                                                step={1}
                                                disabled={isLocked}
                                            />
                                            <Input 
                                                id={`${candidate.id}-${item.id}`}
                                                type="number"
                                                value={currentScore}
                                                readOnly
                                                className="w-full md:w-24 text-center text-lg bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 pointer-events-none"
                                                disabled={isLocked}
                                            />
                                          </div>
                                      </div>
                                    )
                                  })}
                                  <div className="space-y-2">
                                      <Label htmlFor={`comment-${candidate.id}`} className="text-base">기타 의견 (최대 300자)</Label>
                                      <Textarea 
                                        id={`comment-${candidate.id}`}
                                        value={localComments[candidate.id] ?? getStoredComment(candidate.id) ?? ''}
                                        onChange={(e) => handleCommentChange(candidate.id, e.target.value)}
                                        maxLength={300}
                                        className="min-h-[100px]"
                                        disabled={isLocked}
                                      />
                                  </div>
                                  {!isLocked && (
                                    <div className="flex justify-end">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button disabled={isSaving}>
                                                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  <Save className="mr-2 h-4 w-4" />
                                                  저장하기
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>채점 결과를 저장하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {allowScoreModification ? "저장 후에도 최종 평가 완료 전까지 수정할 수 있습니다." : "저장 후에는 수정할 수 없습니다. 계속하시겠습니까?"}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleSubmit(candidate.id)}>저장하기</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      )
                  })}
              </Accordion>
            )}
        </CardContent>
        {!evaluator.scoringLocked && (
             <CardFooter className="border-t px-6 py-4">
                 <div className="w-full flex justify-end items-center gap-2">
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                채점 내역 확인
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{evaluator.name} 위원 채점 내역</DialogTitle>
                            </DialogHeader>
                            <ScoringSummaryView 
                                evaluator={evaluator}
                                candidates={candidates}
                                items={items}
                                scores={scores}
                                comments={comments}
                                systemName={systemName}
                            />
                        </DialogContent>
                     </Dialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isCompleting}>
                                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                최종 평가 완료
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>정말 최종 제출하시겠습니까?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    이 작업을 수행하면 모든 채점 내용이 잠기며 더 이상 수정할 수 없습니다. 관리자만 이 잠금을 해제할 수 있습니다.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={handleFinalSubmit} className="bg-destructive hover:bg-destructive/90">최종 제출</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
             </CardFooter>
        )}
      </Card>
    </div>
  );
}
