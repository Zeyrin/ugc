alter table missions add column rate numeric(10,2) not null default 0, add column cpm numeric(10,2) not null default 0;
alter table posts add column post_url text, add column stats jsonb not null default '{}',
  add column review_token uuid not null unique default gen_random_uuid();
alter table organizations add column report_token uuid not null unique default gen_random_uuid();

create table feedback (
  id bigint generated always as identity primary key,
  post_id uuid not null references posts on delete cascade,
  author_id uuid default auth.uid() references auth.users on delete set null,
  author_name text,
  body text not null,
  at_seconds numeric,
  created_at timestamptz not null default now()
);
create index on feedback (post_id, created_at);

create function can_see_post(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from posts where id = p and (is_staff(org_id) or author_id = auth.uid() or owns_mission(mission_id)))
$$;

alter table feedback enable row level security;
create policy feedback_read on feedback for select using (can_see_post(post_id));
create policy feedback_insert on feedback for insert with check (author_id = auth.uid() and can_see_post(post_id));

create function guard_post() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_staff(new.org_id) then return new; end if;
  if tg_op = 'INSERT' then
    new.org_id = (select org_id from missions where id = new.mission_id);
    new.stats = '{}'; new.post_url = null; new.published_at = null;
  else
    new.org_id = old.org_id; new.stats = old.stats; new.post_url = old.post_url;
    new.published_at = old.published_at; new.review_token = old.review_token;
  end if;
  return new;
end $$;
create trigger posts_guard before insert or update on posts for each row execute function guard_post();

create function sync_post_stats() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update posts set stats = jsonb_build_object('impressions', new.impressions, 'likes', new.likes, 'comments', new.comments, 'shares', new.shares)
  where id = new.post_id;
  return new;
end $$;
create trigger post_stats_sync after insert on post_stats for each row execute function sync_post_stats();

create function review_get(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('caption', p.caption, 'media', p.media_urls, 'status', p.status, 'scheduled_at', p.scheduled_at, 'org', o.name,
    'feedback', coalesce((select json_agg(f order by f.created_at) from
      (select author_name, body, at_seconds, created_at from feedback where post_id = p.id) f), '[]'))
  from posts p join organizations o on o.id = p.org_id where p.review_token = p_token
$$;

create function review_act(p_token uuid, p_name text, p_body text, p_at numeric, p_decision text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from posts where review_token = p_token;
  if pid is null then raise exception 'not found'; end if;
  if nullif(trim(p_body), '') is not null then
    insert into feedback (post_id, author_id, author_name, body, at_seconds)
    values (pid, null, coalesce(nullif(trim(p_name), ''), 'Client'), p_body, p_at);
  end if;
  if p_decision in ('approved', 'rejected') then
    update posts set status = p_decision::post_status where id = pid and status in ('pending_review', 'approved', 'rejected');
  end if;
end $$;

create function report_get(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('org', o.name, 'posts', coalesce((select json_agg(x order by x.published_at desc) from (
    select p.caption, p.post_url, p.published_at, p.stats, s.platform, s.handle
    from posts p left join social_accounts s on s.id = p.social_account_id
    where p.org_id = o.id and p.status = 'published') x), '[]'))
  from organizations o where o.report_token = p_token
$$;

grant execute on function review_get, review_act, report_get to anon, authenticated;

insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.role_in(((storage.foldername(name))[1])::uuid) is not null);
