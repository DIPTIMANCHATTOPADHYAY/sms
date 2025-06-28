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
      <ScrollArea className="w-full whitespace-nowrap" style={{ height: '400px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Sender ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead className="min-w-[300px]">Message</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No messages to display. Please validate your API key and set filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <TableRow key={`${record.dateTime}-${index}`}>
                  <TableCell>{record.dateTime}</TableCell>
                  <TableCell>{record.senderId}</TableCell>
                  <TableCell>{record.bNumber}</TableCell>
                  <TableCell className="whitespace-pre-wrap">
                    <MessageCell message={record.message} />
                  </TableCell>
                  <TableCell>
                    {/* Placeholder for Status */}
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
