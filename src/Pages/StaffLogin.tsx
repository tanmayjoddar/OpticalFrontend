import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from 'react-redux';
import { login } from '@/store/authSlice';
import type { AppDispatch } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
type LoginFormInputs = {
  email: string;
  password: string;
};
function StaffLogin() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, token, type } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();
  const onSubmit = (data: LoginFormInputs) => {
    dispatch(login({ ...data, type: 'staff' }));
  };
  useEffect(() => {
    if (token && type === 'staff') {
      navigate('/staff-dashboard', { replace: true });
    }
  }, [token, type, navigate]);
  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `url('/src/assets/gls.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <form
        className="relative w-full max-w-md mx-auto glass-card rounded-2xl p-8 space-y-6 top-1/2 -translate-y-1/2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-2xl font-bold text-center mb-2 text-brand-gradient">Sign In</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
  <Button type="submit" className="w-full clay-button" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
export default StaffLogin;
