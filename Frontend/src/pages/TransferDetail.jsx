import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { transfersAPI } from '@/services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, ChevronRight, Printer, X, XCircle, ArrowRightLeft, Calendar, User, MapPin, Warehouse, Clock, Package } from 'lucide-react';
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

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showValidateModal, setShowValidateModal] = useState(false);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data: transfer, isLoading } = useQuery({
    queryKey: ['transfer', id],
    queryFn: () => transfersAPI.getById(id).then(r => r.data.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action }) => transfersAPI.action(id, action),
    onSuccess: (res, variables) => {
      toast.success(`Transfer ${variables.action}ed successfully`);
      setShowValidateModal(false);
      qc.invalidateQueries({ queryKey: ['transfer', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>;
  if (!transfer) return <div className="flex flex-col items-center justify-center p-12 text-muted-foreground"><h3 className="text-xl font-medium">Transfer not found</h3></div>;

  const statusColors = { draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', ready: 'bg-blue-500/10 text-blue-500 border-blue-500/30', done: 'bg-green-500/10 text-green-500 border-green-500/30', cancelled: 'bg-destructive/10 text-destructive border-destructive/30' };
  const steps = ['draft', 'ready', 'done'];
  const currentStep = steps.indexOf(transfer.status);

  const totalItems = transfer.items?.length || 0;
  const totalQty = transfer.items?.reduce((sum, i) => sum + parseFloat(i.quantity), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transfers')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{transfer.reference}</h1>
              <Badge variant="outline" className={cn("uppercase text-xs font-bold", statusColors[transfer.status])}>{transfer.status}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <ArrowRightLeft className="h-4 w-4" />
              Internal Transfer
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{transfer.warehouse_name}</span>
              <span className="font-mono text-xs">({transfer.warehouse_code})</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          {transfer.status === 'draft' && isAdminOrManager && (
            <>
              <Button size="sm" onClick={() => actionMutation.mutate({ action: 'confirm' })} disabled={actionMutation.isPending}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm
              </Button>
              <Button variant="destructive" size="sm" onClick={() => actionMutation.mutate({ action: 'cancel' })} disabled={actionMutation.isPending}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </>
          )}
          {transfer.status === 'ready' && isAdminOrManager && (
            <>
              <Button size="sm" onClick={() => setShowValidateModal(true)} disabled={actionMutation.isPending}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Validate & Move Stock
              </Button>
              <Button variant="destructive" size="sm" onClick={() => actionMutation.mutate({ action: 'cancel' })} disabled={actionMutation.isPending}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="flex items-center justify-center p-6 bg-card rounded-xl border">
        {transfer.status === 'cancelled' ? (
          <div className="flex items-center text-destructive font-semibold text-lg"><XCircle className="mr-2 h-6 w-6" /> CANCELLED</div>
        ) : (
          <div className="flex items-center w-full max-w-lg">
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

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Transfer Operations */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Transfer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Reference</span>
              <span className="font-mono font-bold">{transfer.reference}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Warehouse</span>
              <span className="font-medium">{transfer.warehouse_name} <span className="font-mono text-xs text-muted-foreground">({transfer.warehouse_code})</span></span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Scheduled Date</span>
              <span>{transfer.scheduled_date ? dayjs(transfer.scheduled_date).format('MMMM D, YYYY') : '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Responsible</span>
              <span className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {transfer.responsible_name?.[0]?.toUpperCase() || '?'}
                </div>
                {transfer.responsible_name || 'Unassigned'}
              </span>
            </div>
            {transfer.validated_at && (
              <div className="grid grid-cols-2 gap-2 border-b pb-3">
                <span className="text-muted-foreground text-sm font-medium">Validated At</span>
                <span className="text-sm">{dayjs(transfer.validated_at).format('MMM D, YYYY h:mm A')}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground text-sm font-medium">Created</span>
              <span className="text-sm">{dayjs(transfer.created_at).format('MMM D, YYYY h:mm A')}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Source Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" /> Source Location</CardTitle>
            <CardDescription>Stock will be picked from this location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Location</span>
              <span className="font-medium">{transfer.from_location_name || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground text-sm font-medium">Warehouse</span>
              <span>{transfer.warehouse_name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Destination Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-500" /> Destination Location</CardTitle>
            <CardDescription>Stock will be placed at this location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Location</span>
              <span className="font-medium">{transfer.to_location_name || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground text-sm font-medium">Warehouse</span>
              <span>{transfer.warehouse_name}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Items to Transfer</CardTitle>
          <CardDescription>{totalItems} product(s) — {totalQty} total units</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Demand Qty</TableHead>
                <TableHead className="text-right">Done Qty</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.items?.map((item, i) => (
                <TableRow key={item.id || i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">{item.done_qty || '0'}</TableCell>
                  <TableCell className="uppercase text-xs text-muted-foreground">{item.unit_of_measure}</TableCell>
                </TableRow>
              ))}
              {!transfer.items?.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items in this transfer</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {transfer.notes && (
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{transfer.notes}</p></CardContent>
        </Card>
      )}

      {/* Validate Confirmation Dialog */}
      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Transfer</DialogTitle>
            <DialogDescription>
              This will immediately move <strong>{totalQty} units</strong> of {totalItems} product(s) from <strong>{transfer.from_location_name}</strong> to <strong>{transfer.to_location_name}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateModal(false)}>Cancel</Button>
            <Button onClick={() => actionMutation.mutate({ action: 'validate' })} disabled={actionMutation.isPending}>{actionMutation.isPending ? 'Processing...' : 'Confirm & Move Stock'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
