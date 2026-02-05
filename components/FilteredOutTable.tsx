'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, X } from 'lucide-react';
import type { FilteredOutResult } from '@/lib/types';

interface FilteredOutTableProps {
  data: FilteredOutResult[];
  description?: string;
}

// Custom sort order for Would Recommend: Unpublish first, then Publish
const recommendationOrder: Record<string, number> = {
  'Unpublish': 0,
  'Publish': 1,
};

export function FilteredOutTable({ data, description }: FilteredOutTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'Would Recommend', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Extract unique values for each column
  const uniqueValues = useMemo(() => {
    const plus = [...new Set(data.map((r) => r.PLU))].sort();
    const descriptions = [...new Set(data.map((r) => r.Description).filter(Boolean))].sort();
    const sapStatuses = [...new Set(data.map((r) => r['SAP Status']).filter(Boolean))].sort();
    const published = ['Yes', 'No'];
    const inventoryPcts = [...new Set(data.map((r) => r['Inventory %']))].sort((a, b) => a - b);
    const channels = [...new Set(data.map((r) => r['Available In Channel']).filter(Boolean))].sort();
    const recommendations = ['Unpublish', 'Publish'];

    return {
      PLU: plus,
      Description: descriptions,
      'SAP Status': sapStatuses,
      Published: published,
      'Inventory %': inventoryPcts,
      'Available In Channel': channels,
      'Would Recommend': recommendations,
    };
  }, [data]);

  const columns: ColumnDef<FilteredOutResult>[] = useMemo(
    () => [
      {
        accessorKey: 'PLU',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              PLU
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center font-mono">{row.getValue('PLU')}</div>
        ),
      },
      {
        accessorKey: 'Description',
        header: () => <div className="text-left">Description</div>,
        cell: ({ row }) => (
          <div className="text-left min-w-[200px]">
            {row.getValue('Description') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'SAP Status',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              SAP Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('SAP Status')}</div>
        ),
      },
      {
        accessorKey: 'Published',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Published
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('Published') ? 'Yes' : 'No'}</div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as boolean;
          const displayValue = value ? 'Yes' : 'No';
          return displayValue === filterValue;
        },
      },
      {
        accessorKey: 'Inventory %',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Inventory %
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('Inventory %')}%</div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          return value === Number(filterValue);
        },
      },
      {
        accessorKey: 'Available In Channel',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Channel
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('Available In Channel') || '-'}</div>
        ),
      },
      {
        accessorKey: 'Would Recommend',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Would Recommend
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const recommendation = row.getValue('Would Recommend') as string;
          const variant = {
            Publish: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Unpublish: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          }[recommendation];

          return (
            <div className="text-center">
              <Badge variant="outline" className={variant}>
                {recommendation}
              </Badge>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('Would Recommend') as string;
          const b = rowB.getValue('Would Recommend') as string;
          return recommendationOrder[a] - recommendationOrder[b];
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasActiveFilters = columnFilters.length > 0;

  const getFilterValue = (columnId: string): string => {
    const filter = columnFilters.find((f) => f.id === columnId);
    return filter ? String(filter.value) : '';
  };

  const setFilterValue = (columnId: string, value: string) => {
    if (value === '__all__') {
      setColumnFilters((prev) => prev.filter((f) => f.id !== columnId));
    } else {
      setColumnFilters((prev) => {
        const existing = prev.filter((f) => f.id !== columnId);
        return [...existing, { id: columnId, value }];
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">PLU</label>
          <Select
            value={getFilterValue('PLU') || '__all__'}
            onValueChange={(value) => setFilterValue('PLU', value)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__all__">All ({uniqueValues.PLU.length})</SelectItem>
              {uniqueValues.PLU.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Description</label>
          <Select
            value={getFilterValue('Description') || '__all__'}
            onValueChange={(value) => setFilterValue('Description', value)}
          >
            <SelectTrigger className="h-8 w-48">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__all__">All ({uniqueValues.Description.length})</SelectItem>
              {uniqueValues.Description.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.length > 30 ? value.substring(0, 30) + '...' : value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">SAP Status</label>
          <Select
            value={getFilterValue('SAP Status') || '__all__'}
            onValueChange={(value) => setFilterValue('SAP Status', value)}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__all__">All ({uniqueValues['SAP Status'].length})</SelectItem>
              {uniqueValues['SAP Status'].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Published</label>
          <Select
            value={getFilterValue('Published') || '__all__'}
            onValueChange={(value) => setFilterValue('Published', value)}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {uniqueValues.Published.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Channel</label>
          <Select
            value={getFilterValue('Available In Channel') || '__all__'}
            onValueChange={(value) => setFilterValue('Available In Channel', value)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__all__">All ({uniqueValues['Available In Channel'].length})</SelectItem>
              {uniqueValues['Available In Channel'].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Would Recommend</label>
          <Select
            value={getFilterValue('Would Recommend') || '__all__'}
            onValueChange={(value) => setFilterValue('Would Recommend', value)}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {uniqueValues['Would Recommend'].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColumnFilters([])}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm font-semibold">{description}</p>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {table.getFilteredRowModel().rows.length.toLocaleString()} of {data.length.toLocaleString()} results
      </div>

      {/* Table */}
      <div className="rounded-md border max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
