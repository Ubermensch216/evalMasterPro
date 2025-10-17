
"use client";

import { useState } from "react";
import { useStore, type Evaluator } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Loader2, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function EvaluatorManager() {
  const { evaluators, addEvaluator, updateEvaluator, deleteEvaluator, setEvaluatorScoringLock } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEvaluator, setCurrentEvaluator] = useState<Partial<Evaluator>>({});
  const { toast } = useToast();

  const handleSave = async () => {
    if (!currentEvaluator.name || !currentEvaluator.password) {
      toast({ title: "오류", description: "이름과 비밀번호를 모두 입력해주세요.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (currentEvaluator.id) {
        const { id, scoringLocked, ...data } = currentEvaluator;
        await updateEvaluator(id, data as Omit<Evaluator, 'id' | 'scoringLocked'>);
        toast({ title: "성공", description: "평가 위원 정보가 수정되었습니다." });
      } else {
        await addEvaluator(currentEvaluator.name, currentEvaluator.password);
        toast({ title: "성공", description: "새 평가 위원이 추가되었습니다." });
      }
      setCurrentEvaluator({});
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save evaluator:", error);
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (evaluator: Evaluator) => {
    setCurrentEvaluator(evaluator);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentEvaluator({});
    setDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteEvaluator(id);
      toast({ title: "성공", description: "평가 위원이 삭제되었습니다." });
    } catch (error) {
      console.error("Failed to delete evaluator:", error);
      toast({ title: "오류", description: "삭제에 실패했습니다.", variant: "destructive" });
    }
  }

  const handleLockToggle = async (evaluatorId: string, locked: boolean) => {
    try {
        await setEvaluatorScoringLock(evaluatorId, locked);
        toast({ title: "성공", description: `채점 상태가 ${locked ? '잠금' : '해제'}되었습니다.` });
    } catch (error) {
        console.error("Failed to toggle lock:", error);
        toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentEvaluator.id ? '위원 수정' : '새 위원 추가'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">이름</Label>
                  <Input
                    id="name"
                    value={currentEvaluator.name || ''}
                    onChange={(e) => setCurrentEvaluator({ ...currentEvaluator, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={currentEvaluator.password || ''}
                    onChange={(e) => setCurrentEvaluator({ ...currentEvaluator, password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSaving}>취소</Button></DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            {evaluators.map((evaluator) => (
              <TableRow key={evaluator.id}>
                <TableCell className="font-medium">{evaluator.name}</TableCell>
                <TableCell className="text-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Switch
                                checked={evaluator.scoringLocked}
                                onCheckedChange={(checked) => handleLockToggle(evaluator.id, checked)}
                                aria-label="채점 잠금 토글"
                                className="data-[state=checked]:bg-destructive data-[state=unchecked]:bg-green-600"
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{evaluator.scoringLocked ? '클릭하여 채점 잠금을 해제합니다.' : '클릭하여 채점을 잠급니다.'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(evaluator)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          이 작업은 되돌릴 수 없습니다. '{evaluator.name}' 위원 및 관련 데이터가 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(evaluator.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
