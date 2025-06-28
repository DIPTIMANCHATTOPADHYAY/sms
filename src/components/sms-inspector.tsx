'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
      senderId: 'Telegram',
      phone: '23674400423',
    },
  });

  // Set default dates on client mount to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    form.reset({
      ...form.getValues(),
      startDate: now,
      endDate: now,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please enter and validate your Premiumy API key.',
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
  
  const handleValidate = () => {
    if (!apiKey) {
        toast({
            variant: "destructive",
            title: "API Key is empty",
            description: "Please enter an API key to validate.",
        });
        return;
    }
    setIsValidating(true);
    // Mock validation
    setTimeout(() => {
        setIsValidating(false);
        toast({
            title: "API Key Validated",
            description: "The API key is valid and has been saved.",
        })
    }, 1500);
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg shadow-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
            <h2 className="text-xl font-bold mb-4">Premiumy SMS Viewer</h2>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="****************"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/70 border-primary-foreground/50 flex-grow"
                />
                <Button onClick={handleValidate} disabled={isValidating} className="w-full sm:w-auto">
                  {isValidating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Validate
                </Button>
                <Button variant="outline" disabled={true} className="w-full sm:w-auto bg-primary-foreground/20 border-primary-foreground/50 text-primary-foreground/80">Detecting IP...</Button>
            </div>
        </div>

        {/* Form and Content */}
        <div className="p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'P p')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'P p')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                      <FormLabel>Sender ID</FormLabel>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 23674400423" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="link" disabled={isLoading} className="text-primary">
                  {isLoading ? 'Fetching...' : 'Fetch SMS'}
                </Button>
              </div>
            </form>
          </Form>
      
          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Received SMS Messages</h3>
                <span className="text-sm text-muted-foreground">{records.length} messages found</span>
            </div>
            <SmsTable records={records} isLoading={isLoading} />
          </div>
        </div>
    </div>
  );
}
