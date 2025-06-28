'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">SMS Records</CardTitle>
          <CardDescription>Loading records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="space-y-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="mt-8 text-center shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">SMS Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-muted-foreground">
            No records found. Try adjusting your filters or fetch new data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">SMS Records</CardTitle>
        <CardDescription>
          A list of your SMS records based on the filters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <ScrollArea className="h-[60vh] w-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[180px]">Datetime</TableHead>
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="min-w-[300px]">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={`${record.dateTime}-${index}`}>
                    <TableCell className="font-medium">
                      {record.dateTime}
                    </TableCell>
                    <TableCell>{record.senderId}</TableCell>
                    <TableCell>{record.bNumber}</TableCell>
                    <TableCell>{record.destination}</TableCell>
                    <TableCell>{`${record.rate} ${record.currency}`}</TableCell>
                    <TableCell>
                      <MessageCell message={record.message} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
