"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Loader2, Lock, Save } from 'lucide-react';
import { MAX_COMMENT_LENGTH, type Candidate, type EvaluationItem } from '@/types/evaluation';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog';

interface CandidateScorePanelProps {
  candidate: Candidate;
  items: EvaluationItem[];
  isScored: boolean;
  isLocked: boolean;
  isSaving: boolean;
  allowScoreModification: boolean;
  getItemScore: (itemId: string) => number;
  comment: string;
  onScoreChange: (itemId: string, value: number, maxScore: number) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}

/**
 * Collapsible scoring form for a single candidate inside ScoringDashboard.
 */
export default function CandidateScorePanel({
  candidate,
  items,
  isScored,
  isLocked,
  isSaving,
  allowScoreModification,
  getItemScore,
  comment,
  onScoreChange,
  onCommentChange,
  onSubmit,
}: CandidateScorePanelProps) {
  return (
    <AccordionItem value={candidate.id} disabled={isSaving}>
      <AccordionTrigger className="text-lg">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-5 w-5 text-destructive" />
          ) : isScored ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          {candidate.name}
          {isScored && <span className="text-sm font-normal ml-2">({isLocked ? '수정 불가' : '저장됨'})</span>}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-8 p-2 md:p-4 border rounded-md">
          {items.map((item) => {
            const currentScore = getItemScore(item.id);
            return (
              <div key={item.id} className="grid grid-cols-1 gap-3">
                <Label htmlFor={`${candidate.id}-${item.id}`} className="text-base">
                  {item.name} <span className="text-muted-foreground">({item.maxScore}점)</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
                  <Slider
                    id={`${candidate.id}-${item.id}-slider`}
                    value={[currentScore]}
                    onValueChange={(value) => onScoreChange(item.id, value[0], item.maxScore)}
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
            );
          })}

          <div className="space-y-2">
            <Label htmlFor={`comment-${candidate.id}`} className="text-base">
              기타 의견 (최대 {MAX_COMMENT_LENGTH}자)
            </Label>
            <Textarea
              id={`comment-${candidate.id}`}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              className="min-h-[100px]"
              disabled={isLocked}
            />
          </div>

          {!isLocked && (
            <div className="flex justify-end">
              <ConfirmActionDialog
                trigger={
                  <Button disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    저장하기
                  </Button>
                }
                title="채점 결과를 저장하시겠습니까?"
                description={
                  allowScoreModification
                    ? '저장 후에도 최종 평가 완료 전까지 수정할 수 있습니다.'
                    : '저장 후에는 수정할 수 없습니다. 계속하시겠습니까?'
                }
                confirmLabel="저장하기"
                isLoading={isSaving}
                onConfirm={onSubmit}
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
