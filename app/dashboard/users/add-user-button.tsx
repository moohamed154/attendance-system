'use client';

import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addUser } from '@/actions/users';
import { PasswordStrength } from '@/components/password-strength';
import { toast } from 'sonner';

export function AddUserButton({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN'|'ASSISTANT'>('ASSISTANT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(dict.usersPage.passwordRequirements || 'Password too short');
      return;
    }
    setLoading(true);

    const result = await addUser({
      username,
      password,
      role,
    });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.usersPage.addSuccess);
      setOpen(false);
      setUsername('');
      setPassword('');
      setRole('ASSISTANT');
      setShowPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2 ml-2" />
          {dict.usersPage.addUser}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dict.usersPage.addUser}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-start">{dict.usersPage.columns.username}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-start">{dict.usersPage.password}</Label>
              <div className="relative col-span-3">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 left-auto rtl:right-auto rtl:left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="col-start-2 col-span-3">
                <PasswordStrength password={password} dict={dict} />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-start">{dict.usersPage.columns.role}</Label>
              <Select value={role} onValueChange={(val) => setRole((val ?? role) as 'ADMIN'|'ASSISTANT')}>
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
          </div>
          <DialogFooter className="mt-6">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
                {dict.usersPage.cancel}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                {loading ? '...' : dict.usersPage.addUser}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
