
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Achievement } from "@/types/supabase";

const ProfilePage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  });
  
  // Mock achievements - in a real app, these would come from the database
  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first coding session",
      badge_name: "beginner",
    },
    {
      id: "2",
      title: "Consistent Coder",
      description: "Complete 5 coding sessions",
      badge_name: "consistent",
    },
    {
      id: "3",
      title: "Quiz Master",
      description: "Get a perfect score on 3 quizzes",
      badge_name: "quiz",
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'age' ? parseInt(value) || '' : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!profile) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: formData.age ? Number(formData.age) : null,
          phone: formData.phone || null,
          location: formData.location || null,
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!profile) return null;
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      value={profile.unique_id || 'Not assigned yet'}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: profile.name,
                            age: profile.age || '',
                            phone: profile.phone || '',
                            location: profile.location || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-academy-blue hover:bg-blue-600">
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      className="bg-academy-orange hover:bg-orange-600"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-8">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} 
                      alt={profile.name} 
                    />
                    <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-500">Total Points</dt>
                    <dd className="font-semibold">{profile.total_points}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-500">Member Since</dt>
                    <dd className="font-semibold">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                      <div className="w-10 h-10 bg-academy-lightOrange rounded-full flex items-center justify-center">
                        <span className="text-academy-orange font-bold">
                          {achievement.badge_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {achievements.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No achievements yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
