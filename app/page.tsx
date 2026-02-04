'use client';

import { PlantDataSection } from '@/components/sections/PlantDataSection';
import { SessionFilesSection } from '@/components/sections/SessionFilesSection';
import { MobileFilesSection } from '@/components/sections/MobileFilesSection';
import { AnalysisSection } from '@/components/sections/AnalysisSection';
import { ResultsSection } from '@/components/sections/ResultsSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HelpDialog } from '@/components/HelpDialog';
import { LogoutButton } from '@/components/LogoutButton';
import { Package } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="w-full max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-6 w-6 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold leading-tight">Website Assortment Audit Tool</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  See items that should be Published or Unpublished based on pre-set Business criteria
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <HelpDialog />
              <LogoutButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-screen-2xl mx-auto px-4 py-4 flex-1">
        <div className="space-y-4">
          {/* Mobile: Combined files card */}
          <MobileFilesSection />

          {/* Desktop: File uploads row - Plant on left, Session files + Run on right */}
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <PlantDataSection />
            <div className="space-y-3">
              <SessionFilesSection />
              <AnalysisSection />
            </div>
          </div>
          <ResultsSection />
        </div>
      </main>

      <footer className="border-t">
        <div className="w-full max-w-screen-2xl mx-auto px-4 py-2 text-center text-xs text-muted-foreground">
          Wild Fork Foods
        </div>
      </footer>
    </div>
  );
}
