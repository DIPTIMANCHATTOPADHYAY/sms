'use client';

import { useState, useEffect } from 'react';
import { getNumberList } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, Copy, Check, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

export default function NumberListPage() {
    const { toast } = useToast();
    const [numbers, setNumbers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

    useEffect(() => {
        async function loadNumbers() {
            setIsLoading(true);
            const numberList = await getNumberList();
            setNumbers(numberList);
            setIsLoading(false);
        }
        loadNumbers();
    }, []);

    const handleCopy = (number: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(number).then(() => {
                toast({ title: 'Number Copied!' });
                setCopiedNumber(number);
                setTimeout(() => setCopiedNumber(null), 2000); // Reset icon after 2 seconds
            }).catch(err => {
                toast({ variant: 'destructive', title: 'Failed to copy' });
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Number List</h1>
                <p className="text-muted-foreground mt-1">
                    A list of numbers provided by the administrator. Click on a row to copy the number.
                </p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="h-6 w-6" />
                        Available Numbers
                    </CardTitle>
                    <CardDescription>
                        {isLoading
                            ? 'Loading numbers...'
                            : numbers.length > 0
                                ? `Showing ${numbers.length} available numbers.`
                                : "There are no numbers available at this time."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full py-10">
                                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : numbers.length > 0 ? (
                                <ul className="space-y-3">
                                    {numbers.map((number, index) => (
                                        <li 
                                            key={index} 
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-md cursor-pointer transition-colors hover:bg-muted"
                                            onClick={() => handleCopy(number)}
                                        >
                                            <span className="font-mono text-sm">{number}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground pointer-events-none">
                                                {copiedNumber === number ? (
                                                    <Check className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center justify-center h-full py-10 text-muted-foreground">
                                    <p>The list is currently empty.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
