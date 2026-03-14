import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockAPI } from '@/services/api';
import dayjs from 'dayjs';
import { Clock, Search, Filter, TrendingDown, TrendingUp, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function MoveHistory() {
  const [filters, setFilters] = useState({ page: 1, limit: 100, move_type: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['moves', filters],
    queryFn: () => stockAPI.getMoves(filters).then(r => r.data),
  });

  const moves = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Move History</h1>
          <p className="text-muted-foreground mt-1">Audit trail of all inventory transactions</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" placeholder="Search product, SKU, or reference..." 
            className="pl-8" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} 
          />
        </div>
        <div className="w-48">
          <Select value={filters.move_type} onValueChange={(val) => setFilters({ ...filters, move_type: val === 'all' ? '' : val })}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All Move Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Move Types</SelectItem>
              <SelectItem value="receipt">Receipts</SelectItem>
              <SelectItem value="delivery">Deliveries</SelectItem>
              <SelectItem value="internal">Internal Transfers</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Operations</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : moves.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No stock moves found</TableCell></TableRow>
            ) : moves.map((m) => {
              const isOut = m.move_type === 'delivery';
              const isInternal = m.move_type === 'internal';
              const isAdj = m.move_type === 'adjustment';

              return (
                <TableRow key={m.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{dayjs(m.created_at).format('MMM D, YYYY')}</div>
                    <div className="text-xs text-muted-foreground">{dayjs(m.created_at).format('HH:mm:ss')}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${isOut ? 'bg-destructive/10 text-destructive border-transparent' : isAdj ? 'bg-orange-500/10 text-orange-500 border-transparent' : isInternal ? 'bg-blue-500/10 text-blue-500 border-transparent' : 'bg-green-500/10 text-green-500 border-transparent'}`}>
                      <span className="flex items-center gap-1">
                        {isOut ? <TrendingDown className="h-3 w-3" /> : isInternal ? <RefreshCcw className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {m.move_type}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{m.product_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{m.sku}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.reference}</TableCell>
                  <TableCell className="text-sm">
                    {isInternal ? (
                      <span className="text-muted-foreground text-xs"><strong className="text-foreground">{m.from_location}</strong> → <strong className="text-foreground">{m.to_location}</strong></span>
                    ) : isOut ? (
                      <span className="text-muted-foreground text-xs">From: <strong className="text-foreground">{m.from_location}</strong></span>
                    ) : isAdj ? (
                      <span className="text-muted-foreground text-xs">At: <strong className="text-foreground">{m.to_location || m.from_location}</strong></span>
                    ) : (
                      <span className="text-muted-foreground text-xs">To: <strong className="text-foreground">{m.to_location}</strong></span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    <span className={isOut ? 'text-destructive' : isInternal || isAdj ? '' : 'text-green-600'}>
                      {isOut ? '-' : isInternal ? '' : '+'}{m.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal ml-1">{m.unit_of_measure}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
