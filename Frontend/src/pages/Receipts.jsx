import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { receiptsAPI } from '@/services/api';
import dayjs from 'dayjs';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Receipts() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, limit: 15, status: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', filters],
    queryFn: () => receiptsAPI.getAll(filters).then(r => r.data),
  });

  const receipts = data?.data || [];
  const statusColors = { draft: 'bg-amber-100 text-amber-700 border border-amber-300', ready: 'bg-blue-100 text-blue-700 border border-blue-300', done: 'bg-green-100 text-green-700 border border-green-300' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Receipts</h1>
          <p className="text-slate-600 mt-2 font-medium">Manage incoming stock and purchase receipts</p>
        </div>
        <Button onClick={() => navigate('/receipts/new')} className="shadow-lg shadow-primary/30"><Plus className="w-4 h-4 mr-2" /> New Receipt</Button>
      </div>

      <div className="flex items-center gap-4 bg-gradient-to-r from-white to-slate-50/80 p-4 rounded-xl border border-slate-200/40 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            type="search" placeholder="Search by reference..." 
            className="pl-10 h-10 bg-white border-slate-200/60 focus-visible:ring-primary/50 rounded-lg" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} 
          />
        </div>
        <div className="w-56">
          <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val === 'all' ? '' : val })}>
            <SelectTrigger className="h-10 bg-white border-slate-200/60 rounded-lg"><Filter className="w-4 h-4 mr-2 text-slate-400" /><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent className="rounded-lg border-slate-200/40">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/40 bg-gradient-to-br from-white to-slate-50/50 shadow-lg shadow-black/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200/40 bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-transparent">
              <TableHead className="text-slate-700 font-bold">Reference</TableHead>
              <TableHead className="text-slate-700 font-bold">Contact / Vendor</TableHead>
              <TableHead className="text-slate-700 font-bold">Destination</TableHead>
              <TableHead className="text-slate-700 font-bold">Scheduled Date</TableHead>
              <TableHead className="text-slate-700 font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : receipts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No receipts found matching criteria</TableCell></TableRow>
            ) : receipts.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-slate-100/40 border-slate-200/40 transition-colors duration-200 group" onClick={() => navigate(`/receipts/${r.id}`)}>
                <TableCell className="font-mono font-semibold text-slate-900">{r.reference}</TableCell>
                <TableCell className="text-slate-700 group-hover:text-primary transition-colors">{r.contact_name || <span className="text-slate-400 italic">No contact</span>}</TableCell>
                <TableCell className="text-slate-700">{r.warehouse_name} / {r.destination_name}</TableCell>
                <TableCell className="text-slate-700">{r.scheduled_date ? dayjs(r.scheduled_date).format('MMM D, YYYY') : '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusColors[r.status] || 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
