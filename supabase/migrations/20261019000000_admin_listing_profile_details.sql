DROP POLICY IF EXISTS "Admins can view profile offerings" ON public.profile_offerings;
CREATE POLICY "Admins can view profile offerings" ON public.profile_offerings
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view profile references" ON public.profile_references;
CREATE POLICY "Admins can view profile references" ON public.profile_references
    FOR SELECT USING (public.is_admin());
