'use client';

import { useState } from 'react';
import { Pencil, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUser, deleteUser } from '@/actions/auth/users';
import { PasswordStrength } from '@/components/shared/password-strength';
import { toast } from 'sonner';

interface EditUserButtonProps {
  user: {
    id: string;
    username: string;
    role: 'ADMIN' | 'ASSISTANT';
  };
  dict: any;
  currentUserId: string;
}

export function EditUserButton({ user, dict, currentUserId }: EditUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN'|'ASSISTANT'>(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password.length < 6) {
      toast.error(dict.usersPage.passwordRequirements || 'Password too short');
      return;
    }
    setLoading(true);

    const result = await updateUser(user.id, {
      password: password || undefined,
      role,
    });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.usersPage.editSuccess);
      setOpen(false);
      setPassword(''); // Reset password field
      setShowPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(dict.usersPage.confirmDelete)) return;
    
    setLoading(true);
    const result = await deleteUser(user.id);
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.usersPage.deleteSuccess);
      setOpen(false);
    }
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title={dict.usersPage.editUser}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dict.usersPage.editUser}</DialogTitle>
            <DialogDescription>
              {dict.usersPage.editUserDesc} - <span className="font-bold">{user.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-start leading-tight">{dict.usersPage.newPassword}</Label>
              <div className="relative col-span-3">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 left-auto rtl:right-auto rtl:left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="col-start-2 col-span-3">
                  <PasswordStrength password={password} dict={dict} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-start">{dict.usersPage.columns.role}</Label>
              <Select value={role} onValueChange={(val) => setRole((val ?? role) as 'ADMIN'|'ASSISTANT')} disabled={isCurrentUser}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={dict.usersPage.columns.role}>
                    {role === 'ADMIN' ? dict.usersPage.roles.admin : dict.usersPage.roles.assistant}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{dict.usersPage.roles.admin}</SelectItem>
                  <SelectItem value="ASSISTANT">{dict.usersPage.roles.assistant}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isCurrentUser && (
              <p className="text-xs text-muted-foreground mt-2">
                You cannot change your own role.
              </p>
            )}
          </div>
          <DialogFooter className="flex sm:justify-between flex-row-reverse sm:flex-row mt-6">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading || isCurrentUser}
              className="mr-auto"
            >
              {dict.usersPage.deleteUser}
            </Button>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.usersPage.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : dict.usersPage.saveChanges}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
