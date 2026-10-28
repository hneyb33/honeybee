DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings;
CREATE POLICY "Clients can view their own bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Providers can view bookings for their listings" ON public.bookings;
CREATE POLICY "Providers can view bookings for their listings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.listings
            WHERE public.listings.id = public.bookings.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites"
    ON public.favorites
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can save their own favorites" ON public.favorites;
CREATE POLICY "Users can save their own favorites"
    ON public.favorites
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites"
    ON public.favorites
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
