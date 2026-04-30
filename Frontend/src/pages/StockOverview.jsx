import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { stockAPI, warehousesAPI } from '@/services/api';
import useDebounce from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import { Package, Search, Filter, Loader2, BrainCircuit, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function StockOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [locationId, setLocationId] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const filters = { 
    page: 1, limit: 100, 
    location_id: locationId === 'all' ? '' : locationId, 
    search: debouncedSearch, 
    low_stock: showLowStock 
  };

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', filters],
    queryFn: () => stockAPI.getOverview(filters).then(r => r.data),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => warehousesAPI.getLocations().then(r => r.data),
  });

  const aiMutation = useMutation({
    mutationFn: () => stockAPI.predictRestock(),
    onSuccess: (res) => {
      toast.success(`AI Task Queued: ${res.data.message}`);
    },
    onError: () => toast.error('Failed to start AI predictions')
  });

  const locations = locData?.data || [];
  const stockItems = stockData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
        <div className="absolute -z-10 top-[-20px] right-[-50px] w-[300px] h-[300px] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
        
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Real-Time Intelligence <Activity className="text-purple-500 w-8 h-8" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Global view of inventory across all distributed network nodes.
          </p>
        </div>

        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/20 transition-all hover:-translate-y-1"
          onClick={() => aiMutation.mutate()}
          disabled={aiMutation.isPending}
        >
          {aiMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
          Run AI Forecast
        </Button>
      </div>

      <Card className="p-5 bg-background/50 backdrop-blur-2xl border-white/5 shadow-2xl rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" placeholder="Search global inventory network..." 
            className="pl-11 h-14 bg-background/50 border-white/10 rounded-2xl focus-visible:ring-purple-500/50 text-base" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full md:w-[250px] h-14 rounded-2xl bg-background/50 border-white/10">
            <Filter className="w-5 h-5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <SelectItem value="all">Global Network (All)</SelectItem>
            {locations.filter(l => l.type === 'internal').map(l => (
              <SelectItem key={l.id} value={l.id.toString()}>{l.warehouse_code} / {l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showLowStock ? "default" : "outline"}
          onClick={() => setShowLowStock(!showLowStock)}
          className={`h-14 px-6 rounded-2xl border-white/10 transition-all ${showLowStock ? 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30' : 'hover:bg-white/5'}`}
        >
          {showLowStock ? 'Critical Stock Only' : 'Show Critical'}
        </Button>
      </Card>

      <div className="rounded-3xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground uppercase text-xs font-bold tracking-widest border-b border-white/10">
              <tr>
                <th className="px-6 py-5">Product Matrix</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5 text-right">Global Quantity</th>
                <th className="px-6 py-5 text-right">Valuation (₹)</th>
                <th className="px-6 py-5">Node Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" />
                    <p className="mt-4 text-muted-foreground font-medium">Aggregating Global Network Data...</p>
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No active stock found in the network.
                  </td>
                </tr>
              ) : stockItems.map((item) => {
                const isLow = item.total_quantity <= item.reorder_point && item.reorder_point > 0;
                
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors duration-300">
                    <td className="px-6 py-5">
                      <div className="font-bold text-base text-foreground">{item.name}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-1 tracking-wider">{item.sku}</div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="outline" className="border-white/10 bg-background/50 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                        {item.category_name || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isLow && <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-ping" title="Critical Restock Level"></span>}
                        <span className={`font-mono font-black text-xl ${isLow ? 'text-red-500' : 'text-foreground'}`}>
                          {item.total_quantity}
                        </span>
                        <span className="text-muted-foreground text-xs uppercase tracking-widest">{item.unit_of_measure}</span>
                      </div>
                      {isLow && <div className="text-[10px] text-red-400 mt-1.5 font-bold uppercase tracking-widest">Reorder Threshold: {item.reorder_point}</div>}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-muted-foreground font-semibold text-base">
                      ₹{(item.total_quantity * item.cost_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 min-w-[250px]">
                        {item.locations && item.locations.length > 0 ? item.locations.map((loc, i) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-black/20 border border-white/5 rounded-lg px-3 py-2 backdrop-blur-sm">
                            <span className="text-muted-foreground font-semibold truncate max-w-[150px]">
                              {loc.warehouse_code} <span className="text-white/20 mx-1">/</span> <span className="text-foreground/80">{loc.location_code}</span>
                            </span>
                            <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">{loc.quantity}</span>
                          </div>
                        )) : <span className="text-xs text-muted-foreground italic">No stock located</span>}
                      </div>
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
