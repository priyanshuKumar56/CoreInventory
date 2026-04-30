import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { deliveriesAPI } from '@/services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Download, Edit, Printer, X, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validateData, setValidateData] = useState([]);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveriesAPI.getById(id).then(r => r.data.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, data }) => deliveriesAPI.action(id, action, data),
    onSuccess: (res, variables) => {
      toast.success(`Delivery ${variables.action}ed successfully`);
      setShowValidateModal(false);
      qc.invalidateQueries({ queryKey: ['delivery', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>;
  if (!delivery) return <div className="flex flex-col items-center justify-center p-12 text-muted-foreground"><h3 className="text-xl font-medium">Delivery not found</h3></div>;

  const handleValidateClick = () => {
    setValidateData(delivery.items.map(item => ({ id: item.id, qty: item.quantity, done: item.quantity })));
    setShowValidateModal(true);
  };

  const submitValidate = () => {
    actionMutation.mutate({ action: 'validate' });
  };

  const steps = ['waiting', 'ready', 'done'];
  const currentStep = steps.indexOf(delivery.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/deliveries')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{delivery.reference}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              Outgoing Delivery <ChevronRight className="h-3 w-3" /> {delivery.warehouse_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          {delivery.status === 'waiting' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/deliveries/${id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => actionMutation.mutate({ action: 'confirm' })} disabled={actionMutation.isPending}><Check className="mr-2 h-4 w-4" /> Wait for Materials</Button>
              {isAdminOrManager && (
                <Button size="sm" onClick={() => actionMutation.mutate({ action: 'validate' })} disabled={actionMutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Validate Delivery</Button>
              )}
              {isAdminOrManager && (
                <Button variant="destructive" size="sm" onClick={() => actionMutation.mutate({ action: 'cancel' })} disabled={actionMutation.isPending}><X className="mr-2 h-4 w-4" /> Cancel</Button>
              )}
            </>
          )}
          {(delivery.status === 'ready' || delivery.status === 'late') && (
            <>
              {isAdminOrManager && (
                <Button size="sm" onClick={handleValidateClick} disabled={actionMutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Pack and Ship</Button>
              )}
              {isAdminOrManager && (
                <Button variant="destructive" size="sm" onClick={() => actionMutation.mutate({ action: 'cancel' })} disabled={actionMutation.isPending}><X className="mr-2 h-4 w-4" /> Cancel</Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-card rounded-xl border">
        {delivery.status === 'cancelled' ? (
          <div className="flex items-center text-destructive font-semibold text-lg"><XCircle className="mr-2 h-6 w-6" /> CANCELLED</div>
        ) : (
          <div className="flex items-center w-full max-w-3xl">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1 relative">
                <div className={cn("z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold bg-background transition-colors", currentStep >= i ? "border-primary text-primary" : "border-muted text-muted-foreground", currentStep === i && "bg-primary text-primary-foreground")}>
                  {i + 1}
                </div>
                <div className={cn("mt-2 text-sm font-medium uppercase tracking-wider", currentStep >= i ? "text-primary" : "text-muted-foreground")}>{step}</div>
                {i < steps.length - 1 && <div className={cn("absolute top-5 -right-1/2 w-full h-[2px] -translate-y-1/2", currentStep > i ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Customer/Contact</span>
              <span className="col-span-2 font-medium">{delivery.contact_name || '—'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Scheduled Date</span>
              <span className="col-span-2">{delivery.scheduled_date ? dayjs(delivery.scheduled_date).format('MMMM D, YYYY') : '—'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Source Document</span>
              <span className="col-span-2">{delivery.source_document || '—'}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Logistics Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Warehouse</span>
              <span className="col-span-2">{delivery.warehouse_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Source Location</span>
              <span className="col-span-2">{delivery.source_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Responsible</span>
              <span className="col-span-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {delivery.responsible_name?.[0]?.toUpperCase() || '?'}
                </div>
                {delivery.responsible_name || 'Unassigned'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items to Deliver</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Demanded Qty</TableHead>
                {delivery.status === 'done' && <TableHead className="text-right">Failed/Short Qty</TableHead>}
                {delivery.status === 'done' && <TableHead className="text-right">Delivered Qty</TableHead>}
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.items?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  {delivery.status === 'done' && <TableCell className="text-right font-mono text-destructive">{0}</TableCell>}
                  {delivery.status === 'done' && <TableCell className="text-right font-mono text-green-600 font-bold">{item.quantity}</TableCell>}
                  <TableCell>{item.unit_of_measure}</TableCell>
                </TableRow>
              ))}
              {!delivery.items?.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No items in this delivery</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {delivery.notes && (
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{delivery.notes}</p></CardContent>
        </Card>
      )}

      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pack and Ship Delivery</DialogTitle>
            <DialogDescription>
              Confirm the quantities to be deducted from stock for {delivery.reference}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24 text-center">To Deliver</TableHead>
                  <TableHead className="w-24 text-right">Done</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delivery.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{item.product_name}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" min="0" max={item.quantity}
                        value={validateData.find(d => d.id === item.id)?.done || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setValidateData(prev => prev.map(p => p.id === item.id ? { ...p, done: val } : p));
                        }}
                        className="h-8 text-right font-mono text-sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateModal(false)}>Cancel</Button>
            <Button onClick={submitValidate} disabled={actionMutation.isPending}>{actionMutation.isPending ? 'Processing...' : 'Confirm Delivery'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
