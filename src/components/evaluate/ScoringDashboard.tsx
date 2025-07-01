
"use client";

import { useState, useEffect } from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, CheckCircle, AlertCircle, Loader2, Save, Lock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoringDashboardProps {
  evaluator: Evaluator;
  onLogout: () => void;
}

type ScoresState = { [candidateId: string]: { [itemId: string]: number | undefined } };
type CommentsState = { [candidateId: string]: string | undefined };

export default function ScoringDashboard({ evaluator, onLogout }: ScoringDashboardProps) {
  const { candidates, items, scores, comments, saveScore, saveComment, deleteComment, loading, allowScoreModification } = useStore();
  const { toast } = useToast();

  const [localScores, setLocalScores] = useState<ScoresState>({});
  const [localComments, setLocalComments] = useState<CommentsState>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const hasEvaluatorScored = (candidateId: string) => {
    return scores.some(s => s.evaluatorId === evaluator.id && s.candidateId === candidateId);
  };
  
  const getStoredScore = (candidateId: string, itemId: string) => {
    return scores.find(s => s.evaluatorId === evaluator.id && s.candidateId === candidateId && s.evaluationItemId === itemId)?.score;
  }
  
  const getStoredComment = (candidateId: string) => {
      return comments.find(c => c.evaluatorId === evaluator.id && c.candidateId === candidateId)?.commentText;
  }

  const handleScoreChange = (candidateId: string, itemId: string, value: string, maxScore: number) => {
    let newScore: number | undefined = parseInt(value, 10);
    if (isNaN(newScore)) newScore = undefined;
    else {
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
      
      setLocalScores(prev => ({ ...prev, [candidateId]: undefined }));
      setLocalComments(prev => ({...prev, [candidateId]: undefined}));

    } catch (error) {
      console.error("Failed to save scores", error);
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <CardDescription>{allowScoreModification ? "대상자를 선택하여 채점을 진행하세요. 저장 후에도 언제든지 다시 수정할 수 있습니다." : "대상자를 선택하여 채점을 진행하세요. 저장 후에는 수정이 불가능하니 신중하게 평가해주세요."}</CardDescription>
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
                      const isLocked = !allowScoreModification && isScored;
                      return (
                          <AccordionItem value={candidate.id} key={candidate.id} disabled={isSaving || isLocked}>
                              <AccordionTrigger>
                                  <div className="flex items-center gap-2">
                                      {isLocked ? <Lock className="h-5 w-5 text-destructive"/> : (isScored ? <CheckCircle className="h-5 w-5 text-green-500"/> : <AlertCircle className="h-5 w-5 text-yellow-500"/>)}
                                      {candidate.name}
                                      {isScored && <span className="text-sm font-normal ml-2">({isLocked ? '수정 불가' : '저장됨'})</span>}
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-6 p-4 border rounded-md">
                                  {items.map(item => (
                                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-center gap-2">
                                        <Label htmlFor={`${candidate.id}-${item.id}`}>{item.name}</Label>
                                        <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
                                          <Input 
                                              id={`${candidate.id}-${item.id}`}
                                              type="number"
                                              value={localScores[candidate.id]?.[item.id] ?? getStoredScore(candidate.id, item.id) ?? ''}
                                              onChange={(e) => handleScoreChange(candidate.id, item.id, e.target.value, item.maxScore)}
                                              max={item.maxScore}
                                              min={0}
                                              className="w-28"
                                              disabled={isLocked}
                                          />
                                          <p className="text-sm text-muted-foreground whitespace-nowrap">/ {item.maxScore}점</p>
                                        </div>
                                    </div>
                                  ))}
                                  <div className="space-y-2">
                                      <Label htmlFor={`comment-${candidate.id}`}>기타 의견 (최대 300자)</Label>
                                      <Textarea 
                                        id={`comment-${candidate.id}`}
                                        value={localComments[candidate.id] ?? getStoredComment(candidate.id) ?? ''}
                                        onChange={(e) => handleCommentChange(candidate.id, e.target.value)}
                                        maxLength={300}
                                        className="min-h-[100px]"
                                        disabled={isLocked}
                                      />
                                  </div>
                                  <div className="flex justify-end">
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                              <Button disabled={isSaving || isLocked}>
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Save className="mr-2 h-4 w-4" />
                                                저장하기
                                              </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>채점 결과를 저장하시겠습니까?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                      {allowScoreModification ? "저장 후에도 언제든지 다시 수정할 수 있습니다." : "저장 후에는 수정할 수 없습니다. 계속하시겠습니까?"}
                                                  </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleSubmit(candidate.id)}>저장하기</AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      )
                  })}
              </Accordion>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
