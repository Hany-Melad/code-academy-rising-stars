-- Add missing foreign key relationships for student_group_points table
ALTER TABLE public.student_group_points 
ADD CONSTRAINT student_group_points_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_group_points 
ADD CONSTRAINT student_group_points_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.course_groups(id) ON DELETE CASCADE;