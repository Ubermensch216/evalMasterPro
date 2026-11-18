"use client";

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, PlusCircle } from 'lucide-react';

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNew: () => void;
  title: string;
  isSaving: boolean;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
}

/**
 * Reusable modal form dialog for creating or editing admin-managed entities.
 */
export default function EntityDialog({
  open,
  onOpenChange,
  onOpenNew,
  title,
  isSaving,
  onSubmit,
  children,
}: EntityDialogProps) {
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">{children}</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
