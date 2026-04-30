import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '@/services/api';
import dayjs from 'dayjs';
import { ArrowLeft, Box, Edit, TrendingDown, TrendingUp, AlertTriangle, Barcode, Tag, Calendar, User, Clock, Package, Warehouse, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelector } from 'react-redux';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // getProductById already returns stock_breakdown and recent_moves
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id).then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 animate-spin rounded-full border-b-2 border-primary"></div></div>;
  if (!product) return <div className="text-center p-12 text-muted-foreground">Product not found</div>;

  const stockItems = product.stock_breakdown || [];
  const moves = product.recent_moves || [];
  const totalStock = parseFloat(product.total_stock || 0);
  const reorderPoint = parseFloat(product.reorder_point || 0);
  const isLowStock = product.type === 'storable' && totalStock <= reorderPoint && reorderPoint > 0;
  const marginPercent = product.sale_price > 0 ? (((product.sale_price - product.cost_price) / product.sale_price) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 border items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <Box className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{product.sku}</span>
                {product.barcode && <span className="font-mono text-sm text-muted-foreground flex items-center gap-1"><Barcode className="h-3 w-3" /> {product.barcode}</span>}
                <Badge variant="outline" className="capitalize">{product.category_name || 'Uncategorized'}</Badge>
                <Badge variant={product.is_active ? 'default' : 'destructive'} className="capitalize">{product.is_active ? 'Active' : 'Inactive'}</Badge>
                <Badge variant="secondary" className="capitalize">{product.type}</Badge>
              </div>
            </div>
          </div>
        </div>
        {isAdminOrManager && (
          <Button variant="secondary" onClick={() => navigate(`/products/${id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit Product</Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sales Price</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹{parseFloat(product.sale_price).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Margin: {marginPercent}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cost Price</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹{parseFloat(product.cost_price).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per {product.unit_of_measure}</p>
          </CardContent>
        </Card>
        
        {product.type === 'storable' && (
          <>
            <Card className={isLowStock ? 'border-destructive/50 bg-destructive/5' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Total Stock {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${isLowStock ? 'text-destructive' : ''}`}>
                  {totalStock} {product.unit_of_measure}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reorder at {reorderPoint} {product.unit_of_measure}
                  {isLowStock && <span className="text-destructive font-semibold"> — RESTOCK NEEDED</span>}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">₹{(totalStock * parseFloat(product.cost_price)).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">At cost price across all locations</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="general">Product Info</TabsTrigger>
          {product.type === 'storable' && <TabsTrigger value="inventory">Stock & Locations</TabsTrigger>}
          <TabsTrigger value="history">Move History</TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Product Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Product Type</span>
                  <span className="capitalize font-medium">{product.type || 'storable'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">SKU Code</span>
                  <span className="font-mono font-medium">{product.sku}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Category</span>
                  <span>{product.category_name || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Unit of Measure</span>
                  <span className="uppercase">{product.unit_of_measure}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Barcode</span>
                  <span className="font-mono">{product.barcode || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Reorder Point</span>
                  <span className="font-mono">{product.reorder_point} {product.unit_of_measure}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground font-medium text-sm">Initial Stock</span>
                  <span className="font-mono">{product.initial_stock} {product.unit_of_measure}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pricing & Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Sales Price</span>
                  <span className="font-mono font-bold text-green-600">₹{parseFloat(product.sale_price).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Cost Price</span>
                  <span className="font-mono font-bold">₹{parseFloat(product.cost_price).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Profit Margin</span>
                  <span className={`font-bold ${marginPercent > 0 ? 'text-green-600' : 'text-destructive'}`}>{marginPercent}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Status</span>
                  <Badge variant={product.is_active ? 'default' : 'destructive'}>{product.is_active ? 'Active' : 'Archived'}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <span className="text-muted-foreground font-medium text-sm">Created At</span>
                  <span className="text-sm">{dayjs(product.created_at).format('MMMM D, YYYY [at] h:mm A')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground font-medium text-sm">Last Updated</span>
                  <span className="text-sm">{dayjs(product.updated_at).format('MMMM D, YYYY [at] h:mm A')}</span>
                </div>
              </CardContent>
            </Card>

            {product.description && (
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Description / Internal Notes</CardTitle></CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        {product.type === 'storable' && (
          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Stock Distribution by Location</CardTitle>
                <CardDescription>Current physical quantities across all warehouse locations</CardDescription>
              </CardHeader>
              <CardContent>
                {stockItems.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No stock currently held for this product</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Value (at Cost)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-medium">{item.warehouse_name}</div>
                            <div className="text-xs font-mono text-muted-foreground">{item.warehouse_code}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.location_name}</div>
                            <div className="text-xs font-mono text-muted-foreground">{item.location_code}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">{item.quantity} {product.unit_of_measure}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">₹{(parseFloat(item.quantity) * parseFloat(product.cost_price)).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right font-mono">{totalStock} {product.unit_of_measure}</TableCell>
                        <TableCell className="text-right font-mono">₹{(totalStock * parseFloat(product.cost_price)).toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Move History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Recent Stock Movements</CardTitle>
              <CardDescription>Last 10 transactions affecting this product</CardDescription>
            </CardHeader>
            <CardContent>
              {moves.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No movement history yet</p>
              ) : (
                <div className="space-y-4">
                  {moves.map((move, idx) => {
                    const isOut = move.move_type === 'delivery';
                    const isAdj = move.move_type === 'adjustment';
                    const isTransfer = move.move_type === 'transfer';
                    const labels = { receipt: 'Received', delivery: 'Delivered', transfer: 'Transferred', adjustment: 'Adjusted' };

                    return (
                      <div key={idx} className="flex items-start gap-4 text-sm border-b pb-4 last:border-0 last:pb-0">
                        <div className={`mt-0.5 rounded-full p-2 ${isOut ? 'bg-red-500/10 text-red-500' : isAdj ? 'bg-orange-500/10 text-orange-500' : isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                          {isOut ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {labels[move.move_type] || move.move_type} <span className="font-mono font-bold">{move.quantity}</span> {product.unit_of_measure}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{move.reference}</span>
                            <span className="mx-1">•</span>
                            {move.from_location || 'External (Vendor)'} → {move.to_location || 'External (Customer)'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
                          <div>{dayjs(move.created_at).format('MMM D, YYYY')}</div>
                          <div>{dayjs(move.created_at).format('h:mm A')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
