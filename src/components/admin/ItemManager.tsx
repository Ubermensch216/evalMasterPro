"use client";

import { useState } from 'react';
import { useStore, type EvaluationItem } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import EntityDialog from '@/components/admin/EntityDialog';
import AdminTableActions from '@/components/admin/AdminTableActions';

const DEFAULT_MAX_SCORE = 10;

export default function ItemManager() {
  const { items, addItem, updateItem, deleteItem } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<EvaluationItem>>({ maxScore: DEFAULT_MAX_SCORE });
  const { toast } = useToast();

  const handleSave = async () => {
    const trimmedName = currentItem.name?.trim();
    const maxScore = currentItem.maxScore;
    if (!trimmedName || maxScore === undefined || maxScore <= 0) {
      toast({ title: '오류', description: '항목명과 유효한 배점을 입력해주세요.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentItem.id) {
        await updateItem(currentItem.id, { name: trimmedName, maxScore });
        toast({ title: '성공', description: '평가 항목이 수정되었습니다.' });
      } else {
        await addItem(trimmedName, maxScore);
        toast({ title: '성공', description: '새 평가 항목이 추가되었습니다.' });
      }
      setCurrentItem({ maxScore: DEFAULT_MAX_SCORE });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      toast({ title: '성공', description: '평가 항목이 삭제되었습니다.' });
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 항목 관리</CardTitle>
            <CardDescription>평가 항목명과 배점을 추가, 수정, 삭제합니다.</CardDescription>
          </div>
          <EntityDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onOpenNew={() => {
              setCurrentItem({ maxScore: DEFAULT_MAX_SCORE });
              setDialogOpen(true);
            }}
            title={currentItem.id ? '항목 수정' : '새 항목 추가'}
            isSaving={isSaving}
            onSubmit={handleSave}
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right">
                항목명
              </Label>
              <Input
                id="item-name"
                value={currentItem.name || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-max-score" className="text-right">
                배점
              </Label>
              <Input
                id="item-max-score"
                type="number"
                min={1}
                value={currentItem.maxScore || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, maxScore: parseInt(e.target.value, 10) || 0 })}
                className="col-span-3"
              />
            </div>
          </EntityDialog>
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
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  등록된 평가 항목이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.maxScore}</TableCell>
                  <TableCell className="text-right">
                    <AdminTableActions
                      entityLabel={item.name}
                      onEdit={() => {
                        setCurrentItem(item);
                        setDialogOpen(true);
                      }}
                      onDelete={() => handleDelete(item.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
