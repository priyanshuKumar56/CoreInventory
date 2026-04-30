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
      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 group relative",
      isActive 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105" 
        : "text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 hover:scale-102"
    );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - Premium Navigation */}
      <aside className="hidden w-[260px] flex-col border-r border-slate-200/40 bg-gradient-to-b from-slate-50 to-slate-100/50 text-slate-600 md:flex lg:w-[280px]">
        <div className="flex h-16 items-center border-b border-slate-200/40 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <PackageOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CoreInventory</span>
          </div>
        </div>
          
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <nav className="space-y-6">
            <div>
              <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] letter-spacing-wider">Core Essentials</div>
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
              <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Operations</div>
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
              <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Catalogs</div>
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
                <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">System Control</div>
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

          <div className="p-4 border-t border-slate-200/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-200/60 transition-all outline-none group">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent border-2 border-white text-white font-bold text-sm shadow-lg shadow-primary/20">
                      {initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full shadow-md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{user?.role || 'User'}</p>
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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-4 lg:p-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
