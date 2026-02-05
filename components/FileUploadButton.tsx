'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Check, AlertCircle, Loader2, X, Download } from 'lucide-react';
import type { FileUploadStatus } from '@/lib/types';

interface FileUploadButtonProps {
  label: string;
  status: FileUploadStatus;
  onFileSelect: (file: File) => void;
  onDismissStatus?: () => void;
  onDownload?: () => void;
  accept?: string;
  disabled?: boolean;
  isLoading?: boolean;
  helperText?: string;
}

export function FileUploadButton({
  label,
  status,
  onFileSelect,
  onDismissStatus,
  onDownload,
  accept = '.csv',
  disabled = false,
  isLoading = false,
  helperText,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file extension if accept prop is provided
      if (accept) {
        const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedExtensions.includes(fileExtension)) {
          return; // Silently reject invalid file types
        }
      }
      onFileSelect(file);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (status.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (status.loaded) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Upload className="h-4 w-4" />;
  };

  const showStatusText = isLoading || status.error || status.loaded || helperText;

  return (
    <div
      className={`${showStatusText ? 'space-y-0.5' : ''} ${
        isDragOver ? 'ring-2 ring-primary ring-offset-1 rounded-md' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant={isDragOver ? 'outline' : status.loaded ? 'secondary' : 'default'}
        onClick={handleClick}
        disabled={disabled || isLoading}
        size="sm"
        className={`w-full justify-start h-8 text-xs transition-colors ${
          isDragOver ? 'border-primary bg-primary/10 border-dashed' : ''
        }`}
      >
        {getStatusIcon()}
        <span className="ml-1.5 truncate">{isDragOver ? 'Drop file here' : label}</span>
      </Button>
      {showStatusText && (
        <div
          className={`text-xs ${
            status.error
              ? 'text-red-500'
              : status.loaded
              ? 'text-green-600'
              : 'text-muted-foreground'
          }`}
        >
          <div className="flex items-start gap-1">
            <span className="break-words flex-1 leading-tight">
              {isLoading ? (
                'Loading...'
              ) : status.error ? (
                status.error
              ) : status.loaded ? (
                <span title={status.fileName}>{status.rowCount.toLocaleString()} rows</span>
              ) : (
                helperText
              )}
            </span>
            {!isLoading && status.loaded && onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="p-0.5 hover:bg-muted rounded shrink-0 opacity-60 hover:opacity-100"
                aria-label="Download CSV"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
            {!isLoading && (status.error || status.loaded) && onDismissStatus && (
              <button
                type="button"
                onClick={onDismissStatus}
                className="p-0.5 hover:bg-muted rounded shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
