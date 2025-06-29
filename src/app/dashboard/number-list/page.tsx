import { getNumberList } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List } from "lucide-react";

export default async function NumberListPage() {
    const numbers = await getNumberList();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Number List</h1>
                <p className="text-muted-foreground mt-1">
                    A list of numbers provided by the administrator.
                </p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="h-6 w-6" />
                        Available Numbers
                    </CardTitle>
                    <CardDescription>
                        {numbers.length > 0
                            ? `Showing ${numbers.length} available numbers.`
                            : "There are no numbers available at this time."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-4">
                            {numbers.length > 0 ? (
                                <ul className="space-y-3">
                                    {numbers.map((number, index) => (
                                        <li key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                            <span className="font-mono text-sm">{number}</span>
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
