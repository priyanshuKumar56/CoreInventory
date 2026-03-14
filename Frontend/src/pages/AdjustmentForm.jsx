import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustmentsAPI, warehousesAPI, productsAPI, stockAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdjustmentForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    warehouse_id: '', location_id: '',
    reason: '', items: []
  });

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehousesAPI.getAll().then(r => r.data.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsAPI.getAll({ limit: 500 }).then(r => r.data.data) });
  
  const { data: locations } = useQuery({
    queryKey: ['locations', form.warehouse_id],
    queryFn: () => warehousesAPI.getLocations({ warehouse_id: form.warehouse_id }).then(r => r.data.data),
    enabled: !!form.warehouse_id,
  });

  // Fetch current stock for theoretical calculation
  const { data: currentStock } = useQuery({
    queryKey: ['stock', form.location_id],
    queryFn: () => stockAPI.getOverview({ location_id: form.location_id }).then(r => r.data.data),
    enabled: !!form.location_id,
  });

  const mutation = useMutation({
    mutationFn: (data) => adjustmentsAPI.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Inventory adjustment recorded and validated successfully');
      navigate(`/adjustments`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', physical_quantity: 0 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  
  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    setForm(f => ({ ...f, items: newItems }));
  };

  // Pre-load all items in a location
  const loadAllStock = () => {
    if (!currentStock || !currentStock.items) return;
    const newItems = currentStock.items.map(s => ({
      product_id: s.product_id,
      physical_quantity: parseFloat(s.quantity) || 0
    }));
    setForm(f => ({ ...f, items: newItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.warehouse_id || !form.location_id) return toast.error('Warehouse and Location are required');
    if (!form.items.length) return toast.error('Add at least one item');
    if (form.items.some(i => !i.product_id || i.physical_quantity < 0)) return toast.error('Check item details (quantity cannot be negative)');
    mutation.mutate(form);
  };

  const getTheoreticalStock = (productId) => {
    if (!currentStock?.items) return 0;
    const item = currentStock.items.find(s => s.product_id === parseInt(productId));
    return item ? parseFloat(item.quantity) : 0;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Adjustment</h1>
          <p className="text-sm text-muted-foreground mt-1">Record a physical count for a specific location</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Warehouse *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value, location_id: '', items: [] })}>
                  <option value="">Select warehouse...</option>
                  {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Location to Adjust *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value, items: [] })} disabled={!form.warehouse_id}>
                  <option value="">Select internal location...</option>
                  {locations?.filter(l => l.type === 'internal').map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Adjustment Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Input id="reason" placeholder="e.g. Annual stocktake, Found missing items, etc." required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg text-sm flex gap-3">
                <div className="shrink-0 mt-0.5"><AlertCircle className="w-4 h-4" /></div>
                <div>Submitting this form will immediately update your inventory levels and create a validated adjustment record.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Physical Count</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={loadAllStock} disabled={!form.location_id || !currentStock?.items?.length} title="Load all currently known stock in this location">
                <Search className="h-4 w-4 mr-2" /> Load Expected Items
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item Manually</Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.items.length > 0 && (
              <div className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 mb-2 px-2">
                <div className="text-sm font-medium text-muted-foreground">Product</div>
                <div className="text-sm font-medium text-muted-foreground text-center">Expected</div>
                <div className="text-sm font-medium text-muted-foreground text-center">Physical Count</div>
                <div className="text-sm font-medium text-muted-foreground text-center">Difference</div>
                <div></div>
              </div>
            )}
            
            {form.items.map((item, i) => {
              const theoretical = item.product_id ? getTheoreticalStock(item.product_id) : 0;
              const diff = item.physical_quantity - theoretical;
              
              return (
                <div key={i} className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 mb-3 items-center group">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                    <option value="">Select product...</option>
                    {products?.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                  </select>
                  
                  <div className="text-center font-mono bg-muted py-2 rounded text-sm">
                    {theoretical}
                  </div>
                  
                  <Input type="number" min="0" step="0.01" value={item.physical_quantity} onChange={e => updateItem(i, 'physical_quantity', parseFloat(e.target.value) || 0)} required className="text-center font-mono" />
                  
                  <div className={`text-center font-mono font-bold text-sm ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {diff > 0 ? '+' : ''}{diff}
                  </div>
                  
                  <Button type="button" variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            
            {!form.items.length && <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">No items added to this adjustment yet. <br/>Use "Load Expected Items" to populate known stock, or add manually.</div>}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validate Adjustment
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
