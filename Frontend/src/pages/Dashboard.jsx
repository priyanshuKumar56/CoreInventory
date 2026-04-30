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
    whileHover={{ y: -4 }}
  >
    <Card className="overflow-hidden hover:shadow-2xl hover:shadow-black/8 transition-all duration-300 border border-slate-200/40 bg-gradient-to-br from-white to-slate-50/50 group cursor-default">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
        <CardTitle className="tracking-tight text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{title}</CardTitle>
        <div className={cn("p-2.5 rounded-lg bg-opacity-15 group-hover:scale-110 transition-transform duration-300", colorClass.replace('text-', 'bg-'))}>
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 mt-2">Live from warehouse</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900">Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span> 👋</h2>
          <p className="text-slate-600 mt-2 font-medium">Here&apos;s what&apos;s happening in your inventory today.</p>
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
        <Card className="col-span-4 transition-all border border-slate-200/40 bg-gradient-to-br from-white to-slate-50/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900">Movement Velocity</CardTitle>
            <CardDescription className="text-slate-600">Daily inflow and outflow of stock items across all warehouses.</CardDescription>
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
             <Card className="transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 duration-300 cursor-pointer border border-blue-200/40 bg-gradient-to-br from-white to-blue-50/30" onClick={() => navigate('/receipts')}>
                <CardHeader className="py-4 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold text-slate-900">Incoming Traffic</CardTitle>
                    <div className="p-2 bg-blue-100/80 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">{receipts?.pending || 0}</div>
                            <div className="text-xs text-slate-600 font-medium">Unreceived Shipments</div>
                        </div>
                        <div className="text-right">
                           <Badge className="text-red-600 bg-red-100/80 border-red-300">{receipts?.late || 0} Critical</Badge>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card className="transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 duration-300 cursor-pointer border border-purple-200/40 bg-gradient-to-br from-white to-purple-50/30" onClick={() => navigate('/deliveries')}>
                <CardHeader className="py-4 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold text-slate-900">Outgoing Logistics</CardTitle>
                    <div className="p-2 bg-purple-100/80 rounded-lg">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">{deliveries?.pending || 0}</div>
                            <div className="text-xs text-slate-600 font-medium">Orders to Pick & Ship</div>
                        </div>
                        <div className="text-right">
                           <Badge className="text-amber-700 bg-amber-100/80 border-amber-300">{deliveries?.ready || 0} Ready</Badge>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card className="transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 duration-300 cursor-pointer border border-emerald-200/40 bg-gradient-to-br from-white to-emerald-50/30" onClick={() => navigate('/transfers')}>
                <CardHeader className="py-4 items-center flex-row justify-between space-y-0">
                    <CardTitle className="text-sm font-bold text-slate-900">Relocation Status</CardTitle>
                    <div className="p-2 bg-emerald-100/80 rounded-lg">
                      <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">{transfers?.pending || 0}</div>
                            <div className="text-xs text-slate-600 font-medium">Internal Moves in Progress</div>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>

      <Card className="border border-slate-200/40 bg-gradient-to-br from-white to-slate-50/50 shadow-lg shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-slate-900">Global Activity Log</CardTitle>
            <CardDescription className="text-slate-600">Real-time audit stream of all inventory actions across the enterprise.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/moves')} className="text-primary hover:text-primary hover:bg-primary/10">View Ledger</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200/40 hover:bg-transparent">
                <TableHead className="text-slate-700 font-bold">Type</TableHead>
                <TableHead className="text-slate-700 font-bold">Product</TableHead>
                <TableHead className="text-right text-slate-700 font-bold">Delta</TableHead>
                <TableHead className="text-slate-700 font-bold">From/To</TableHead>
                <TableHead className="text-slate-700 font-bold">Ref</TableHead>
                <TableHead className="text-right text-slate-700 font-bold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMoves?.length ? recentMoves.map((m) => (
                <TableRow key={m.id} className="group hover:bg-slate-100/40 border-slate-200/40 transition-colors duration-200">
                  <TableCell>
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-md",
                        m.move_type === 'receipt' ? "bg-green-500" :
                        m.move_type === 'delivery' ? "bg-red-500" : "bg-blue-500"
                    )} />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">{m.product_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{m.sku}</div>
                  </TableCell>
                  <TableCell className={cn(
                      "text-right font-mono font-bold text-base",
                      m.move_type === 'receipt' ? "text-green-600" : "text-red-600"
                  )}>
                    {m.move_type === 'receipt' ? '+' : '-'}{m.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {m.from_location ? <span className="text-slate-500">{m.from_location} → </span> : null}
                    <span className="font-medium text-slate-900">{m.to_location || m.from_location}</span>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-slate-500">{m.reference}</TableCell>
                  <TableCell className="text-right text-[11px] text-slate-500 whitespace-nowrap">{dayjs(m.created_at).fromNow()}</TableCell>
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
