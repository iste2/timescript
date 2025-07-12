'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogIn, UserPlus, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'magic-link'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register, loginWithMagicLink, createAnonymousSession } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
        resetForm();
      } else if (mode === 'register') {
        await register(email, password, name);
        onClose();
        resetForm();
      } else if (mode === 'magic-link') {
        const url = `${window.location.origin}/auth/magic-link`;
        await loginWithMagicLink(email, url);
        setSuccess('Magic link sent! Check your email and click the link to log in.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await createAnonymousSession();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create anonymous session');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register' | 'magic-link') => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {mode === 'login' && <LogIn className="w-5 h-5" />}
            {mode === 'register' && <UserPlus className="w-5 h-5" />}
            {mode === 'magic-link' && <Mail className="w-5 h-5" />}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'magic-link' && 'Magic Link'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Sign in to your Timescript account'}
            {mode === 'register' && 'Create a new account to get started'}
            {mode === 'magic-link' && 'We\'ll send you a secure login link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            {mode !== 'magic-link' && (
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'magic-link' && 'Send Magic Link'}
            </Button>
          </form>

          <div className="space-y-3">
            <Separator />
            
            {mode !== 'magic-link' && (
              <Button
                variant="outline"
                onClick={() => switchMode('magic-link')}
                className="w-full"
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Use Magic Link Instead
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleAnonymousLogin}
              className="w-full"
              disabled={loading}
            >
              Continue as Guest
            </Button>

            <Separator />

            <div className="text-center space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-sm text-primary hover:underline"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              
              {(mode === 'register' || mode === 'magic-link') && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}