
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileQuestion, Sparkles, Download, Newspaper, Network, ClipboardList } from 'lucide-react';
import { BookCourseSelector } from '@/components/common/book-course-selector';
import { generateQuiz } from '@/ai/flows/generate-quiz';
import { useToast } from "@/hooks/use-toast";
import { useAIProgress } from "@/hooks/use-ai-progress";
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function CuestionarioPage() {
  const { translate, language: currentUiLanguage } = useLanguage();
  const { toast } = useToast();
  const { progress, progressText, isLoading, startProgress, stopProgress } = useAIProgress();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [topic, setTopic] = useState('');
  const [quizResult, setQuizResult] = useState('');
  const [currentTopicForDisplay, setCurrentTopicForDisplay] = useState('');

  const handleGenerateQuiz = async () => {
    if (!selectedBook) {
      toast({ title: translate('errorGenerating'), description: translate('noBookSelected'), variant: 'destructive'});
      return;
    }
    const currentTopic = topic.trim();
    if (!currentTopic) {
      toast({ title: translate('errorGenerating'), description: translate('noTopicProvided'), variant: 'destructive'});
      return;
    }
    
    setQuizResult('');
    setCurrentTopicForDisplay(currentTopic);
    
    // Start progress simulation
    const progressInterval = startProgress('quiz', 7000);
    
    try {
      const result = await generateQuiz({
        bookTitle: selectedBook,
        topic: currentTopic,
        courseName: selectedCourse || "General", 
        language: currentUiLanguage,
      });
      setQuizResult(result.quiz);
      
      // Show success notification
      toast({ 
        title: translate('quizGeneratedTitle'), 
        description: translate('quizGeneratedDesc'),
        variant: 'default'
      });
      
      const currentCount = parseInt(localStorage.getItem('quizzesCreatedCount') || '0', 10);
      localStorage.setItem('quizzesCreatedCount', (currentCount + 1).toString());
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({ title: translate('errorGenerating'), description: (error as Error).message, variant: 'destructive'});
      setQuizResult(`<p class="text-destructive">${translate('errorGenerating')}</p>`);
    } finally {
      stopProgress(progressInterval);
    }
  };

  const handleDownloadQuizPdf = () => {
    if (!quizResult || !currentTopicForDisplay) return;

    const titlePrefix = currentUiLanguage === 'es' ? translate('quizTitlePrefix', {defaultValue: 'CUESTIONARIO'}) : translate('quizTitlePrefix', {defaultValue: 'QUIZ'});
    const title = `${titlePrefix} - ${currentTopicForDisplay.toUpperCase()}`;
    
    const contentHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
            body { font-family: 'Space Grotesk', sans-serif; margin: 25px; line-height: 1.8; }
            h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
            h2 { font-size: 1.6em; text-align: center; margin-bottom: 2em; font-weight: 700; } /* Quiz title */
            p { margin-bottom: 1.2em; }
            strong { font-weight: 600; }
            hr { margin-top: 1.5rem; margin-bottom: 1.5rem; border: 0; border-top: 2px solid #e5e7eb; }
            .prose { font-size: 14px; } /* Mimic prose styles */
            .question-block { margin-bottom: 2.5em; }
            .answer-space { margin-top: 1em; }
          </style>
        </head>
        <body>
          ${quizResult}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(contentHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
      }, 500); 
    } else {
       toast({
        title: translate('errorGenerating'),
        description: translate('pdfDownloadErrorPopupBlocked'),
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="flex flex-col items-center text-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="items-center">
          <FileQuestion className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mb-3" />
          <CardTitle className="text-3xl font-bold font-headline">{translate('quizPageTitle')}</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground max-w-2xl">
            {translate('quizPageSub')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <BookCourseSelector
            selectedCourse={selectedCourse}
            selectedBook={selectedBook}
            onCourseChange={setSelectedCourse}
            onBookChange={setSelectedBook}
          />
          <div className="space-y-2">
            <Label htmlFor="quiz-topic-input" className="text-left block">{translate('quizTopicPlaceholder')}</Label>
            <Textarea
              id="quiz-topic-input"
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={translate('quizTopicPlaceholder')}
              className="text-base md:text-sm"
            />
          </div>
          <Button
            onClick={handleGenerateQuiz}
            disabled={isLoading}
            className={cn(
              "w-full font-semibold py-3 text-base md:text-sm home-card-button-cyan",
              "hover:brightness-110 hover:shadow-lg hover:scale-105 transition-all duration-200"
            )}
          >
            {isLoading ? (
              <>{translate('loading')} {progress}%</>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {translate('quizGenerateBtn')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {quizResult && !isLoading && (
        <Card className="mt-6 w-full max-w-lg text-left shadow-md">
          <CardContent className="pt-6">
            <div 
              dangerouslySetInnerHTML={{ __html: quizResult }} 
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed quiz-content" 
            />
            
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={handleDownloadQuizPdf}
                className="font-semibold py-2 px-6 rounded-lg transition-colors home-card-button-cyan text-xs sm:text-sm"
              >
                <Download className="mr-2 h-4 w-4" /> {translate('quizActionDownloadPdf')}
              </Button>
              <Button asChild className="font-semibold py-2 px-6 rounded-lg transition-colors home-card-button-blue text-xs sm:text-sm">
                <Link href="/dashboard/resumen">
                  <Newspaper className="mr-2 h-4 w-4" /> {translate('quizActionCreateSummary')}
                </Link>
              </Button>
              <Button asChild className="font-semibold py-2 px-6 rounded-lg transition-colors home-card-button-yellow text-xs sm:text-sm">
                <Link href="/dashboard/mapa-mental">
                  <Network className="mr-2 h-4 w-4" /> {translate('quizActionCreateMap')}
                </Link>
              </Button>
              <Button asChild className="font-semibold py-2 px-6 rounded-lg transition-colors home-card-button-purple text-xs sm:text-sm">
                <Link href="/dashboard/evaluacion">
                  <ClipboardList className="mr-2 h-4 w-4" /> {translate('quizActionCreateEval')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
