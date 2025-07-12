'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, Settings, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setShowDropdown(false);
  };

  if (!user) {
    // User not loaded yet
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Anonymous user or not logged in
    return (
      <>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => openAuthModal('login')}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button onClick={() => openAuthModal('register')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  // Authenticated user
  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2"
        >
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">{user.name || user.email}</span>
        </Button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown */}
            <Card className="absolute right-0 top-full mt-2 w-64 z-20">
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="px-2 py-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {!user.emailVerification && (
                      <p className="text-xs text-orange-600 mt-1">Email not verified</p>
                    )}
                  </div>

                  <Separator />

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowDropdown(false);
                        // Navigate to settings if needed
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </div>

                  <Separator />

                  {/* Logout */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}