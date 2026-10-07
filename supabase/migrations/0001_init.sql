create type member_role as enum ('owner', 'manager', 'creator');
create type platform as enum ('instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'facebook');
create type mission_status as enum ('open', 'in_progress', 'submitted', 'done', 'cancelled');
create type post_status as enum ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table members (
  org_id uuid not null references organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role member_role not null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  platform platform not null,
  handle text not null,
  created_at timestamptz not null default now(),
  unique (org_id, platform, handle)
);

create table missions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  creator_id uuid references auth.users on delete set null,
  title text not null,
  brief text,
  status mission_status not null default 'open',
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  social_account_id uuid references social_accounts on delete set null,
  mission_id uuid references missions on delete set null,
  author_id uuid not null default auth.uid() references auth.users,
  caption text,
  media_urls text[] not null default '{}',
  status post_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table post_stats (
  id bigint generated always as identity primary key,
  post_id uuid not null references posts on delete cascade,
  impressions int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  collected_at timestamptz not null default now()
);

create index on members (user_id);
create index on missions (org_id, creator_id);
create index on posts (org_id, status, scheduled_at);
create index on posts (mission_id);
create index on post_stats (post_id, collected_at desc);

create function role_in(org uuid) returns member_role
language sql stable security definer set search_path = public as $$
  select role from members where org_id = org and user_id = auth.uid()
$$;

create function is_staff(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(role_in(org) in ('owner', 'manager'), false)
$$;

create function owns_mission(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from missions where id = m and creator_id = auth.uid())
$$;

alter table organizations enable row level security;
alter table members enable row level security;
alter table social_accounts enable row level security;
alter table missions enable row level security;
alter table posts enable row level security;
alter table post_stats enable row level security;

create policy org_read on organizations for select using (role_in(id) is not null);
create policy org_write on organizations for update using (role_in(id) = 'owner');
create policy org_delete on organizations for delete using (role_in(id) = 'owner');

create policy members_read on members for select using (user_id = auth.uid() or is_staff(org_id));
create policy members_owner on members for all using (role_in(org_id) = 'owner') with check (role_in(org_id) = 'owner');
create policy members_manager on members for insert with check (is_staff(org_id) and role = 'creator');
create policy members_manager_del on members for delete using (is_staff(org_id) and role = 'creator');

create policy accounts_staff on social_accounts for all using (is_staff(org_id)) with check (is_staff(org_id));

create policy missions_staff on missions for all using (is_staff(org_id)) with check (is_staff(org_id));
create policy missions_creator on missions for select using (creator_id = auth.uid());

create policy posts_staff on posts for all using (is_staff(org_id)) with check (is_staff(org_id));
create policy posts_creator_read on posts for select using (author_id = auth.uid() or owns_mission(mission_id));
create policy posts_creator_insert on posts for insert with check (
  author_id = auth.uid() and owns_mission(mission_id) and status in ('draft', 'pending_review')
);
create policy posts_creator_update on posts for update
  using (author_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'))
  with check (author_id = auth.uid() and owns_mission(mission_id) and status in ('draft', 'pending_review'));

create policy stats_staff on post_stats for all
  using (is_staff((select org_id from posts where id = post_id)))
  with check (is_staff((select org_id from posts where id = post_id)));
create policy stats_creator on post_stats for select using (
  exists (select 1 from posts p where p.id = post_id and (p.author_id = auth.uid() or owns_mission(p.mission_id)))
);

create function create_organization(org_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  insert into organizations (name) values (org_name) returning id into oid;
  insert into members (org_id, user_id, role) values (oid, auth.uid(), 'owner');
  return oid;
end $$;

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger posts_touch before update on posts for each row execute function touch_updated_at();
