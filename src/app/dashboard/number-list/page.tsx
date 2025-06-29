'use client';

import { useState, useEffect } from 'react';
import { getNumberList, addNumbersToList } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, Copy, Check, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';

export default function NumberListPage() {
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const [numbers, setNumbers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [bulkNumbers, setBulkNumbers] = useState('');


    useEffect(() => {
        // Refresh user data on component mount to ensure permissions are up-to-date
        refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


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
                toast({ title: 'Copied!' });
                setCopiedNumber(number);
                setTimeout(() => setCopiedNumber(null), 1000); // Reset icon after 1 second
            }).catch(err => {
                toast({ variant: 'destructive', title: 'Failed to copy' });
            });
        }
    };
    
    const handleAddNumbers = async () => {
        if (!bulkNumbers.trim()) return;
        setIsAdding(true);
        const result = await addNumbersToList(bulkNumbers.trim());
        setIsAdding(false);

        if (result.error) {
            toast({ variant: 'destructive', title: 'Failed to add numbers', description: result.error });
        } else if (result.success && result.newList) {
            toast({ title: 'Numbers Added!', description: `${result.addedCount} new numbers were added.` });
            setNumbers(result.newList);
            setBulkNumbers('');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Number List</h1>
                <p className="text-muted-foreground mt-1">
                    A list of available numbers. Click on a row to copy the number.
                </p>
            </header>

            {user?.canAddNumbers && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Add Numbers</CardTitle>
                        <CardDescription>Paste a list of numbers, one per line, to add them to the global list.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <Textarea
                                value={bulkNumbers}
                                onChange={(e) => setBulkNumbers(e.target.value)}
                                placeholder="Paste numbers here, one per line..."
                                disabled={isAdding}
                                className="h-40"
                            />
                            <Button onClick={handleAddNumbers} disabled={isAdding || !bulkNumbers.trim()} className="self-end">
                                {isAdding && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Add Numbers
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
