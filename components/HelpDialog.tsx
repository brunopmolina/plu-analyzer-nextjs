'use client';

import { useState } from 'react';
import { HelpCircle, ArrowRight, CheckCircle2, XCircle, Upload, Database, FileSpreadsheet, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PUBLISH_THRESHOLD, UNPUBLISH_THRESHOLD, TEMP_PUBLISH_THRESHOLD, INACTIVE_STATUSES } from '@/lib/constants';

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">How it works</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How This Tool Works</DialogTitle>
          <DialogDescription>
            Analyze your product assortment to identify items that should be published or unpublished on the website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Workflow Section */}
          <section>
            <h3 className="font-semibold mb-3">Workflow</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Database className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-medium">1. Load Plant Data</span>
                  <p className="text-muted-foreground">Upload or auto-download the plant master file to identify active stores. This data persists across sessions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-medium">2. Upload Session Files</span>
                  <p className="text-muted-foreground">Upload CSVs manually or use the auto-download buttons to fetch Inventory &amp; Status from CommerceTools and Product data from Snowflake.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Play className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-medium">3. Run Analysis</span>
                  <p className="text-muted-foreground">The tool calculates inventory coverage per PLU and applies the business criteria below.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-medium">4. Review & Export</span>
                  <p className="text-muted-foreground">Filter results by recommendation type and export to CSV for action.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Business Criteria Section */}
          <section>
            <h3 className="font-semibold mb-3">Business Criteria</h3>
            <div className="space-y-4">
              {/* Publish Criteria */}
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">Recommend PUBLISH</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">All conditions must be met:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Item is <strong>NOT</strong> currently published</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>SAP Status is <strong>NOT</strong> {INACTIVE_STATUSES.join(' or ')}</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Inventory coverage is <strong>≥{PUBLISH_THRESHOLD}%</strong> of active stores</span>
                  </li>
                </ul>
              </div>

              {/* Publish - TEMP Criteria */}
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">Recommend PUBLISH - TEMP</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Temporary publish to sell through remaining stock. All conditions must be met:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Item is <strong>NOT</strong> currently published</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>SAP Status <strong>IS</strong> {INACTIVE_STATUSES.join(' or ')}</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Inventory coverage is <strong>≥{TEMP_PUBLISH_THRESHOLD}%</strong> of active stores</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">These items will naturally qualify for unpublish once inventory drops below the out-of-stock threshold.</p>
              </div>

              {/* Unpublish Criteria */}
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600 dark:text-red-400">Recommend UNPUBLISH</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">All conditions must be met:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Item <strong>IS</strong> currently published</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>SAP Status <strong>IS</strong> {INACTIVE_STATUSES.join(' or ')}</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-3 w-3 shrink-0 mt-1 text-muted-foreground" />
                    <span>Out-of-stock coverage is <strong>≥{UNPUBLISH_THRESHOLD}%</strong> of active stores</span>
                  </li>
                </ul>
              </div>

              {/* No Action */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">No Action</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Items that don&apos;t meet either set of criteria above require no change.
                </p>
              </div>
            </div>
          </section>

          {/* Key Thresholds */}
          <section>
            <h3 className="font-semibold mb-3">Current Thresholds</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{PUBLISH_THRESHOLD}%</div>
                <div className="text-muted-foreground">Inventory to publish</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{TEMP_PUBLISH_THRESHOLD}%</div>
                <div className="text-muted-foreground">Inventory to temp publish</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{UNPUBLISH_THRESHOLD}%</div>
                <div className="text-muted-foreground">Out-of-stock to unpublish</div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
