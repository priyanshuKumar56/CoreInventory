import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersAPI, warehousesAPI, productsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function TransferForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    from_warehouse_id: '', from_location_id: '',
    to_warehouse_id: '', to_location_id: '',
    scheduled_date: '', notes: '', items: []
  });

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehousesAPI.getAll().then(r => r.data.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsAPI.getAll({ limit: 200 }).then(r => r.data.data) });
  
  const { data: fromLocations } = useQuery({
    queryKey: ['locations', form.from_warehouse_id],
    queryFn: () => warehousesAPI.getLocations({ warehouse_id: form.from_warehouse_id }).then(r => r.data.data),
    enabled: !!form.from_warehouse_id,
  });

  const { data: toLocations } = useQuery({
    queryKey: ['locations', form.to_warehouse_id],
    queryFn: () => warehousesAPI.getLocations({ warehouse_id: form.to_warehouse_id }).then(r => r.data.data),
    enabled: !!form.to_warehouse_id,
  });

  const mutation = useMutation({
    mutationFn: (data) => transfersAPI.create(data),
    onSuccess: (res) => {
      toast.success('Internal transfer created');
      qc.invalidateQueries({ queryKey: ['transfers'] });
      navigate(`/transfers/${res.data.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    setForm(f => ({ ...f, items: newItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.from_location_id || !form.to_location_id) return toast.error('Source and Destination locations are required');
    if (form.from_location_id === form.to_location_id) return toast.error('Source and Destination cannot be the same location');
    if (!form.items.length) return toast.error('Add at least one item');
    if (form.items.some(i => !i.product_id || i.quantity <= 0)) return toast.error('Check item details');
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Internal Transfer</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Operations Section */}
          <Card>
            <CardHeader><CardTitle>Operation Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Scheduled Date</Label>
                <Input id="date" type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea id="notes" placeholder="Reason for transfer..." className="min-h-[105px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Locations Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm font-medium">Source</CardTitle></CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="grid gap-2">
                  <Label>From Warehouse *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.from_warehouse_id} onChange={e => setForm({ ...form, from_warehouse_id: e.target.value, from_location_id: '' })}>
                    <option value="">Select source warehouse...</option>
                    {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>From Location *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.from_location_id} onChange={e => setForm({ ...form, from_location_id: e.target.value })} disabled={!form.from_warehouse_id}>
                    <option value="">Select source location...</option>
                    {fromLocations?.filter(l => l.type === 'internal').map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm font-medium">Destination</CardTitle></CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="grid gap-2">
                  <Label>To Warehouse *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.to_warehouse_id} onChange={e => setForm({ ...form, to_warehouse_id: e.target.value, to_location_id: '' })}>
                    <option value="">Select destination warehouse...</option>
                    {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>To Location *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.to_location_id} onChange={e => setForm({ ...form, to_location_id: e.target.value })} disabled={!form.to_warehouse_id}>
                    <option value="">Select destination location...</option>
                    {toLocations?.filter(l => l.type === 'internal').map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products to Transfer</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          </CardHeader>
          <CardContent>
            {form.items.length > 0 && (
              <div className="grid grid-cols-[1fr_120px_60px] gap-4 mb-2 px-2">
                <div className="text-sm font-medium text-muted-foreground">Product</div>
                <div className="text-sm font-medium text-muted-foreground">Quantity</div>
                <div></div>
              </div>
            )}
            
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_60px] gap-4 mb-3 items-center group">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                  <option value="">Select product...</option>
                  {products?.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                </select>
                <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} required />
                <Button type="button" variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {!form.items.length && <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">No items added to this transfer yet. <br/><Button variant="link" onClick={addItem}>Add items to transfer</Button></div>}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Transfer
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
