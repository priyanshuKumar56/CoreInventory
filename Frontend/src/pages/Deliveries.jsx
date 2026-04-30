import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deliveriesAPI } from '@/services/api';
import dayjs from 'dayjs';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Deliveries() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, limit: 15, status: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => deliveriesAPI.getAll(filters).then(r => r.data),
  });

  const deliveries = data?.data || [];
  const statusColors = { 
    waiting: 'bg-yellow-500/10 text-yellow-500', 
    ready: 'bg-blue-500/10 text-blue-500', 
    done: 'bg-green-500/10 text-green-500',
    late: 'bg-destructive/10 text-destructive'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground mt-1">Manage outgoing orders and shipments</p>
        </div>
        <Button onClick={() => navigate('/deliveries/new')}><Plus className="w-4 h-4 mr-2" /> New Delivery</Button>
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
              <SelectItem value="waiting">Waiting for materials</SelectItem>
              <SelectItem value="ready">Ready to pack</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Source Location</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : deliveries.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No deliveries found matching criteria</TableCell></TableRow>
            ) : deliveries.map((d) => (
              <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/deliveries/${d.id}`)}>
                <TableCell className="font-mono font-medium">{d.reference}</TableCell>
                <TableCell>{d.contact_name || <span className="text-muted-foreground italic">No contact</span>}</TableCell>
                <TableCell>{d.warehouse_name} / {d.source_name}</TableCell>
                <TableCell>{d.scheduled_date ? dayjs(d.scheduled_date).format('MMM D, YYYY') : '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${statusColors[d.status] || 'bg-muted text-muted-foreground'}`}>{d.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
