'use client';

import { Button } from '@/components/ui/button';
import { Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { TimescriptIcon } from '@/components/timescript-icon';
import { UserMenu } from '@/components/auth/UserMenu';

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
    <header className="bg-transparent">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Breadcrumb navigation */}
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" className="text-lg h-auto flex items-center">
                <TimescriptIcon className="text-primary" width={32} height={32} />
                <span>Timescript</span>
              </Button>
            </Link>
            {currentPage && (
              <>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-lg font-bold">{currentPage}</h1>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {rightContent}
            {showSettingsButton && (
              <Link href="/settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}