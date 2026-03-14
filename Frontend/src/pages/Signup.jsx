import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signupUser } from '@/store/authSlice';
import { Loader2, PackageSearch } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Needs an uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Needs a lowercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Needs a special character';
    return null;
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    const pwdErr = validatePassword(form.password);
    if (pwdErr) e.password = pwdErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(signupUser(form)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <PackageSearch className="mr-2 h-6 w-6" />
          CoreInventory
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Create an account to digitize and streamline all stock-related operations within a business."
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">Enter your details below to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name" placeholder="John Doe"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email" type="email" placeholder="name@company.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={errors.password ? 'border-destructive' : ''}
                />
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${form.password ? (i <= (form.password.length > 8 ? 4 : form.password.length / 2) ? 'bg-primary' : 'bg-muted') : 'bg-muted'}`} />
                  ))}
                </div>
                {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : <p className="text-xs text-muted-foreground">Must be at least 8 characters with upper, lower, and special chars.</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
              </Button>
            </div>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="underline underline-offset-4 hover:text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
