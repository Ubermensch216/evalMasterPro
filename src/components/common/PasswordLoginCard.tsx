"use client";

import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PasswordLoginCardProps {
  title: string;
  description: string;
  submitLabel: string;
  icon: ReactNode;
  onLogin: (password: string) => boolean;
}

/**
 * Centered single-password login card shared by password-gated views.
 */
export default function PasswordLoginCard({
  title,
  description,
  submitLabel,
  icon,
  onLogin,
}: PasswordLoginCardProps) {
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(password)) {
      toast({
        title: '로그인 실패',
        description: '비밀번호를 확인해주세요.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">{icon}</div>
            <CardTitle className="mt-4 text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {submitLabel}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
