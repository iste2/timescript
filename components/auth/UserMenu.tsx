'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, Settings, LogIn, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/lib/server/auth-actions';
import { DeleteAccountDialog } from './delete-account-dialog';

interface UserMenuProps {
  user?: {
    $id: string;
    name: string;
    email: string;
    emailVerification: boolean;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // If no user is passed, show login/register buttons
  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/login">
          <Button variant="outline">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  // Authenticated user
  return (
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
            <CardContent className="">
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
                  <Link href="/settings">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setShowDeleteDialog(true);
                      setShowDropdown(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>

                <Separator />

                {/* Logout */}
                <form action={signOut}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        userEmail={user.email}
      />
    </div>
  );
}