import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { transfersAPI } from '@/services/api';
import dayjs from 'dayjs';
import { ArrowLeftRight, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Transfers() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, limit: 15, status: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => transfersAPI.getAll(filters).then(r => r.data),
  });

  const transfers = data?.data || [];
  const statusColors = { 
    draft: 'bg-yellow-500/10 text-yellow-500', 
    done: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-destructive/10 text-destructive'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Transfers</h1>
          <p className="text-muted-foreground mt-1">Move stock between locations</p>
        </div>
        <Button onClick={() => navigate('/transfers/new')}><Plus className="w-4 h-4 mr-2" /> New Transfer</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" placeholder="Search by reference..." 
            className="pl-8" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} 
          />
        </div>
        <div className="w-48">
          <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val === 'all' ? '' : val })}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : transfers.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transfers found</TableCell></TableRow>
            ) : transfers.map((t) => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/transfers/${t.id}`)}>
                <TableCell className="font-mono font-medium">{t.reference}</TableCell>
                <TableCell>{t.from_warehouse} / {t.from_location}</TableCell>
                <TableCell>{t.to_warehouse} / {t.to_location}</TableCell>
                <TableCell>{t.scheduled_date ? dayjs(t.scheduled_date).format('MMM D, YYYY') : '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${statusColors[t.status] || 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
