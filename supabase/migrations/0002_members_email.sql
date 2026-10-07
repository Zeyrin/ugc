alter table members add column email text;

update members m set email = u.email from auth.users u where u.id = m.user_id;

create or replace function create_organization(org_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  insert into organizations (name) values (org_name) returning id into oid;
  insert into members (org_id, user_id, role, email) values (oid, auth.uid(), 'owner', auth.jwt() ->> 'email');
  return oid;
end $$;

create function invite_member(org uuid, member_email text, member_role member_role) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not (role_in(org) = 'owner' or (is_staff(org) and member_role = 'creator')) then
    raise exception 'forbidden';
  end if;
  select id into uid from auth.users where lower(email) = lower(member_email);
  if uid is null then raise exception 'user not found'; end if;
  insert into members (org_id, user_id, role, email) values (org, uid, member_role, member_email)
  on conflict (org_id, user_id) do update set role = excluded.role;
end $$;
