"use client";

import { useMemo, useState } from 'react';
import { useStore, type Evaluator } from '@/lib/store';
import { makeCommentKey, makeScoreKey } from '@/lib/evaluation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScoringSummaryView } from './ScoringSummaryView';
import CandidateScorePanel from './CandidateScorePanel';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog';

interface ScoringDashboardProps {
  evaluator: Evaluator;
  onLogout: () => void;
}

type ScoresState = Record<string, Record<string, number | undefined>>;
type CommentsState = Record<string, string | undefined>;

export default function ScoringDashboard({ evaluator: initialEvaluator, onLogout }: ScoringDashboardProps) {
  const {
    evaluators,
    candidates,
    items,
    scores,
    comments,
    saveScore,
    saveComment,
    deleteComment,
    loading,
    allowScoreModification,
    setEvaluatorScoringLock,
  } = useStore();
  const { toast } = useToast();

  const [localScores, setLocalScores] = useState<ScoresState>({});
  const [localComments, setLocalComments] = useState<CommentsState>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const evaluator = useMemo(
    () => evaluators.find((e) => e.id === initialEvaluator.id) ?? initialEvaluator,
    [evaluators, initialEvaluator],
  );

  // Index stored scores and comments for O(1) lookup per candidate/item cell.
  const { scoredCandidateIds, storedScoreMap, storedCommentMap } = useMemo(() => {
    const candidateIds = new Set<string>();
    const scoreMap = new Map<string, number>();
    const commentMap = new Map<string, string>();

    for (const score of scores) {
      if (score.evaluatorId === evaluator.id) {
        candidateIds.add(score.candidateId);
        scoreMap.set(makeScoreKey(score.candidateId, evaluator.id, score.evaluationItemId), score.score);
      }
    }

    for (const comment of comments) {
      if (comment.evaluatorId === evaluator.id) {
        commentMap.set(makeCommentKey(comment.candidateId, evaluator.id), comment.commentText);
      }
    }

    return {
      scoredCandidateIds: candidateIds,
      storedScoreMap: scoreMap,
      storedCommentMap: commentMap,
    };
  }, [scores, comments, evaluator.id]);

  const getStoredScore = (candidateId: string, itemId: string) =>
    storedScoreMap.get(makeScoreKey(candidateId, evaluator.id, itemId));

  const getStoredComment = (candidateId: string) =>
    storedCommentMap.get(makeCommentKey(candidateId, evaluator.id));

  const handleScoreChange = (candidateId: string, itemId: string, value: number, maxScore: number) => {
    let clamped: number | undefined = value;
    if (Number.isNaN(clamped)) {
      clamped = undefined;
    } else {
      clamped = Math.min(Math.max(clamped, 0), maxScore);
    }

    setLocalScores((prev) => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [itemId]: clamped,
      },
    }));
  };

  const handleCommentChange = (candidateId: string, value: string) => {
    setLocalComments((prev) => ({ ...prev, [candidateId]: value }));
  };

  const handleSubmit = async (candidateId: string) => {
    const scoresToSubmit: Record<string, number> = {};
    for (const item of items) {
      // Default untouched sliders to 0 so evaluators can intentionally submit 0 points.
      scoresToSubmit[item.id] = localScores[candidateId]?.[item.id] ?? getStoredScore(candidateId, item.id) ?? 0;
    }

    setIsSubmitting(candidateId);
    try {
      await Promise.all(
        Object.entries(scoresToSubmit).map(([itemId, score]) => saveScore(candidateId, evaluator.id, itemId, score)),
      );

      const commentToSave = localComments[candidateId] ?? getStoredComment(candidateId);
      if (commentToSave) {
        await saveComment(candidateId, evaluator.id, commentToSave);
      } else if (getStoredComment(candidateId) !== undefined) {
        await deleteComment(candidateId, evaluator.id);
      }

      const candidateName = candidates.find((c) => c.id === candidateId)?.name;
      toast({ title: '성공', description: `${candidateName} 님의 채점 결과가 저장되었습니다.` });
    } catch (error) {
      console.error('Failed to save scores', error);
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleFinalSubmit = async () => {
    setIsCompleting(true);
    try {
      await setEvaluatorScoringLock(evaluator.id, true);
      toast({
        title: '평가 완료',
        description: '모든 채점 결과가 최종 제출되었습니다. 더 이상 수정할 수 없습니다.',
      });
    } catch (error) {
      console.error('Failed to lock scoring:', error);
      toast({ title: '오류', description: '최종 제출 처리에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsCompleting(false);
    }
  };

  const isModificationAllowed = allowScoreModification && !evaluator.scoringLocked;

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
          <CardDescription>
            {isModificationAllowed
              ? "대상자를 선택하여 채점을 진행하세요. 저장 후에도 수정할 수 있습니다. 모든 평가 완료 후 하단의 '최종 평가 완료' 버튼을 눌러주세요."
              : '채점이 잠겨있습니다. 점수 확인만 가능합니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">아직 등록된 평가 대상자가 없습니다.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {candidates.map((candidate) => {
                const isScored = scoredCandidateIds.has(candidate.id);
                const isSaving = isSubmitting === candidate.id;
                const isLocked = evaluator.scoringLocked || (!allowScoreModification && isScored);

                return (
                  <CandidateScorePanel
                    key={candidate.id}
                    candidate={candidate}
                    items={items}
                    isScored={isScored}
                    isLocked={isLocked}
                    isSaving={isSaving}
                    allowScoreModification={allowScoreModification}
                    getItemScore={(itemId) =>
                      localScores[candidate.id]?.[itemId] ?? getStoredScore(candidate.id, itemId) ?? 0
                    }
                    comment={localComments[candidate.id] ?? getStoredComment(candidate.id) ?? ''}
                    onScoreChange={(itemId, value, maxScore) =>
                      handleScoreChange(candidate.id, itemId, value, maxScore)
                    }
                    onCommentChange={(value) => handleCommentChange(candidate.id, value)}
                    onSubmit={() => handleSubmit(candidate.id)}
                  />
                );
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
                  />
                </DialogContent>
              </Dialog>

              <ConfirmActionDialog
                trigger={
                  <Button variant="destructive" disabled={isCompleting}>
                    {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    최종 평가 완료
                  </Button>
                }
                title="정말 최종 제출하시겠습니까?"
                description="이 작업을 수행하면 모든 채점 내용이 잠기며 더 이상 수정할 수 없습니다. 관리자만 이 잠금을 해제할 수 있습니다."
                confirmLabel="최종 제출"
                destructive
                isLoading={isCompleting}
                onConfirm={handleFinalSubmit}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
