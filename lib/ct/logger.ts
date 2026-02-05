// Subrequest tracking for Cloudflare Workers limit monitoring
// Cloudflare free tier limits: 50 subrequests per invocation

export interface SubrequestLog {
  module: string;
  operation: string;
  count: number;
  timestamp: number;
}

class SubrequestLogger {
  private logs: SubrequestLog[] = [];
  private totalCount = 0;

  log(module: string, operation: string, count = 1): void {
    this.logs.push({
      module,
      operation,
      count,
      timestamp: Date.now(),
    });
    this.totalCount += count;
    console.log(`[Subrequest] ${module}:${operation} (+${count}) | Total: ${this.totalCount}`);
  }

  getTotal(): number {
    return this.totalCount;
  }

  getLogs(): SubrequestLog[] {
    return [...this.logs];
  }

  getSummary(): { total: number; byModule: Record<string, number> } {
    const byModule: Record<string, number> = {};
    for (const log of this.logs) {
      byModule[log.module] = (byModule[log.module] || 0) + log.count;
    }
    return {
      total: this.totalCount,
      byModule,
    };
  }

  reset(): void {
    this.logs = [];
    this.totalCount = 0;
  }
}

// Singleton instance for tracking subrequests within a single request invocation
export const subrequestLogger = new SubrequestLogger();
