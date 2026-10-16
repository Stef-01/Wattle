-- Temporary transport for running data/load/*.sql inside the project when no psql / service-role
-- connection is at hand (2026-10-16 load used this). The batches are uploaded to a public Storage
-- bucket "load" with the publishable key, Postgres fetches each one over the http extension and
-- EXECUTEs it, then everything here is torn down again. See pipeline/load/README.md "Transport".
create extension if not exists http with schema extensions;
insert into storage.buckets (id, name, public) values ('load', 'load', true) on conflict (id) do nothing;
create policy load_anon_upload on storage.objects for insert to anon with check (bucket_id = 'load');
create policy load_anon_update on storage.objects for update to anon using (bucket_id = 'load') with check (bucket_id = 'load');
create policy load_anon_select on storage.objects for select to anon using (bucket_id = 'load');
create policy load_anon_delete on storage.objects for delete to anon using (bucket_id = 'load');

create or replace function public.run_load_file(fname text) returns text language plpgsql security definer set search_path = public, extensions as $$
declare resp extensions.http_response; url text;
begin
  begin perform extensions.http_set_curl_option('CURLOPT_TIMEOUT_MS', '120000'); exception when others then null; end;
  url := 'https://zbwvctztpdiugvwjwzbl.supabase.co/storage/v1/object/public/load/' || fname;
  select * into resp from extensions.http_get(url);
  if resp.status <> 200 then raise exception 'fetch % -> http %', fname, resp.status; end if;
  execute resp.content;
  return fname || ' ok (' || length(resp.content) || ' bytes)';
end $$;
revoke all on function public.run_load_file(text) from public, anon, authenticated;

-- run (one call per table stage keeps each call inside the statement timeout):
-- select public.run_load_file(f) from unnest(array['qld_001_sources.sql', ...]) with ordinality as t(f, n) order by n;

-- teardown (objects and the bucket go through the Storage API; direct deletes are blocked):
-- curl -X DELETE $URL/storage/v1/object/load -d '{"prefixes":[...]}' ; curl -X DELETE $URL/storage/v1/bucket/load
-- drop policy load_anon_upload on storage.objects; drop policy load_anon_update on storage.objects;
-- drop policy load_anon_select on storage.objects; drop policy load_anon_delete on storage.objects;
-- drop function public.run_load_file(text);
