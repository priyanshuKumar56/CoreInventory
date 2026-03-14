import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/authSlice';
import { usersAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Loader2, Mail, User, Shield, KeyRound, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function Profile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await usersAPI.updateProfile({ name: form.name, email: form.email });
      dispatch(updateUser(data.data));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (form.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }
    
    setLoading(true);
    try {
      await usersAPI.updateProfile({ 
        currentPassword: form.currentPassword,
        newPassword: form.newPassword 
      });
      toast.success('Password updated successfully');
      setForm({ ...form, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and security</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/3 h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-3xl font-bold">{initials}</span>
            </div>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription>{user?.role}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm mt-4">
              <div className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-3" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Shield className="w-4 h-4 mr-3" />
                <span className="capitalize">{user?.role} Access Status</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic account details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-2 mb-4">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
                </div>
                <Separator className="my-4" />
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                </div>
                <Button type="submit" variant="secondary" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
