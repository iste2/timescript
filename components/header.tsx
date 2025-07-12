'use client';

import { Button } from '@/components/ui/button';
import { Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  showSettingsButton?: boolean;
  currentPage?: string;
  rightContent?: React.ReactNode;
}

export function Header({ 
  showSettingsButton = false, 
  currentPage,
  rightContent 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Breadcrumb navigation */}
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" className="text-2xl font-bold text-primary p-0 h-auto hover:bg-transparent">
                Timescript
              </Button>
            </Link>
            {currentPage && (
              <>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-2xl font-bold text-primary">{currentPage}</h1>
              </>
            )}
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