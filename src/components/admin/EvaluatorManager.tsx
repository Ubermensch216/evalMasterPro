"use client";

import { useState } from 'react';
import { useStore, type Evaluator } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import EntityDialog from '@/components/admin/EntityDialog';
import AdminTableActions from '@/components/admin/AdminTableActions';

export default function EvaluatorManager() {
  const { evaluators, addEvaluator, updateEvaluator, deleteEvaluator, setEvaluatorScoringLock } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEvaluator, setCurrentEvaluator] = useState<Partial<Evaluator>>({});
  const { toast } = useToast();

  const handleSave = async () => {
    const trimmedName = currentEvaluator.name?.trim();
    const password = currentEvaluator.password ?? '';
    if (!trimmedName || !password) {
      toast({ title: '오류', description: '이름과 비밀번호를 모두 입력해주세요.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentEvaluator.id) {
        await updateEvaluator(currentEvaluator.id, { name: trimmedName, password });
        toast({ title: '성공', description: '평가 위원 정보가 수정되었습니다.' });
      } else {
        await addEvaluator(trimmedName, password);
        toast({ title: '성공', description: '새 평가 위원이 추가되었습니다.' });
      }
      setCurrentEvaluator({});
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save evaluator:', error);
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvaluator(id);
      toast({ title: '성공', description: '평가 위원이 삭제되었습니다.' });
    } catch (error) {
      console.error('Failed to delete evaluator:', error);
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleLockToggle = async (evaluatorId: string, locked: boolean) => {
    try {
      await setEvaluatorScoringLock(evaluatorId, locked);
      toast({ title: '성공', description: `채점 상태가 ${locked ? '잠금' : '해제'}되었습니다.` });
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 위원 관리</CardTitle>
            <CardDescription>평가 위원을 추가, 수정, 삭제하고 채점 완료 상태를 관리합니다.</CardDescription>
          </div>
          <EntityDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onOpenNew={() => {
              setCurrentEvaluator({});
              setDialogOpen(true);
            }}
            title={currentEvaluator.id ? '위원 수정' : '새 위원 추가'}
            isSaving={isSaving}
            onSubmit={handleSave}
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="evaluator-name" className="text-right">
                이름
              </Label>
              <Input
                id="evaluator-name"
                value={currentEvaluator.name || ''}
                onChange={(e) => setCurrentEvaluator({ ...currentEvaluator, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="evaluator-password" className="text-right">
                비밀번호
              </Label>
              <Input
                id="evaluator-password"
                type="password"
                value={currentEvaluator.password || ''}
                onChange={(e) => setCurrentEvaluator({ ...currentEvaluator, password: e.target.value })}
                className="col-span-3"
              />
            </div>
          </EntityDialog>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead className="text-center">채점 잠금</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    등록된 평가 위원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                evaluators.map((evaluator) => (
                  <TableRow key={evaluator.id}>
                    <TableCell className="font-medium">{evaluator.name}</TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative inline-flex items-center group">
                            <Switch
                              id={`lock-${evaluator.id}`}
                              checked={evaluator.scoringLocked}
                              onCheckedChange={(checked) => handleLockToggle(evaluator.id, checked)}
                              aria-label={`${evaluator.name} 채점 잠금 토글`}
                              className="peer data-[state=checked]:bg-destructive data-[state=unchecked]:bg-primary"
                            />
                            <span className="pointer-events-none absolute right-1.5 text-xs font-bold text-white opacity-0 transition-opacity peer-data-[state=checked]:opacity-100">
                              ON
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{evaluator.scoringLocked ? '클릭하여 채점 잠금을 해제합니다.' : '클릭하여 채점을 잠급니다.'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminTableActions
                        entityLabel={evaluator.name}
                        onEdit={() => {
                          setCurrentEvaluator(evaluator);
                          setDialogOpen(true);
                        }}
                        onDelete={() => handleDelete(evaluator.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
