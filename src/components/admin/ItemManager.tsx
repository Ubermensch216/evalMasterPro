"use client";

import { useState } from "react";
import { useStore, type EvaluationItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ItemManager() {
  const { items, addItem, updateItem, deleteItem } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<EvaluationItem>>({maxScore: 10});
  const { toast } = useToast();

  const handleSave = () => {
    if (!currentItem.name || currentItem.maxScore === undefined || currentItem.maxScore <= 0) {
      toast({ title: "오류", description: "항목명과 유효한 배점을 입력해주세요.", variant: "destructive" });
      return;
    }

    if (currentItem.id) {
      updateItem(currentItem.id, currentItem as EvaluationItem);
      toast({ title: "성공", description: "평가 항목이 수정되었습니다." });
    } else {
      addItem(currentItem.name, currentItem.maxScore);
      toast({ title: "성공", description: "새 평가 항목이 추가되었습니다." });
    }
    setCurrentItem({maxScore: 10});
    setDialogOpen(false);
  };

  const openEditDialog = (item: EvaluationItem) => {
    setCurrentItem(item);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentItem({maxScore: 10});
    setDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteItem(id);
    toast({ title: "성공", description: "평가 항목이 삭제되었습니다." });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 항목 관리</CardTitle>
            <CardDescription>평가 항목명과 배점을 추가, 수정, 삭제합니다.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentItem.id ? '항목 수정' : '새 항목 추가'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">항목명</Label>
                  <Input
                    id="name"
                    value={currentItem.name || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxScore" className="text-right">배점</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={currentItem.maxScore || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, maxScore: parseInt(e.target.value, 10) || 0 })}
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
              <TableHead>항목명</TableHead>
              <TableHead>배점</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.maxScore}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
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
                          이 작업은 되돌릴 수 없습니다. '{item.name}' 항목 및 관련 데이터가 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
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
