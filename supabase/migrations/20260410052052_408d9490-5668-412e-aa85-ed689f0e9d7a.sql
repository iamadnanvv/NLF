
DROP POLICY "Authenticated can read open projects" ON public.projects;

CREATE POLICY "Authenticated can read relevant projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  status = 'open'
  OR owner_id = auth.uid()
  OR assigned_freelancer_id = auth.uid()
);
