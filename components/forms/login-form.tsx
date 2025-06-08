'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { encrypt, decrypt } from '@/lib/crypto';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await axios.post('/api/v1/login', {
        email: encrypt(data.email),
        password: encrypt(data.password),
      }, {
        headers: {
          'key': process.env.NEXT_PUBLIC_API_CLIENT_SECRET!
        }
      });

      if (response.data.success) {
        const token = decrypt(response.data.token) as { token: string };
        const user = decrypt(response.data.user);

        // Store token in localStorage
        localStorage.setItem('auth_token', token.token);
        localStorage.setItem('user', JSON.stringify(user));

        toast({
          title: "Success",
          description: "Login successful!",
        });
        
        router.push('/dashboard');
      } else {
        const errorMessage = decrypt(response.data.message) as string;
        toast({
          title: "Error",
          description: errorMessage || 'Login failed',
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const errorMessage = decrypt(error.response.data.message) as string;
        toast({
          title: "Error",
          description: errorMessage || 'Login failed',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: 'An error occurred. Please try again.',
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email or Username</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter your email or username"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
} 