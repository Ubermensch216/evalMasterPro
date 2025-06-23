"use client";

import { useState } from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoringDashboardProps {
  evaluator: Evaluator;
  onLogout: () => void;
}

type ScoresState = { [candidateId: string]: { [itemId: string]: number } };
type CommentsState = { [candidateId: string]: string };

export default function ScoringDashboard({ evaluator, onLogout }: ScoringDashboardProps) {
  const { candidates, items, scores, comments, addScore, addComment, loading } = useStore();
  const { toast } = useToast();

  const getInitialScores = () => {
    const initialState: ScoresState = {};
    candidates.forEach(c => {
      initialState[c.id] = {};
    });
    return initialState;
  };

  const getInitialComments = () => {
    const initialState: CommentsState = {};
    candidates.forEach(c => {
      initialState[c.id] = "";
    });
    return initialState;
  };

  const [localScores, setLocalScores] = useState<ScoresState>(getInitialScores);
  const [localComments, setLocalComments] = useState<CommentsState>(getInitialComments);
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
    let newScore = parseInt(value, 10);
    if (isNaN(newScore)) newScore = 0;
    if (newScore < 0) newScore = 0;
    if (newScore > maxScore) newScore = maxScore;
    
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
    const candidateScores = localScores[candidateId];
    if (Object.keys(candidateScores).length !== items.length) {
      toast({ title: "오류", description: "모든 항목을 채점해주세요.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(candidateId);
    try {
      const scorePromises = items.map(item => {
        return addScore(candidateId, evaluator.id, item.id, candidateScores[item.id]);
      });
      await Promise.all(scorePromises);
  
      const comment = localComments[candidateId];
      if (comment) {
        await addComment(candidateId, evaluator.id, comment);
      }
      
      toast({ title: "성공", description: `${candidates.find(c=>c.id === candidateId)?.name} 님의 채점이 완료되었습니다.` });

    } catch (error) {
      console.error("Failed to submit score", error);
      toast({ title: "오류", description: "채점 제출에 실패했습니다.", variant: "destructive" });
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
            <CardDescription>대상자를 선택하여 채점을 진행하세요. 완료된 채점은 수정할 수 없습니다.</CardDescription>
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
                      return (
                          <AccordionItem value={candidate.id} key={candidate.id} disabled={isScored || isSaving}>
                              <AccordionTrigger className={`${isScored ? "text-muted-foreground" : ""}`}>
                                  <div className="flex items-center gap-2">
                                      {isScored ? <CheckCircle className="h-5 w-5 text-green-500"/> : <AlertCircle className="h-5 w-5 text-yellow-500"/>}
                                      {candidate.name}
                                      {isScored && <span className="text-sm font-normal ml-2">(채점 완료)</span>}
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-6 p-4 border rounded-md">
                                  {items.map(item => (
                                      <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                                          <Label htmlFor={`${candidate.id}-${item.id}`}>{item.name}</Label>
                                          <Input 
                                              id={`${candidate.id}-${item.id}`}
                                              type="number"
                                              value={isScored ? getStoredScore(candidate.id, item.id) : localScores[candidate.id]?.[item.id] ?? ''}
                                              onChange={(e) => handleScoreChange(candidate.id, item.id, e.target.value, item.maxScore)}
                                              max={item.maxScore}
                                              min={0}
                                              disabled={isScored}
                                              className="w-full"
                                          />
                                          <p className="text-sm text-muted-foreground">/ {item.maxScore}점</p>
                                      </div>
                                  ))}
                                  <div className="space-y-2">
                                      <Label htmlFor={`comment-${candidate.id}`}>기타 의견 (최대 300자)</Label>
                                      <Textarea 
                                        id={`comment-${candidate.id}`}
                                        value={isScored ? getStoredComment(candidate.id) : localComments[candidate.id] || ''}
                                        onChange={(e) => handleCommentChange(candidate.id, e.target.value)}
                                        maxLength={300}
                                        disabled={isScored}
                                        className="min-h-[100px]"
                                      />
                                  </div>
                                  {!isScored && (
                                      <div className="flex justify-end">
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button disabled={isSaving}>
                                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    채점 완료
                                                  </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                      <AlertDialogTitle>채점을 완료하시겠습니까?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                          '채점 완료'를 누르면 더 이상 수정할 수 없습니다. 제출하시겠습니까?
                                                      </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleSubmit(candidate.id)}>채점 완료</AlertDialogAction>
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
      </Card>
    </div>
  );
}
