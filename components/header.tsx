'use client';

import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export function Header({ 
  showBackButton = false,
  showSettingsButton = false, 
  title = "Timescript",
  subtitle,
  rightContent 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {rightContent}
            {showSettingsButton && (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}