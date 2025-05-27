
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Quiz = Tables<'quizzes'>;

interface QuizManagerProps {
  sessionId: string;
}

interface QuizForm {
  question: string;
  question_type: 'true_false' | 'multiple_choice' | 'writing';
  correct_answer: string;
  options: string[];
}

export function QuizManager({ sessionId }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [quizForm, setQuizForm] = useState<QuizForm>({
    question: '',
    question_type: 'multiple_choice',
    correct_answer: '',
    options: ['', '', '', '']
  });

  useEffect(() => {
    fetchQuizzes();
  }, [sessionId]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuizzes(data || []);
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

  const resetForm = () => {
    setQuizForm({
      question: '',
      question_type: 'multiple_choice',
      correct_answer: '',
      options: ['', '', '', '']
    });
    setEditingQuiz(null);
  };

  const handleCreateQuiz = async () => {
    if (!quizForm.question.trim()) {
      toast({
        title: "Error",
        description: "Question is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const quizData = {
        session_id: sessionId,
        question: quizForm.question.trim(),
        question_type: quizForm.question_type,
        correct_answer: quizForm.correct_answer.trim(),
        options: quizForm.question_type === 'multiple_choice' 
          ? quizForm.options.filter(opt => opt.trim()) 
          : quizForm.question_type === 'true_false' 
          ? ['True', 'False'] 
          : [],
        points: 2
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Quiz updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert(quizData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Quiz created successfully!",
        });
      }

      fetchQuizzes();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    const options = Array.isArray(quiz.options) ? quiz.options as string[] : [];
    setQuizForm({
      question: quiz.question,
      question_type: quiz.question_type as 'true_false' | 'multiple_choice' | 'writing',
      correct_answer: quiz.correct_answer,
      options: quiz.question_type === 'multiple_choice' 
        ? [...options, '', '', '', ''].slice(0, 4)
        : ['', '', '', '']
    });
    setEditingQuiz(quiz);
    setShowCreateDialog(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
      
      fetchQuizzes();
      toast({
        title: "Success",
        description: "Quiz deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Session Quizzes</h3>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  placeholder="Enter your question"
                  value={quizForm.question}
                  onChange={(e) => setQuizForm({...quizForm, question: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_type">Question Type</Label>
                <Select
                  value={quizForm.question_type}
                  onValueChange={(value: 'true_false' | 'multiple_choice' | 'writing') => 
                    setQuizForm({...quizForm, question_type: value, correct_answer: ''})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="writing">Writing Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {quizForm.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {quizForm.options.map((option, index) => (
                    <Input
                      key={index}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...quizForm.options];
                        newOptions[index] = e.target.value;
                        setQuizForm({...quizForm, options: newOptions});
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="correct_answer">Correct Answer *</Label>
                {quizForm.question_type === 'true_false' ? (
                  <Select
                    value={quizForm.correct_answer}
                    onValueChange={(value) => setQuizForm({...quizForm, correct_answer: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : quizForm.question_type === 'multiple_choice' ? (
                  <Select
                    value={quizForm.correct_answer}
                    onValueChange={(value) => setQuizForm({...quizForm, correct_answer: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {quizForm.options.filter(opt => opt.trim()).map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    id="correct_answer"
                    placeholder="Enter the model answer for this writing question"
                    value={quizForm.correct_answer}
                    onChange={(e) => setQuizForm({...quizForm, correct_answer: e.target.value})}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuiz} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingQuiz ? 'Update Quiz' : 'Create Quiz'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map((quiz, index) => (
            <Card key={quiz.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    <p className="text-sm text-gray-600">{quiz.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {quiz.question_type === 'true_false' ? 'True/False' : 
                       quiz.question_type === 'multiple_choice' ? 'Multiple Choice' : 
                       'Writing'}
                    </Badge>
                    <Badge variant="secondary">{quiz.points} pts</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    <strong>Answer:</strong> {quiz.correct_answer}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuiz(quiz)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h4 className="font-medium text-gray-900 mb-1">No quizzes yet</h4>
            <p className="text-gray-600 mb-4">Add quizzes to test student knowledge</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
