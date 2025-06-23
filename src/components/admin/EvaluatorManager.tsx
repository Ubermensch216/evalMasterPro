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
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EvaluatorManager() {
  const { evaluators, addEvaluator, updateEvaluator, deleteEvaluator } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvaluator, setCurrentEvaluator] = useState<Partial<Evaluator>>({});
  const { toast } = useToast();

  const handleSave = () => {
    if (!currentEvaluator.name || !currentEvaluator.password) {
      toast({ title: "오류", description: "이름과 비밀번호를 모두 입력해주세요.", variant: "destructive" });
      return;
    }

    if (currentEvaluator.id) {
      updateEvaluator(currentEvaluator.id, currentEvaluator as Evaluator);
      toast({ title: "성공", description: "평가 위원 정보가 수정되었습니다." });
    } else {
      addEvaluator(currentEvaluator.name, currentEvaluator.password);
      toast({ title: "성공", description: "새 평가 위원이 추가되었습니다." });
    }
    setCurrentEvaluator({});
    setDialogOpen(false);
  };

  const openEditDialog = (evaluator: Evaluator) => {
    setCurrentEvaluator(evaluator);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentEvaluator({});
    setDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteEvaluator(id);
    toast({ title: "성공", description: "평가 위원이 삭제되었습니다." });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 위원 관리</CardTitle>
            <CardDescription>평가 위원을 추가, 수정, 삭제하고 비밀번호를 관리합니다.</CardDescription>
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
                <DialogClose asChild><Button variant="outline">취소</Button></DialogClose>
                <Button onClick={handleSave}>저장</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluators.map((evaluator) => (
              <TableRow key={evaluator.id}>
                <TableCell className="font-medium">{evaluator.name}</TableCell>
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
      </CardContent>
    </Card>
  );
}
