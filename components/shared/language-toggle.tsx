'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { setLanguage } from '@/actions/settings/language';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const isArabic = currentLocale === 'ar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 w-10 h-10 rounded-full hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors" title="Switch language" data-testid="language-settings">
        <Languages className="w-5 h-5" />
        <span className="sr-only">Switch language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')} 
          className={!isArabic ? 'bg-accent' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')}
          className={isArabic ? 'bg-accent font-medium' : 'font-medium'}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
