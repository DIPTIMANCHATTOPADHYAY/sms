'use client';

import { useState, Fragment } from 'react';
import { Wand2, LoaderCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeMessage } from '@/app/actions';
import type { ExtractedInfo } from '@/lib/types';

interface MessageCellProps {
  message: string;
}

// This function now only highlights links. The confirmation code is handled separately.
const renderAnalyzedMessage = (message: string, analysis: ExtractedInfo) => {
  if (!analysis.link) {
    return message;
  }

  const parts = message.split(analysis.link);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <a href={analysis.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {analysis.link}
            </a>
          )}
        </Fragment>
      ))}
    </>
  );
};


export function MessageCell({ message }: MessageCellProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtractedInfo | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeMessage(message);
    setIsAnalyzing(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error,
      });
    } else if (result.data) {
       if (result.data.confirmationCode || result.data.link) {
        setAnalysisResult(result.data);
        toast({
          title: 'Analysis Complete',
        });
      } else {
        toast({
          title: 'Nothing to Extract',
          description: 'No codes or links were found in this message.',
        });
      }
    }
  };

  const handleCopyCode = (code: string) => {
    if (!navigator.clipboard) {
      toast({ variant: 'destructive', title: 'Copy not supported' });
      return;
    }
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: 'Code Copied!' });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      toast({ variant: 'destructive', title: 'Failed to copy' });
    });
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-grow space-y-2 py-1">
        <p className="whitespace-pre-wrap">
          {analysisResult ? renderAnalyzedMessage(message, analysisResult) : message}
        </p>
        {analysisResult?.confirmationCode && (
          <div 
            onClick={() => handleCopyCode(analysisResult.confirmationCode!)}
            className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
          >
            <span className="font-mono text-sm font-bold">{analysisResult.confirmationCode}</span>
            <span className="text-primary/80">
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </span>
          </div>
        )}
      </div>
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
