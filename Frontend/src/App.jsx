import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Receipts from '@/pages/Receipts';
import ReceiptDetail from '@/pages/ReceiptDetail';
import ReceiptForm from '@/pages/ReceiptForm';
import Deliveries from '@/pages/Deliveries';
import DeliveryDetail from '@/pages/DeliveryDetail';
import DeliveryForm from '@/pages/DeliveryForm';
import Transfers from '@/pages/Transfers';
import TransferDetail from '@/pages/TransferDetail';
import TransferForm from '@/pages/TransferForm';
import Adjustments from '@/pages/Adjustments';
import AdjustmentForm from '@/pages/AdjustmentForm';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import ProductForm from '@/pages/ProductForm';
import StockOverview from '@/pages/StockOverview';
import MoveHistory from '@/pages/MoveHistory';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Users from '@/pages/Users';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="receipts" element={<Receipts />} />
        <Route path="receipts/new" element={<ReceiptForm />} />
        <Route path="receipts/:id" element={<ReceiptDetail />} />
        <Route path="receipts/:id/edit" element={<ReceiptForm />} />

        <Route path="deliveries" element={<Deliveries />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="deliveries/:id/edit" element={<DeliveryForm />} />

        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/new" element={<TransferForm />} />
        <Route path="transfers/:id" element={<TransferDetail />} />

        <Route path="adjustments" element={<Adjustments />} />
        <Route path="adjustments/new" element={<AdjustmentForm />} />

        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductForm />} />

        <Route path="stock" element={<StockOverview />} />
        <Route path="moves" element={<MoveHistory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
