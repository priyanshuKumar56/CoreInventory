import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { adjustmentsAPI } from '@/services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, ChevronRight, Printer, XCircle, FileEdit, ClipboardList, MapPin } from 'lucide-react';
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

export default function AdjustmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showValidateModal, setShowValidateModal] = useState(false);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data: adjustment, isLoading } = useQuery({
    queryKey: ['adjustment', id],
    queryFn: () => adjustmentsAPI.getById(id).then(r => r.data.data),
  });

  const validateMutation = useMutation({
    mutationFn: () => adjustmentsAPI.validate(id),
    onSuccess: () => {
      toast.success(`Adjustment validated successfully`);
      setShowValidateModal(false);
      qc.invalidateQueries({ queryKey: ['adjustment', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Validation failed'),
  });

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>;
  if (!adjustment) return <div className="flex flex-col items-center justify-center p-12 text-muted-foreground"><h3 className="text-xl font-medium">Adjustment not found</h3></div>;

  const statusColors = { draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', done: 'bg-green-500/10 text-green-500 border-green-500/30', cancelled: 'bg-destructive/10 text-destructive border-destructive/30' };
  const steps = ['draft', 'done'];
  const currentStep = steps.indexOf(adjustment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/adjustments')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{adjustment.reference}</h1>
              <Badge variant="outline" className={cn("uppercase text-xs font-bold", statusColors[adjustment.status])}>{adjustment.status}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <ClipboardList className="h-4 w-4" />
              Inventory Adjustment
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{adjustment.warehouse_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          {adjustment.status === 'draft' && isAdminOrManager && (
            <Button size="sm" onClick={() => setShowValidateModal(true)} disabled={validateMutation.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Validate & Apply
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="flex items-center justify-center p-6 bg-card rounded-xl border">
        {adjustment.status === 'cancelled' ? (
          <div className="flex items-center text-destructive font-semibold text-lg"><XCircle className="mr-2 h-6 w-6" /> CANCELLED</div>
        ) : (
          <div className="flex items-center w-full max-w-sm">
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
          <CardHeader><CardTitle className="flex items-center gap-2"><FileEdit className="h-4 w-4" /> Adjustment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Reference</span>
              <span className="font-mono font-bold">{adjustment.reference}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Created At</span>
              <span>{dayjs(adjustment.created_at).format('MMMM D, YYYY h:mm A')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Reason</span>
              <span>{adjustment.reason || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground text-sm font-medium">Responsible</span>
              <span className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {adjustment.responsible_name?.[0]?.toUpperCase() || '?'}
                </div>
                {adjustment.responsible_name || 'Unassigned'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</CardTitle>
            <CardDescription>Where the inventory count occurred</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 border-b pb-3">
              <span className="text-muted-foreground text-sm font-medium">Warehouse</span>
              <span className="font-medium">{adjustment.warehouse_name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground text-sm font-medium">Location</span>
              <span className="font-medium">{adjustment.location_name || 'All Locations'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counted Items</CardTitle>
          <CardDescription>Differences will be automatically reconciled upon validation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Theoretical Qty</TableHead>
                <TableHead className="text-right">Counted Qty</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustment.items?.map((item, i) => {
                const diff = parseFloat(item.counted_qty) - parseFloat(item.theoretical_qty);
                return (
                  <TableRow key={item.id || i}>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                    </TableCell>
                    <TableCell>{item.location_name || adjustment.location_name}</TableCell>
                    <TableCell className="text-right font-mono">{item.theoretical_qty}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{item.counted_qty}</TableCell>
                    <TableCell className={cn("text-right font-mono font-bold", diff > 0 ? "text-green-600" : diff < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {diff > 0 ? '+' : ''}{diff}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.unit_of_measure}</TableCell>
                  </TableRow>
                );
              })}
              {!adjustment.items?.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No items in this adjustment</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Adjustment</DialogTitle>
            <DialogDescription>
              This will update the inventory quantities to match the counted quantities. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateModal(false)}>Cancel</Button>
            <Button onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>{validateMutation.isPending ? 'Processing...' : 'Confirm & Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
