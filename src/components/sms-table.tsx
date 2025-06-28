'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCell } from '@/components/message-cell';
import type { SmsRecord } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SmsTableProps {
  records: SmsRecord[];
  isLoading: boolean;
}

export function SmsTable({ records, isLoading }: SmsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <ScrollArea className="w-full" style={{ height: '400px' }}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <TableRow>
                <TableHead className="w-[200px]">App Name</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    No messages to display. Please validate your API key and set filters.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow key={`${record.dateTime}-${index}`}>
                    <TableCell className="font-medium whitespace-nowrap">{record.senderId}</TableCell>
                    <TableCell>
                      <MessageCell message={record.message} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </ScrollArea>
    </div>
  );
}
