import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '@/store/authSlice';
import { Loader2, PackageSearch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(loginUser({ email: form.email, password: form.password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-gradient-to-br from-white to-slate-100">
      <div className="relative hidden h-full flex-col bg-gradient-to-br from-primary via-blue-600 to-primary/80 p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c83114?w=1920&h=1080&fit=crop&crop=entropy&auto=format" 
            alt="Warehouse inventory management" 
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-blue-600/90 to-primary/85" />
        <div className="relative z-20 flex items-center text-lg font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 mr-3 backdrop-blur-sm">
            <PackageSearch className="h-6 w-6" />
          </div>
          CoreInventory
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-xl font-light leading-relaxed">
              &quot;Replace manual registers, Excel sheets, and scattered tracking methods with a centralized, real-time app.&quot;
            </p>
            <p className="text-sm text-white/60 font-medium">Enterprise Inventory Management</p>
          </blockquote>
        </div>
      </div>
      <div className="p-8 flex items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[380px]">
          <div className="flex flex-col space-y-3 text-center">
            <div className="mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg shadow-primary/30">
              <PackageSearch className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-600 font-medium">Sign in to access your inventory dashboard</p>
          </div>

          <Card className="border border-slate-200/40 bg-white shadow-2xl shadow-black/5">
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-5">
                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
                    <Input
                      id="email" type="email" placeholder="name@company.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`h-11 rounded-lg border-slate-200/60 bg-slate-50/50 focus-visible:ring-primary/50 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-sm text-destructive font-medium">{errors.email}</p>}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                    <Input
                      id="password" type="password" placeholder="••••••••"
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`h-11 rounded-lg border-slate-200/60 bg-slate-50/50 focus-visible:ring-primary/50 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && <p className="text-sm text-destructive font-medium">{errors.password}</p>}
                  </div>
                  <Button type="submit" disabled={loading} className="w-full mt-4 h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-300">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-600">
            Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:text-primary/80 transition-colors">Sign up</Link>
            <br />
            <Link to="/forgot-password" className="text-slate-500 hover:text-primary transition-colors text-xs font-medium">Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
