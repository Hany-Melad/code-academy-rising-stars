import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Quiz = Tables<'quizzes'>;
type QuizResult = Tables<'quiz_results'>;

interface QuizViewerProps {
  sessionId: string;
}

interface QuizAnswer {
  quizId: string;
  answer: string;
}

export function QuizViewer({ sessionId }: QuizViewerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzesAndResults();
  }, [sessionId, profile]);

  const fetchQuizzesAndResults = async () => {
    if (!profile) return;

    try {
      // Fetch quizzes for this session
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      // Fetch existing quiz results
      const { data: resultsData, error: resultsError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('student_id', profile.id)
        .in('quiz_id', (quizzesData || []).map(q => q.id));

      if (resultsError) throw resultsError;
      setResults(resultsData || []);
      setSubmitted((resultsData || []).length > 0);

      // Initialize answers for unanswered quizzes
      if ((resultsData || []).length === 0) {
        setAnswers((quizzesData || []).map(quiz => ({
          quizId: quiz.id,
          answer: ''
        })));
      }

    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (quizId: string, answer: string) => {
    setAnswers(prev => prev.map(a => 
      a.quizId === quizId ? { ...a, answer } : a
    ));
  };

  const handleSubmitQuizzes = async () => {
    if (!profile || submitting) return;

    // Validate all questions are answered
    const unansweredQuizzes = answers.filter(a => !a.answer.trim());
    if (unansweredQuizzes.length > 0) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const results = answers.map(answer => {
        const quiz = quizzes.find(q => q.id === answer.quizId);
        if (!quiz) return null;

        const isCorrect = quiz.question_type === 'writing' 
          ? true // Writing questions are manually graded
          : answer.answer.toLowerCase() === quiz.correct_answer.toLowerCase();

        return {
          student_id: profile.id,
          quiz_id: quiz.id,
          is_correct: isCorrect,
          written_answer: quiz.question_type === 'writing' ? answer.answer : null,
          answered_at: new Date().toISOString()
        };
      }).filter(Boolean);

      const { error } = await supabase
        .from('quiz_results')
        .insert(results);

      if (error) throw error;

      const correctAnswers = results.filter(r => r?.is_correct).length;
      const totalPoints = correctAnswers * 2; // Each question is worth 2 points

      // Get current points first, then add the new points
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', profile.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      const newTotalPoints = (currentProfile.total_points || 0) + totalPoints;

      // Update student's total points by adding new points to existing total
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          total_points: newTotalPoints
        })
        .eq('id', profile.id);

      if (pointsError) throw pointsError;

      toast({
        title: "Quiz Submitted!",
        description: `You earned ${totalPoints} points! (${correctAnswers}/${quizzes.length} correct)`,
      });

      fetchQuizzesAndResults();

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <h4 className="font-medium text-gray-900 mb-1">No quizzes available</h4>
          <p className="text-gray-600">The instructor hasn't added any quizzes for this session yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Session Quiz</h3>
        {submitted && (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {quizzes.map((quiz, index) => {
          const result = results.find(r => r.quiz_id === quiz.id);
          const currentAnswer = answers.find(a => a.quizId === quiz.id);

          return (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {quiz.question_type === 'true_false' ? 'True/False' : 
                       quiz.question_type === 'multiple_choice' ? 'Multiple Choice' : 
                       'Writing'}
                    </Badge>
                    <Badge variant="secondary">{quiz.points} pts</Badge>
                    {result && (
                      result.is_correct ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{quiz.question}</p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="space-y-2">
                    <p><strong>Your answer:</strong> {result?.written_answer || result?.is_correct ? 'Correct' : 'Incorrect'}</p>
                    {quiz.question_type !== 'writing' && (
                      <p><strong>Correct answer:</strong> {quiz.correct_answer}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quiz.question_type === 'true_false' && (
                      <RadioGroup
                        value={currentAnswer?.answer || ''}
                        onValueChange={(value) => handleAnswerChange(quiz.id, value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="True" id={`${quiz.id}-true`} />
                          <Label htmlFor={`${quiz.id}-true`}>True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="False" id={`${quiz.id}-false`} />
                          <Label htmlFor={`${quiz.id}-false`}>False</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {quiz.question_type === 'multiple_choice' && (
                      <RadioGroup
                        value={currentAnswer?.answer || ''}
                        onValueChange={(value) => handleAnswerChange(quiz.id, value)}
                      >
                        {(quiz.options as string[]).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${quiz.id}-${optionIndex}`} />
                            <Label htmlFor={`${quiz.id}-${optionIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {quiz.question_type === 'writing' && (
                      <Textarea
                        placeholder="Enter your answer here..."
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(quiz.id, e.target.value)}
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <Button 
          onClick={handleSubmitQuizzes}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            `Submit Quiz (${quizzes.length} questions)`
          )}
        </Button>
      )}
    </div>
  );
}
