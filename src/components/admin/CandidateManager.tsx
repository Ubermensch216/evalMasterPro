
"use client";

import { useState } from "react";
import { useStore, type Candidate } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CandidateManager() {
  const { candidates, addCandidate, updateCandidate, deleteCandidate } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Partial<Candidate>>({});
  const { toast } = useToast();

  const handleSave = async () => {
    if (!currentCandidate.name) {
      toast({ title: "오류", description: "대상자 이름을 입력해주세요.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (currentCandidate.id) {
        await updateCandidate(currentCandidate.id, { name: currentCandidate.name });
        toast({ title: "성공", description: "평가 대상자 정보가 수정되었습니다." });
      } else {
        await addCandidate(currentCandidate.name);
        toast({ title: "성공", description: "새 평가 대상자가 추가되었습니다." });
      }
      setCurrentCandidate({});
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save candidate:", error);
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setCurrentCandidate(candidate);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentCandidate({});
    setDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteCandidate(id);
      toast({ title: "성공", description: "평가 대상자가 삭제되었습니다." });
    } catch (error) {
       console.error("Failed to delete candidate:", error);
      toast({ title: "오류", description: "삭제에 실패했습니다.", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 대상자 관리</CardTitle>
            <CardDescription>평가에 참여할 대상자를 추가, 수정, 삭제합니다.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentCandidate.id ? '대상자 수정' : '새 대상자 추가'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">이름</Label>
                  <Input
                    id="name"
                    value={currentCandidate.name || ''}
                    onChange={(e) => setCurrentCandidate({ ...currentCandidate, name: e.target.value })}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(candidate)}>
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
                          이 작업은 되돌릴 수 없습니다. '{candidate.name}' 대상자 및 관련 데이터가 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(candidate.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
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
