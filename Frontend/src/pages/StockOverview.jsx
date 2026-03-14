import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockAPI, warehousesAPI } from '@/services/api';
import { Package, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StockOverview() {
  const [filters, setFilters] = useState({ page: 1, limit: 100, location_id: '', search: '', low_stock: false });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', filters],
    queryFn: () => stockAPI.getOverview(filters).then(r => r.data),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => warehousesAPI.getLocations().then(r => r.data),
  });

  const locations = locData?.data || [];
  const stockItems = stockData?.data?.items || [];

  // Group by product
  const groupedStock = stockItems.reduce((acc, curr) => {
    if (!acc[curr.product_id]) {
      acc[curr.product_id] = {
        product_id: curr.product_id,
        sku: curr.sku,
        name: curr.product_name,
        category: curr.category_name,
        total_quantity: 0,
        unit: curr.unit_of_measure,
        reorder_point: curr.reorder_point,
        cost: curr.cost,
        locations: []
      };
    }
    acc[curr.product_id].total_quantity += parseFloat(curr.quantity);
    acc[curr.product_id].locations.push({
      loc_id: curr.location_id,
      loc_name: curr.location_name,
      wh_name: curr.warehouse_name,
      quantity: parseFloat(curr.quantity)
    });
    return acc;
  }, {});

  const displayList = Object.values(groupedStock);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time inventory levels across all locations</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" placeholder="Search product or SKU..." 
                className="pl-8" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} 
              />
            </div>
            
            <Select value={filters.location_id} onValueChange={(val) => setFilters({ ...filters, location_id: val === 'all' ? '' : val })}>
              <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.filter(l => l.type === 'internal').map(l => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.warehouse_code} / {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={filters.low_stock ? "default" : "outline"}
              onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock }))}
              className={filters.low_stock ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20 hover:text-destructive' : ''}
            >
              {filters.low_stock ? 'Viewing Low Stock' : 'Show Low Stock'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total On Hand</TableHead>
                  <TableHead className="text-right">Value (₹)</TableHead>
                  <TableHead>Location Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
                ) : displayList.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No stock data matching criteria</TableCell></TableRow>
                ) : displayList.map((item) => {
                  const isLow = item.total_quantity <= item.reorder_point && item.reorder_point > 0;
                  
                  return (
                    <TableRow key={item.product_id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-primary">{item.name}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">{item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">{item.category || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLow && <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" title="Below Reorder Point"></span>}
                          <span className={`font-mono font-bold text-lg ${isLow ? 'text-destructive' : ''}`}>{item.total_quantity}</span>
                          <span className="text-muted-foreground text-xs">{item.unit}</span>
                        </div>
                        {isLow && <div className="text-[10px] text-destructive mt-1 font-medium bg-destructive/10 inline-block px-1.5 py-0.5 rounded">Reorder: {item.reorder_point}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground font-medium">
                        {(item.total_quantity * item.cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                          {item.locations.map((loc, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-muted/60 rounded px-2 py-1.5">
                              <span className="text-muted-foreground font-medium truncate max-w-[140px]" title={`${loc.wh_name} > ${loc.loc_name}`}>
                                {loc.wh_name} <span className="text-foreground/50 mx-1">/</span> <span className="text-foreground">{loc.loc_name}</span>
                              </span>
                              <span className="font-mono font-semibold bg-background px-1.5 rounded">{loc.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
