import { getUsers } from '@/actions/users';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { AddUserButton } from './add-user-button';
import { EditUserButton } from './edit-user-button';

import { UsersFilters } from './users-filters';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string, role?: string }> }) {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const resolvedSearchParams = await searchParams;
  const users = await getUsers(resolvedSearchParams.q || '', resolvedSearchParams.role || '');
  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.usersPage.title}</h1>
          <p className="text-muted-foreground mt-1">{dict.usersPage.subtitle}</p>
        </div>
        <AddUserButton dict={dict} />
      </div>

      <UsersFilters 
        dict={dict} 
        currentQuery={resolvedSearchParams.q || ''}
        currentRole={resolvedSearchParams.role || ''}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-start">{dict.usersPage.columns.username}</TableHead>
                <TableHead className="text-start">{dict.usersPage.columns.role}</TableHead>
                <TableHead className="text-start">{dict.usersPage.columns.created}</TableHead>
                <TableHead className="text-right">{dict.usersPage.columns.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                    {dict.usersPage.noUsers}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/20">
                    <TableCell className="text-start font-medium">
                      {user.username}
                      {authSession.id === user.id && (
                        <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 text-[10px]">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                             className={user.role === 'ADMIN' ? 'bg-primary' : ''}>
                        {user.role === 'ADMIN' ? dict.usersPage.roles.admin : dict.usersPage.roles.assistant}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start text-sm text-muted-foreground">
                      {dayjs(user.createdAt).format('MMM D, YYYY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditUserButton user={user} dict={dict} currentUserId={authSession.id as string} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
