import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: '', sku: '', type: 'storable', category_id: '',
    price: 0, cost: 0, reorder_point: 0, barcode: '', notes: '', unit_of_measure: 'Units'
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsAPI.getCategories().then(r => r.data.data),
  });

  useEffect(() => {
    if (isEdit) {
      productsAPI.getById(id).then(({ data }) => {
        const p = data.data;
        setForm({
          name: p.name, sku: p.sku || '', type: p.type || 'storable',
          category_id: p.category_id || '', price: p.price || 0, cost: p.cost || 0,
          reorder_point: p.reorder_point || 0, barcode: p.barcode || '',
          notes: p.notes || '', unit_of_measure: p.unit_of_measure || 'Units'
        });
      });
    }
  }, [id, isEdit]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? productsAPI.update(id, data) : productsAPI.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      qc.invalidateQueries({ queryKey: ['products'] });
      navigate(`/products/${isEdit ? id : res.data.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const categoryMutation = useMutation({
    mutationFn: (data) => productsAPI.createCategory(data),
    onSuccess: (res) => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setForm({ ...form, category_id: res.data.data.id });
      setShowCatModal(false);
      setNewCatName('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.type) return toast.error('Name and Type are required');
    if (form.price < 0 || form.cost < 0) return toast.error('Price and Cost cannot be negative');
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure product details and tracking settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Information */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" placeholder="E.g. Steel Pipe 10mm" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sku">SKU / Internal Reference</Label>
                <Input id="sku" placeholder="E.g. SP-10MM-001" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Product Type *</Label>
                <select id="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="storable">Storable Product (Track Stock)</option>
                  <option value="consumable">Consumable (Don't Track Stock)</option>
                </select>
                <p className="text-[0.8rem] text-muted-foreground flex items-center mt-1">
                  <Info className="w-3 h-3 mr-1" />
                  Storable products have their inventory levels strictly tracked via warehouse operations.
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="category">Category</Label>
                  <Button type="button" variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => setShowCatModal(true)}>
                    + New Category
                  </Button>
                </div>
                <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">No Category</option>
                  {Array.isArray(categories) && categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Units */}
          <Card>
            <CardHeader><CardTitle>Pricing & Units</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Sales Price (₹)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input id="cost" type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <select id="uom" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })}>
                  <option value="Units">Units</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Kg">Kilograms (Kg)</option>
                  <option value="Liters">Liters (L)</option>
                  <option value="Meters">Meters (m)</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Pallets">Pallets</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Logistics */}
          <Card>
            <CardHeader><CardTitle>Tracking & Logistics</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode Number (EAN/UPC)</Label>
                <Input id="barcode" placeholder="e.g. 123456789012" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
              </div>
              {form.type === 'storable' && (
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="reorder_point">Reorder Point Rule</Label>
                  <Input id="reorder_point" type="number" min="0" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: parseFloat(e.target.value) || 0 })} />
                  <p className="text-[0.8rem] text-muted-foreground mt-1">If stock falls at or below this amount, it will be flagged for reordering.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea id="notes" placeholder="Any internal descriptions, instructions, or supplier preferred terms..." className="min-h-[100px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>

      {/* Category Creation Modal */}
      <Dialog open={showCatModal} onOpenChange={setShowCatModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a new product category to organize your catalog.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="catName">Category Name</Label>
              <Input id="catName" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Electronics, Raw Materials" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newCatName.trim()) return;
              categoryMutation.mutate({ name: newCatName.trim() });
            }} disabled={categoryMutation.isPending || !newCatName.trim()}>
              {categoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
