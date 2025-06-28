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
      <ScrollArea className="h-[65vh] w-full">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <TableRow>
                <TableHead className="w-[180px]">Datetime</TableHead>
                <TableHead className="w-[150px]">Sender ID</TableHead>
                <TableHead className="w-[150px]">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Range</TableHead>
                <TableHead className="w-[120px]">Rate</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No messages to display. Please validate your API key and set filters.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow key={`${record.dateTime}-${index}`}>
                    <TableCell className="font-medium whitespace-nowrap">{record.dateTime}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.senderId}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{record.range}</TableCell>
                    <TableCell className="whitespace-nowrap">{`${record.rate} ${record.currency}`}</TableCell>
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
