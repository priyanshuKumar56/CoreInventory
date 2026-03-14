import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { productsAPI } from '@/services/api';
import { PackageOpen, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function Products() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const [filters, setFilters] = useState({ page: 1, limit: 15, search: '', category_id: '' });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsAPI.getAll(filters).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsAPI.getCategories().then(r => r.data),
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your item catalog, pricing, and reorder rules</p>
        </div>
        {isAdminOrManager && (
          <Button onClick={() => navigate('/products/new')}><Plus className="w-4 h-4 mr-2" /> New Product</Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" placeholder="Search by name, SKU, or barcode..." 
            className="pl-8" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} 
          />
        </div>
        <div className="w-48">
          <Select value={filters.category_id} onValueChange={(val) => setFilters({ ...filters, category_id: val === 'all' ? '' : val })}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name & Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
            ) : products.map((p) => {
              const stock = p.total_stock || 0;
              const reorder = p.reorder_point || 0;
              const isLow = stock <= reorder && reorder > 0;
              
              return (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/products/${p.id}`)}>
                  <TableCell className="font-mono font-medium">{p.sku}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-primary">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.category_name || 'Uncategorized'}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">₹{p.sale_price}</TableCell>
                  <TableCell className="text-right font-mono">₹{p.cost_price}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isLow ? "destructive" : stock > 0 ? "secondary" : "outline"} className={isLow ? '' : stock > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                      {stock} {p.unit_of_measure}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground capitalize">
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
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
