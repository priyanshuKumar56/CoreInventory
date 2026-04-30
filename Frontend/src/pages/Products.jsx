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
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Product Catalog</span>
            <Sparkles className="text-primary w-8 h-8 animate-pulse" />
          </h1>
          <p className="text-slate-600 mt-2 text-lg font-medium">
            Manage your enterprise inventory with real-time insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200/40 hover:bg-slate-100/50 text-slate-700 hover:text-slate-900 transition-all shadow-sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2 text-primary" />}
            Export CSV
          </Button>
          {isAdminOrManager && (
            <Button onClick={() => navigate('/products/new')} className="shadow-lg shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Card */}
      <Card className="p-5 bg-gradient-to-r from-white to-slate-50/80 border border-slate-200/40 shadow-lg shadow-black/5 rounded-xl flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by SKU or product name..." 
            className="pl-10 h-11 bg-white border-slate-200/60 rounded-lg focus-visible:ring-primary/50 text-md" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="w-full sm:w-72">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-11 rounded-lg bg-white border-slate-200/60">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-slate-200/40">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Premium Data Grid */}
      <div className="rounded-xl border border-slate-200/40 bg-gradient-to-br from-white to-slate-50/50 shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-700 uppercase text-xs font-bold tracking-wider border-b border-slate-200/40">
              <tr>
                <th className="px-6 py-5">SKU / Code</th>
                <th className="px-6 py-5">Product Details</th>
                <th className="px-6 py-5 text-right">Pricing (₹)</th>
                <th className="px-6 py-5 text-center">Live Stock</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-slate-500">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    No products found
                  </td>
                </tr>
              ) : products.map((p) => {
                const stock = p.total_stock || 0;
                const reorder = p.reorder_point || 0;
                const isLow = stock <= reorder && reorder > 0;
                
                return (
                  <tr 
                    key={p.id} 
                    className="group hover:bg-slate-100/40 transition-all duration-200 cursor-pointer border-slate-200/40"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm bg-slate-100 inline-block px-3 py-1 rounded-lg text-slate-700 border border-slate-200/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {p.sku}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {p.category_name || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-slate-900">₹{p.sale_price}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Cost: ₹{p.cost_price}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Badge 
                          className={`
                            px-3 py-1 text-sm font-semibold border
                            ${isLow ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-green-100 text-green-700 border-green-300'}
                          `}
                        >
                          {isLow && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                          {stock} {p.unit_of_measure}
                        </Badge>
                        {isLow && <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Low Stock</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-all text-slate-500 group-hover:text-primary group-hover:bg-primary/10">
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
