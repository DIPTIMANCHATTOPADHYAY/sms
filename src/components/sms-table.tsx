'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCell } from '@/components/message-cell';
import type { SmsRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SmsTableProps {
  records: SmsRecord[];
  isLoading: boolean;
}

const tableHeaders = [
  'Datetime', 'SenderID', 'B-Number', 'MCC/MNC', 'Destination', 'Rate', 'Message'
];

export function SmsTable({ records, isLoading }: SmsTableProps) {
  if (isLoading) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
           <CardTitle className="font-headline">SMS Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableHeaders.map((header) => <TableHead key={header}>{header}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {tableHeaders.map((header) => (
                      <TableCell key={header}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <p className="py-12 text-muted-foreground">No records found. Try adjusting your filters or fetch new data.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">SMS Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                {tableHeaders.map((header) => (
                    <TableHead key={header} className="font-headline text-foreground/80">{header}</TableHead>
                ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map((record, index) => (
                <TableRow key={`${record.dateTime}-${index}`}>
                    <TableCell>{record.dateTime}</TableCell>
                    <TableCell>{record.senderId}</TableCell>
                    <TableCell>{record.bNumber}</TableCell>
                    <TableCell>{record.mccMnc}</TableCell>
                    <TableCell>{record.destination}</TableCell>
                    <TableCell>{`${record.rate} ${record.currency}`}</TableCell>
                    <TableCell>
                      <MessageCell message={record.message} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
