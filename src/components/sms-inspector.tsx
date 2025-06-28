'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, KeyRound, LoaderCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { fetchSmsData } from '@/app/actions';
import { SmsTable } from '@/components/sms-table';
import type { SmsRecord } from '@/lib/types';

const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

export function SmsInspector() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useLocalStorage('premiumy-api-key', '');
  const [records, setRecords] = useState<SmsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      senderId: 'Telegram',
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please enter your Premiumy API key before fetching data.',
      });
      return;
    }

    setIsLoading(true);
    setRecords([]);
    const result = await fetchSmsData(apiKey, values);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch data',
        description: result.error,
      });
    } else if (result.data) {
      setRecords(result.data);
      toast({
        title: 'Success!',
        description: `Fetched ${result.data.length} records.`,
      });
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">API Configuration & Filters</CardTitle>
          <CardDescription>
            Enter your API key and set filters to fetch SMS records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2 font-headline">
              <KeyRound className="h-4 w-4" /> Premiumy API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <Separator className="my-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-headline">Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-headline">End Date</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-headline">Sender ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Telegram" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-headline">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 23674400068" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Fetch SMS
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <SmsTable records={records} isLoading={isLoading} />
    </div>
  );
}
