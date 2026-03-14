import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Building2, Save, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Settings() {
  const qc = useQueryClient();

  const { data: whData, isLoading: whLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesAPI.getAll().then(r => r.data),
  });

  const { data: locData, isLoading: locLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => warehousesAPI.getLocations().then(r => r.data),
  });

  const warehouses = whData?.data || [];
  const locations = locData?.data || [];

  const [newWh, setNewWh] = useState({ name: '', code: '', address: '' });
  const [newLoc, setNewLoc] = useState({ name: '', code: '', warehouse_id: '', type: 'internal' });

  const whMutation = useMutation({
    mutationFn: (data) => warehousesAPI.create(data),
    onSuccess: () => {
      toast.success('Warehouse created');
      setNewWh({ name: '', code: '', address: '' });
      qc.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create warehouse'),
  });

  const locMutation = useMutation({
    mutationFn: (data) => warehousesAPI.createLocation(data),
    onSuccess: () => {
      toast.success('Location created');
      setNewLoc({ name: '', code: '', warehouse_id: '', type: 'internal' });
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create location'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your physical and logical inventory structure</p>
      </div>

      <Tabs defaultValue="warehouses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="warehouses"><Building2 className="w-4 h-4 mr-2" /> Warehouses & Locations</TabsTrigger>
          <TabsTrigger value="general">General Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="warehouses" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Warehouses</CardTitle>
                <CardDescription>A warehouse is a physical building where items are stored.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={e => { e.preventDefault(); whMutation.mutate(newWh); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wh_name">Warehouse Name</Label>
                      <Input id="wh_name" placeholder="e.g. Main Hub" value={newWh.name} onChange={e => setNewWh({ ...newWh, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wh_code">Short Code</Label>
                      <Input id="wh_code" placeholder="e.g. WH1" value={newWh.code} onChange={e => setNewWh({ ...newWh, code: e.target.value.toUpperCase() })} required maxLength={5} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wh_address">Address (Optional)</Label>
                    <Input id="wh_address" placeholder="Physical location address" value={newWh.address} onChange={e => setNewWh({ ...newWh, address: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={whMutation.isPending}><Plus className="w-4 h-4 mr-2"/> {whMutation.isPending ? 'Adding...' : 'Add Warehouse'}</Button>
                </form>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whLoading ? <TableRow><TableCell colSpan={2} className="text-center">Loading...</TableCell></TableRow> : 
                       warehouses.map(w => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono">{w.code}</TableCell>
                          <TableCell>{w.name}</TableCell>
                        </TableRow>
                      ))}
                      {!warehouses.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground p-4">No warehouses configured</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal Locations</CardTitle>
                <CardDescription>Locations are specific aisles, shelves, or bins inside a warehouse.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={e => { e.preventDefault(); locMutation.mutate(newLoc); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loc_wh">Parent Warehouse</Label>
                      <select id="loc_wh" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={newLoc.warehouse_id} onChange={e => setNewLoc({ ...newLoc, warehouse_id: e.target.value })} required>
                        <option value="">Select...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loc_type">Location Type</Label>
                      <select id="loc_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={newLoc.type} onChange={e => setNewLoc({ ...newLoc, type: e.target.value })} required>
                        <option value="internal">Internal (Shelves/Aisles)</option>
                        <option value="vendor">Vendor Location</option>
                        <option value="customer">Customer Location</option>
                        <option value="transit">Transit/Movement</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loc_code">Location Code</Label>
                      <Input id="loc_code" placeholder="e.g. A1-S2" value={newLoc.code} onChange={e => setNewLoc({ ...newLoc, code: e.target.value.toUpperCase() })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loc_name">Name</Label>
                      <Input id="loc_name" placeholder="e.g. Aisle 1 Shelf 2" value={newLoc.name} onChange={e => setNewLoc({ ...newLoc, name: e.target.value })} required />
                    </div>
                  </div>
                  <Button type="submit" variant="secondary" disabled={locMutation.isPending}><Plus className="w-4 h-4 mr-2"/> {locMutation.isPending ? 'Adding...' : 'Add Location'}</Button>
                </form>

                <div className="border rounded-md max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locLoading ? <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow> : 
                       locations.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs">{l.warehouse_name}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{l.warehouse_code}/{l.name}</TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">{l.type}</TableCell>
                        </TableRow>
                      ))}
                      {!locations.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground p-4">No locations configured</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Coming Soon</CardTitle><CardDescription>System-wide defaults, currency, taxes, and notification preferences will live here.</CardDescription></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 rounded-xl">General settings under development</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
