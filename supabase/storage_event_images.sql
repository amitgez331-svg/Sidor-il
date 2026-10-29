-- event-images: צפייה ציבורית (התמונות מוצגות בהזמנה), העלאה רק למשתמש מחובר,
-- עדכון רק למי שהעלה (או אדמין), מחיקה רק לאדמין. מחליף את ה-"allow all" הישנים.
drop policy if exists "allow all 1o4y39n_1" on storage.objects;
drop policy if exists "allow all 1o4y39n_2" on storage.objects;
drop policy if exists "allow all 1o4y39n_3" on storage.objects;

drop policy if exists event_images_insert on storage.objects;
create policy event_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images');

drop policy if exists event_images_update on storage.objects;
create policy event_images_update on storage.objects for update to authenticated
  using (bucket_id = 'event-images' and (owner_id = auth.uid()::text or public.is_admin()))
  with check (bucket_id = 'event-images' and (owner_id = auth.uid()::text or public.is_admin()));

drop policy if exists event_images_delete on storage.objects;
create policy event_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and public.is_admin());
