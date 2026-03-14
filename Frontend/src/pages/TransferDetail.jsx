import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { transfersAPI } from '@/services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, ChevronRight, Printer, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  const steps = ['draft', 'done'];
  const currentStep = steps.indexOf(transfer.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transfers')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{transfer.reference}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              Internal Transfer <ChevronRight className="h-3 w-3" /> {transfer.from_warehouse} to {transfer.to_warehouse}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          {transfer.status === 'draft' && (
            <>
              {isAdminOrManager && (
                <Button size="sm" onClick={() => setShowValidateModal(true)} disabled={actionMutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Validate Transfer</Button>
              )}
              {isAdminOrManager && (
                <Button variant="destructive" size="sm" onClick={() => actionMutation.mutate({ action: 'cancel' })} disabled={actionMutation.isPending}><X className="mr-2 h-4 w-4" /> Cancel</Button>
              )}
            </>
          )}
        </div>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Scheduled Date</span>
              <span className="col-span-2">{transfer.scheduled_date ? dayjs(transfer.scheduled_date).format('MMMM D, YYYY') : '—'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Responsible</span>
              <span className="col-span-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {transfer.user_name?.[0]?.toUpperCase()}
                </div>
                {transfer.user_name}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 border-b pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Source Location</span>
              <span className="col-span-2">{transfer.from_warehouse} / {transfer.from_location}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              <span className="text-muted-foreground font-medium text-sm col-span-1">Destination Location</span>
              <span className="col-span-2">{transfer.to_warehouse} / {transfer.to_location}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items to Move</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.items?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{item.quantity}</TableCell>
                  <TableCell>{item.unit_of_measure}</TableCell>
                </TableRow>
              ))}
              {!transfer.items?.length && (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items in this transfer</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {transfer.notes && (
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{transfer.notes}</p></CardContent>
        </Card>
      )}

      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to validate this transfer? This will immediately move the stock from the source location to the destination location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateModal(false)}>Cancel</Button>
            <Button onClick={() => actionMutation.mutate({ action: 'validate' })} disabled={actionMutation.isPending}>{actionMutation.isPending ? 'Processing...' : 'Confirm Transfer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
