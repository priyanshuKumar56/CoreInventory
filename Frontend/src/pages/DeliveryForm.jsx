import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveriesAPI, warehousesAPI, contactsAPI, productsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge'; 

export default function DeliveryForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    contact_id: '', warehouse_id: '', source_location_id: '',
    scheduled_date: '', source_document: '', notes: '', items: []
  });

  const { data: contacts } = useQuery({ queryKey: ['contacts'], queryFn: () => contactsAPI.getAll({ type: 'customer' }).then(r => r.data.data) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehousesAPI.getAll().then(r => r.data.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsAPI.getAll({ limit: 200 }).then(r => r.data.data) });
  
  const { data: locations } = useQuery({
    queryKey: ['locations', form.warehouse_id],
    queryFn: () => warehousesAPI.getLocations({ warehouse_id: form.warehouse_id }).then(r => r.data.data),
    enabled: !!form.warehouse_id,
  });

  useEffect(() => {
    if (isEdit) {
      deliveriesAPI.getById(id).then(({ data }) => {
        const d = data.data;
        setForm({
          contact_id: d.contact_id || '', warehouse_id: d.warehouse_id || '',
          source_location_id: d.source_location_id || '',
          scheduled_date: d.scheduled_date ? d.scheduled_date.split('T')[0] : '',
          source_document: d.source_document || '', notes: d.notes || '',
          items: d.items?.map(i => ({ product_id: i.product_id, quantity: i.quantity })) || []
        });
      });
    }
  }, [id, isEdit]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? deliveriesAPI.update(id, data) : deliveriesAPI.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Delivery updated' : 'Delivery created');
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      navigate(`/deliveries/${isEdit ? id : res.data.data.id}`);
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
    if (!form.warehouse_id || !form.source_location_id) return toast.error('Warehouse and Location are required');
    if (!form.items.length) return toast.error('Add at least one item');
    if (form.items.some(i => !i.product_id || i.quantity <= 0)) return toast.error('Check item details');
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Delivery' : 'New Delivery'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Section */}
          <Card>
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer / Contact</Label>
                <select id="customer" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}>
                  <option value="">Select a customer...</option>
                  {contacts?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Scheduled Date</Label>
                <Input id="date" type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Source Document</Label>
                <Input placeholder="e.g. SO0001" value={form.source_document} onChange={e => setForm({ ...form, source_document: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Logistics Section */}
          <Card>
            <CardHeader><CardTitle>Logistics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <select id="warehouse" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value, source_location_id: '' })}>
                  <option value="">Select warehouse...</option>
                  {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Source Location *</Label>
                <select id="location" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.source_location_id} onChange={e => setForm({ ...form, source_location_id: e.target.value })} disabled={!form.warehouse_id}>
                  <option value="">Select location to pick from...</option>
                  {locations?.filter(l => l.type === 'internal').map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products to Deliver</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          </CardHeader>
          <CardContent>
            {form.items.length > 0 && (
              <div className="grid grid-cols-[1fr_120px_100px_60px] gap-4 mb-2 px-2">
                <div className="text-sm font-medium text-muted-foreground">Product</div>
                <div className="text-sm font-medium text-muted-foreground">Demand Qty</div>
                <div className="text-sm font-medium text-muted-foreground">Available</div>
                <div></div>
              </div>
            )}
            
            {form.items.map((item, i) => {
              const selectedProduct = products?.find(p => p.id === item.product_id);
              const isShort = selectedProduct && item.quantity > (selectedProduct.total_stock || 0);

              return (
                <div key={i} className="grid grid-cols-[1fr_120px_100px_60px] gap-4 mb-3 items-center group">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                    <option value="">Select product...</option>
                    {products?.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                  </select>
                  <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} required />
                  <div className="text-sm flex items-center">
                    {selectedProduct ? (
                      <span className={isShort ? "text-destructive font-medium flex items-center" : "text-muted-foreground"}>
                        {isShort && <AlertCircle className="w-3 h-3 mr-1" />}
                        {selectedProduct.total_stock || 0}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            
            {!form.items.length && <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">No items added to this delivery yet. <br/><Button variant="link" onClick={addItem}>Add items to deliver</Button></div>}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" placeholder="Delivery instructions..." className="min-h-[100px] mt-2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Delivery'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
