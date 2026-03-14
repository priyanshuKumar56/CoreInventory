import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/services/api';
import { UserCircle, Mail, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function Users() {
  const [search, setSearch] = useState('');
  
  const { data: userData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data),
  });

  const users = userData?.data || [];
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Base</h1>
          <p className="text-muted-foreground mt-1">Manage system access roles and audit user activity.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-muted-foreground/10 overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Registered Users ({filteredUsers.length})</CardTitle>
          <CardDescription>All employees with active or revoked system access.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Full Name</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right pr-6">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto" /></TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No users found matching your search.</TableCell></TableRow>
              ) : filteredUsers.map((u) => (
                <TableRow key={u.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{u.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" /> {u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className={cn("h-4 w-4", u.role === 'admin' ? "text-red-500" : u.role === 'manager' ? "text-amber-500" : "text-blue-500")} />
                      <span className="capitalize text-sm font-medium">{u.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-2.5 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Active Access
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 px-2.5 py-0.5">
                        <XCircle className="h-3 w-3" /> Revoked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dayjs(u.created_at).format('MMM D, YYYY')}
                  </TableCell>
                  <TableCell className="text-right pr-6 text-sm font-mono text-muted-foreground">
                    {u.last_login ? dayjs(u.last_login).fromNow() : 'Never logged in'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function locally since utils is imported as @/lib/utils but not always available in scope here
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
