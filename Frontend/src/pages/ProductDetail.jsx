import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, stockAPI } from '@/services/api';
import dayjs from 'dayjs';
import { ArrowLeft, Box, Edit, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: productData, isLoading: pLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id).then(r => r.data.data),
  });

  const { data: stockData, isLoading: sLoading } = useQuery({
    queryKey: ['stock', 'product', id],
    queryFn: () => stockAPI.getOverview({ product_id: id }).then(r => r.data.data),
    enabled: !!productData && productData.type === 'storable',
  });

  const { data: movesData, isLoading: mLoading } = useQuery({
    queryKey: ['moves', 'product', id],
    queryFn: () => stockAPI.getMoves({ product_id: id, limit: 10 }).then(r => r.data.data),
    enabled: !!productData && productData.type === 'storable',
  });

  if (pLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 animate-spin rounded-full border-b-2 border-primary"></div></div>;
  if (!productData) return <div className="text-center p-12 text-muted-foreground">Product not found</div>;

  const product = productData;
  const stockItems = stockData?.items || [];
  const moves = movesData || [];

  const totalStock = stockItems.reduce((acc, curr) => acc + parseFloat(curr.quantity), 0);
  const reorderPoint = product.reorder_point || 0;
  const isLowStock = product.type === 'storable' && totalStock <= reorderPoint && reorderPoint > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 border items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <Box className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{product.sku}</span>
                {product.barcode && <span className="font-mono text-sm text-muted-foreground">| {product.barcode}</span>}
                <Badge variant="outline" className="capitalize">{product.category_name || 'Uncategorized'}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate(`/products/${id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit Product</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sales Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹{product.sale_price}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹{product.cost_price}</div>
          </CardContent>
        </Card>
        
        {product.type === 'storable' && (
          <>
            <Card className={isLowStock ? 'border-destructive/50 bg-destructive/5' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Total Stock {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${isLowStock ? 'text-destructive' : ''}`}>
                  {totalStock} {product.unit_of_measure}
                </div>
                {isLowStock && <p className="text-xs text-destructive/80 mt-1 font-medium">Below reorder point ({reorderPoint})</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">₹{(totalStock * product.cost_price).toLocaleString()}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="general">Information</TabsTrigger>
          {product.type === 'storable' && <TabsTrigger value="inventory">Inventory & Stock</TabsTrigger>}
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Product Configuration</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-muted-foreground font-medium text-sm col-span-1">Product Type</span>
                <span className="col-span-2 capitalize font-medium">{product.type || 'storable'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2 md:border-b-0">
                <span className="text-muted-foreground font-medium text-sm col-span-1">Unit of Measure</span>
                <span className="col-span-2">{product.unit_of_measure}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2 md:border-b-0">
                <span className="text-muted-foreground font-medium text-sm col-span-1">Reorder Point</span>
                <span className="col-span-2">{product.reorder_point || 'Not Set'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-2">
                <span className="text-muted-foreground font-medium text-sm col-span-1">Internal Notes</span>
                <span className="col-span-2 text-sm">{product.description || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {product.type === 'storable' && (
          <TabsContent value="inventory" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stock by Location</CardTitle>
                  <CardDescription>Current physical quantities across all warehouses</CardDescription>
                </CardHeader>
                <CardContent>
                  {sLoading ? <div className="py-4 text-center">Loading...</div> : stockItems.length === 0 ? <p className="text-muted-foreground py-4 text-center">No stock available</p> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="font-medium">{item.warehouse_name}</div>
                              <div className="text-xs text-muted-foreground">{item.location_name}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">{item.quantity} {item.unit_of_measure}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Movements</CardTitle>
                  <CardDescription>Last 10 stock transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {mLoading ? <div className="py-4 text-center">Loading...</div> : moves.length === 0 ? <p className="text-muted-foreground py-4 text-center">No movement history</p> : (
                    <div className="space-y-4">
                      {moves.map((move) => {
                        const isOut = move.move_type === 'delivery';
                        const isInternal = move.move_type === 'internal';
                        const isAdj = move.move_type === 'adjustment';

                        return (
                          <div key={move.id} className="flex items-start gap-4 text-sm border-b pb-4 last:border-0 last:pb-0">
                            <div className={`mt-0.5 rounded-full p-1.5 ${isOut ? 'bg-destructive/10 text-destructive' : isAdj ? 'bg-orange-500/10 text-orange-500' : isInternal ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                              {isOut ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {isOut ? 'Delivered' : isAdj ? 'Inventory Adjustment' : isInternal ? 'Internal Transfer' : 'Received'}{' '}
                                {move.quantity} {move.unit_of_measure}
                              </p>
                              <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                                Ref: {move.reference} • {move.from_location || 'Vendor'} → {move.to_location || 'Customer'}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {dayjs(move.created_at).format('MMM D, HH:mm')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
