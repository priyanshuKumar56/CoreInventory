import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { productsAPI } from '@/services/api';
import useDebounce from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import { 
  PackageOpen, Plus, Search, Filter, DownloadCloud, Loader2, Sparkles, AlertCircle, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function Products() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryId, setCategoryId] = useState('all');

  const filters = { 
    page: 1, limit: 50, 
    search: debouncedSearch, 
    category_id: categoryId === 'all' ? '' : categoryId 
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsAPI.getAll(filters).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsAPI.getCategories().then(r => r.data),
  });

  const exportMutation = useMutation({
    mutationFn: () => productsAPI.exportCSV(),
    onSuccess: (res) => {
      toast.success(`Export job queued! ID: ${res.data.job_id}`);
    },
    onError: () => toast.error('Failed to queue export task')
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
        <div className="absolute -z-10 top-[-50px] left-[-50px] w-[200px] h-[200px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen" />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            Product Catalog <Sparkles className="text-blue-500 w-6 h-6 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Manage your high-scale enterprise inventory with real-time AI insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2 text-primary" />}
            Big Data Export
          </Button>
          {isAdminOrManager && (
            <Button onClick={() => navigate('/products/new')} className="shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Card */}
      <Card className="p-4 bg-background/60 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search millions of SKUs... (Debounced)" 
            className="pl-10 h-12 bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary/50 text-md" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Premium Data Grid */}
      <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-sm shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">SKU / Code</th>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 text-right">Pricing (₹)</th>
                <th className="px-6 py-4 text-center">Live Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading large dataset...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No products found matching your highly specific criteria.
                  </td>
                </tr>
              ) : products.map((p) => {
                const stock = p.total_stock || 0;
                const reorder = p.reorder_point || 0;
                const isLow = stock <= reorder && reorder > 0;
                
                return (
                  <tr 
                    key={p.id} 
                    className="group hover:bg-muted/30 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm bg-muted/50 inline-block px-2 py-1 rounded-md text-foreground/80 border border-white/5">
                        {p.sku}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                        {p.category_name || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-foreground">₹{p.sale_price}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Cost: ₹{p.cost_price}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Badge 
                          variant="outline" 
                          className={`
                            px-3 py-1 text-sm font-medium border-0
                            ${isLow ? 'bg-destructive/15 text-destructive animate-pulse' : 'bg-green-500/10 text-green-500'}
                          `}
                        >
                          {isLow && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                          {stock} {p.unit_of_measure}
                        </Badge>
                        {isLow && <span className="text-[10px] text-destructive/80 font-bold uppercase tracking-wider">Reorder Alert</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform text-muted-foreground group-hover:text-primary">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
