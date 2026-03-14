import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adjustmentsAPI } from '@/services/api';
import dayjs from 'dayjs';
import { Settings2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Adjustments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adjustments'],
    queryFn: () => adjustmentsAPI.getAll().then(r => r.data),
  });

  const adjustments = data?.data || [];
  const filtered = adjustments.filter(a => a.reference.toLowerCase().includes(search.toLowerCase()));

  const statusColors = { 
    draft: 'bg-yellow-500/10 text-yellow-500', 
    validated: 'bg-green-500/10 text-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">Record physical counts and correct inventory levels</p>
        </div>
        <Button onClick={() => navigate('/adjustments/new')}><Plus className="w-4 h-4 mr-2" /> New Adjustment</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" placeholder="Search by reference..." 
            className="pl-8" value={search} onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No adjustments found</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/adjustments/${a.id}`)}>
                <TableCell className="font-mono font-medium">{a.reference}</TableCell>
                <TableCell>{a.warehouse_name} / {a.location_name}</TableCell>
                <TableCell>{a.reason}</TableCell>
                <TableCell>{dayjs(a.created_at).format('MMM D, YYYY')}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${statusColors[a.status] || 'bg-muted text-muted-foreground'}`}>{a.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
