import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@/store/authSlice';
import {
  LayoutDashboard, Truck, PackageOpen, Clock, Settings,
  LogOut, UserCircle, FileText, ArrowLeftRight, Settings2,
  Package, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Layout() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const navItemClass = ({ isActive }) =>
    cn(
      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 group relative",
      isActive 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-[260px] flex-col border-r bg-[#0f172a] text-slate-300 md:flex lg:w-[280px]">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <PackageOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CoreInventory</span>
          </div>
        </div>
          
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <nav className="space-y-6">
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Core Essentials</div>
              <div className="space-y-1">
                <NavLink to="/dashboard" className={navItemClass}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </NavLink>
                <NavLink to="/stock" className={navItemClass}>
                  <Package className="h-4 w-4" /> Stock Overview
                </NavLink>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operations</div>
              <div className="space-y-1">
                <NavLink to="/receipts" className={navItemClass}>
                  <FileText className="h-4 w-4" /> Receipts
                </NavLink>
                <NavLink to="/deliveries" className={navItemClass}>
                  <Truck className="h-4 w-4" /> Deliveries
                </NavLink>
                <NavLink to="/transfers" className={navItemClass}>
                  <ArrowLeftRight className="h-4 w-4" /> Internal Transfers
                </NavLink>
                <NavLink to="/adjustments" className={navItemClass}>
                  <Settings2 className="h-4 w-4" /> Adjustments
                </NavLink>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Catalogs</div>
              <div className="space-y-1">
                <NavLink to="/products" className={navItemClass}>
                  <PackageOpen className="h-4 w-4" /> Products
                </NavLink>
                <NavLink to="/moves" className={navItemClass}>
                  <Clock className="h-4 w-4" /> Ledger history
                </NavLink>
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">System Control</div>
                <div className="space-y-1">
                  <NavLink to="/users" className={navItemClass}>
                    <UserCircle className="h-4 w-4" /> User Base
                  </NavLink>
                  <NavLink to="/settings" className={navItemClass}>
                    <Settings className="h-4 w-4" /> Global Settings
                  </NavLink>
                </div>
              </div>
            )}
          </nav>
        </div>

          <div className="p-4 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800/50 transition-all outline-none group">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-[#0f172a] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{user?.role || 'User'}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] mb-2">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

      <div className="flex flex-1 flex-col relative">
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 lg:p-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
