'use client';

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
import { ScrollArea } from './ui/scroll-area';

interface SmsTableProps {
  records: SmsRecord[];
  isLoading: boolean;
}

export function SmsTable({ records, isLoading }: SmsTableProps) {
  if (isLoading) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">SMS Conversations</CardTitle>
          <CardDescription>Loading conversations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="shadow-sm border">
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  const groupedRecords = records.reduce((acc, record) => {
    const key = record.bNumber || 'Unknown Number';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {} as Record<string, SmsRecord[]>);

  const phoneNumbers = Object.keys(groupedRecords);

  if (records.length > 0 && phoneNumbers.length === 0) {
    return (
      <Card className="mt-8 text-center shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">SMS Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-muted-foreground">
            Could not group messages by phone number.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (phoneNumbers.length === 0) {
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
        <CardTitle className="font-headline">SMS Conversations</CardTitle>
        <CardDescription>
          Messages are grouped by phone number and sorted chronologically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {phoneNumbers.map((bNumber) => {
          const messages = groupedRecords[bNumber].sort(
            (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          );
          const firstMessage = messages[0];
          if (!firstMessage) return null;

          return (
            <Card key={bNumber} className="shadow-sm border">
              <CardHeader>
                <CardTitle className="text-xl font-headline">
                  {firstMessage.senderId}
                </CardTitle>
                <CardDescription>To: {bNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 w-full pr-4">
                  <div className="space-y-4">
                    {messages.map((record, index) => (
                      <div
                        key={`${record.dateTime}-${index}`}
                        className="flex flex-col gap-1"
                      >
                        <div className="rounded-lg bg-muted/50 p-3 shadow-sm">
                          <MessageCell message={record.message} />
                        </div>
                        <p className="text-xs text-muted-foreground self-end">
                          {record.dateTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
