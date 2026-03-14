import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Loader2, PackageSearch, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter the OTP');
    setLoading(true);
    try {
      await authAPI.verifyOTP({ email, otp });
      toast.success('OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) return toast.error('Password must be at least 8 chars');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword: password });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
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
          CoreInventory Operations
        </div>
      </div>
      <div className="p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'New Password'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 && 'Enter your email to receive a password reset OTP'}
              {step === 2 && `Enter the code sent to ${email}`}
              {step === 3 && 'Choose a strong new password'}
            </p>
          </div>

          <div className="grid gap-6">
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="otp">6-digit OTP</Label>
                    <Input id="otp" type="text" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="text-center tracking-[0.5em] text-lg font-mono" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Code'}
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setStep(1)} disabled={loading}>Change Email</Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newpw">New Password</Label>
                    <Input id="newpw" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link to="/login" className="underline underline-offset-4 hover:text-primary inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
