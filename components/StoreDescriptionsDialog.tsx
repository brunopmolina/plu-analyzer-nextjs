'use client';

import { useState, useMemo } from 'react';
import { Building2, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { toast } from 'sonner';

export function StoreDescriptionsDialog() {
  const { state } = useAnalyzer();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get deduplicated active stores using the app's activeStores list (memoized)
  const activeStores = useMemo(() => {
    // state.activeStores contains the filtered list of active site numbers
    // (filtered by region, org, open/close dates, exclusions)
    const activeSet = new Set(state.activeStores);
    const storeMap = new Map<string, typeof state.plantData extends (infer T)[] | null ? T : never>();

    for (const plant of state.plantData || []) {
      // Only include stores that are in the active stores list
      if (!activeSet.has(plant.SITE_NUMBER)) continue;

      // Deduplicate by SITE_NUMBER - prefer one with description
      const existing = storeMap.get(plant.SITE_NUMBER);
      if (!existing || (!existing.SITE_DESCRIPTION && plant.SITE_DESCRIPTION)) {
        storeMap.set(plant.SITE_NUMBER, plant);
      }
    }

    return Array.from(storeMap.values()).sort((a, b) =>
      a.SITE_NUMBER.localeCompare(b.SITE_NUMBER)
    );
  }, [state.plantData, state.activeStores]);

  // Filter by search term (memoized)
  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return activeStores;

    const searchLower = searchTerm.toLowerCase().trim();
    return activeStores.filter((store) =>
      store.SITE_NUMBER.toLowerCase().includes(searchLower) ||
      (store.SITE_DESCRIPTION?.toLowerCase() || '').includes(searchLower) ||
      (store.REGION?.toLowerCase() || '').includes(searchLower)
    );
  }, [activeStores, searchTerm]);

  const handleExport = () => {
    if (filteredStores.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Store Number', 'Store Description', 'Region', 'Organization'];
    const rows = filteredStores.map((store) => [
      store.SITE_NUMBER,
      store.SITE_DESCRIPTION || '',
      store.REGION || '',
      store.ORGANIZATION_NUMBER || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `store_descriptions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export complete', {
      description: `${filteredStores.length} stores exported to CSV`,
    });
  };

  if (!state.plantStatus.loaded) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-8 text-xs whitespace-nowrap"
          title="View store descriptions"
        >
          <Building2 className="h-4 w-4" />
          <span className="ml-1.5">View Stores</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Store Descriptions
          </DialogTitle>
          <DialogDescription>
            {activeStores.length} active stores
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by store number, name, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Store #</th>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 font-medium">Region</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-muted-foreground">
                    {searchTerm ? 'No stores match your search' : 'No active stores found'}
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.SITE_NUMBER} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-2 font-mono">{store.SITE_NUMBER}</td>
                    <td className="p-2">{store.SITE_DESCRIPTION || <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-2 text-muted-foreground">{store.REGION}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {searchTerm && filteredStores.length !== activeStores.length && (
          <div className="text-xs text-muted-foreground pt-2">
            Showing {filteredStores.length} of {activeStores.length} stores
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
