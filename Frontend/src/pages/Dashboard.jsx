import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardAPI } from '@/services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  PackageOpen, AlertTriangle, BadgeDollarSign,
  FileText, Truck, ArrowLeftRight, ArrowRight, Activity, TrendingUp,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);

const KPICard = ({ title, icon: Icon, value, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-muted-foreground/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="tracking-tight text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg bg-opacity-10", colorClass.replace('text-', 'bg-'))}>
          <Icon className={cn("h-4 w-4", colorClass)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">Live from warehouse</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  if (isLoading) return <div className="flex justify-center items-center h-[80vh]"><Activity className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg border border-destructive/20"><h3 className="text-xl font-bold">Failed to load dashboard</h3><p className="mt-2 text-sm text-destructive/80">{error.message}</p></div>;

  const { kpis, receipts, deliveries, transfers, recentMoves } = data;

  // Transform recent moves for chart (group by date)
  const chartData = recentMoves.reduce((acc, move) => {
    const date = dayjs(move.created_at).format('MMM DD');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      if (move.move_type === 'receipt') existing.in += Number(move.quantity);
      if (move.move_type === 'delivery') existing.out += Number(move.quantity);
    } else {
      acc.push({ 
        date, 
        in: move.move_type === 'receipt' ? Number(move.quantity) : 0, 
        out: move.move_type === 'delivery' ? Number(move.quantity) : 0 
      });
    }
    return acc;
  }, []).reverse().slice(0, 7);

  return (
    <div className="flex-1 space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Here is what's happening in your inventory today.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/moves')}><TrendingUp className="mr-2 h-4 w-4" /> Move Ledger</Button>
            {isAdminOrManager && (
              <Button size="sm" onClick={() => navigate('/products/new')}><Plus className="mr-2 h-4 w-4" /> New Product</Button>
            )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <KPICard title="In Stock Items" value={kpis.totalProducts} icon={PackageOpen} colorClass="text-indigo-600" delay={0.1} />
        <KPICard title="Low Stock Warning" value={kpis.lowStock} icon={AlertTriangle} colorClass="text-amber-600" delay={0.2} />
        {isAdminOrManager && (
          <KPICard title="Total Inventory Value" value={`₹${Number(kpis.stockValue).toLocaleString()}`} icon={BadgeDollarSign} colorClass="text-emerald-600" delay={0.3} />
        )}
        <KPICard title="Pending Receipts" value={receipts?.pending || 0} icon={FileText} colorClass="text-sky-600" delay={0.4} />
        <KPICard title="Delivery Orders" value={deliveries?.pending || 0} icon={Truck} colorClass="text-fuchsia-600" delay={0.5} />
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-4 transition-all border-muted-foreground/10">
          <CardHeader>
            <CardTitle>Movement Velocity</CardTitle>
            <CardDescription>Daily inflow and outflow of stock items across all warehouses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="in" name="Receipts" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                <Area type="monotone" dataKey="out" name="Deliveries" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
             <Card className="transition-all hover:bg-muted/50 cursor-pointer border-l-4 border-l-blue-500" onClick={() => navigate('/receipts')}>
                <CardHeader className="py-3 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold">Incoming Traffic</CardTitle>
                    <FileText className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold">{receipts?.pending || 0}</div>
                            <div className="text-xs text-muted-foreground">Unreceived Shipments</div>
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className="text-red-500 bg-red-50 border-red-200">{receipts?.late || 0} Critical</Badge>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card className="transition-all hover:bg-muted/50 cursor-pointer border-l-4 border-l-purple-500" onClick={() => navigate('/deliveries')}>
                <CardHeader className="py-3 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold">Outgoing Logistics</CardTitle>
                    <Truck className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold">{deliveries?.pending || 0}</div>
                            <div className="text-xs text-muted-foreground">Orders to Pick & Ship</div>
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">{deliveries?.ready || 0} Ready</Badge>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card className="transition-all hover:bg-muted/50 cursor-pointer border-l-4 border-l-emerald-500" onClick={() => navigate('/transfers')}>
                <CardHeader className="py-3 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold">Relocation Status</CardTitle>
                    <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold">{transfers?.pending || 0}</div>
                            <div className="text-xs text-muted-foreground">Internal Moves in Progress</div>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Global Activity Log</CardTitle>
            <CardDescription>Real-time audit stream of all inventory actions across the enterprise.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/moves')}>View Ledger</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead>From/To</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMoves?.length ? recentMoves.map((m) => (
                <TableRow key={m.id} className="group hover:bg-muted/30">
                  <TableCell>
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        m.move_type === 'receipt' ? "bg-green-500" :
                        m.move_type === 'delivery' ? "bg-red-500" : "bg-blue-500"
                    )} />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">{m.product_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.sku}</div>
                  </TableCell>
                  <TableCell className={cn(
                      "text-right font-mono font-bold",
                      m.move_type === 'receipt' ? "text-green-600" : "text-red-600"
                  )}>
                    {m.move_type === 'receipt' ? '+' : '-'}{m.quantity}
                  </TableCell>
                  <TableCell className="text-xs">
                    {m.from_location ? <span className="text-muted-foreground">{m.from_location} → </span> : null}
                    <span className="font-medium">{m.to_location || m.from_location}</span>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] opacity-70">{m.reference}</TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground whitespace-nowrap">{dayjs(m.created_at).fromNow()}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No activity found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
