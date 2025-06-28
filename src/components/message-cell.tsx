'use client';

import { useState } from 'react';
import { Wand2, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeMessage } from '@/app/actions';
import type { ExtractedInfo } from '@/lib/types';

interface MessageCellProps {
  message: string;
}

const renderAnalyzedMessage = (message: string, analysis: ExtractedInfo) => {
  let result: (string | JSX.Element)[] = [message];
  let lastIndex = 0;

  const processPart = (part: string | JSX.Element, term: string | undefined, className: string, isLink: boolean) => {
    if (!term || typeof part !== 'string') return [part];
    
    const split = part.split(term);
    const newResult: (string | JSX.Element)[] = [];
    
    split.forEach((str, i) => {
      if (str) newResult.push(str);
      if (i < split.length - 1) {
        lastIndex++;
        newResult.push(
          isLink ? (
            <a key={`${term}-${lastIndex}`} href={term} target="_blank" rel="noopener noreferrer" className={className}>
              {term}
            </a>
          ) : (
            <strong key={`${term}-${lastIndex}`} className={className}>
              {term}
            </strong>
          )
        );
      }
    });
    return newResult;
  };

  if (analysis.link) {
    result = processPart(result[0], analysis.link, 'text-accent-foreground/80 bg-accent/30 hover:bg-accent/50 rounded-sm px-1 underline underline-offset-2', true);
  }
  if (analysis.confirmationCode) {
    const tempResult: (string | JSX.Element)[] = [];
    result.forEach(part => {
      tempResult.push(...processPart(part, analysis.confirmationCode, 'text-primary bg-primary/20 rounded-sm px-1 font-bold', false));
    });
    result = tempResult;
  }
  
  return result;
};


export function MessageCell({ message }: MessageCellProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtractedInfo | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeMessage(message);
    setIsAnalyzing(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error,
      });
    } else if (result.data) {
      setAnalysisResult(result.data);
       toast({
        title: 'Analysis Complete',
        description: 'Key information has been extracted.',
      });
    }
  };

  return (
    <div className="flex items-start justify-between gap-2">
      <p className="whitespace-pre-wrap flex-grow py-1">
        {analysisResult ? renderAnalyzedMessage(message, analysisResult) : message}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent/20 hover:text-accent"
        aria-label="Analyze message"
      >
        {isAnalyzing ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
