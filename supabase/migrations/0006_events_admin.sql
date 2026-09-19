-- Admin event management. Prayer meetings stay calculated, not stored as rows.
-- Apply after 0005_dues_payments.sql.

alter table public.events
	drop constraint if exists events_event_type_check;

alter table public.events
	add constraint events_event_type_check
	check (event_type in ('FELLOWSHIP', 'SPECIAL', 'OUTING', 'OTHER'));

create index if not exists events_start_at_idx on public.events (start_at);

create or replace function public.admin_create_event(
	p_title text,
	p_description text,
	p_event_type text,
	p_start_at timestamptz,
	p_end_at timestamptz
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
	created public.events;
	event_title text := nullif(trim(p_title), '');
	event_body text := nullif(trim(coalesce(p_description, '')), '');
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can create events';
	end if;

	if event_title is null or char_length(event_title) > 120 then
		raise exception 'Enter a valid event title';
	end if;

	if p_event_type not in ('FELLOWSHIP', 'SPECIAL', 'OUTING', 'OTHER') then
		raise exception 'Enter a valid event type';
	end if;

	if p_start_at is null then
		raise exception 'Enter a start time';
	end if;

	if p_end_at is not null and p_end_at <= p_start_at then
		raise exception 'The end must be after the start';
	end if;

	insert into public.events (
		title,
		description,
		event_type,
		start_at,
		end_at,
		is_recurring
	)
	values (
		event_title,
		event_body,
		p_event_type,
		p_start_at,
		p_end_at,
		false
	)
	returning * into created;

	insert into public.audit_logs (
		actor_id,
		action,
		entity_type,
		entity_id,
		old_data,
		new_data
	)
	values (
		auth.uid(),
		'event.create',
		'events',
		created.id,
		null,
		jsonb_build_object(
			'title', created.title,
			'event_type', created.event_type,
			'start_at', created.start_at
		)
	);

	return created;
end;
$$;

create or replace function public.admin_update_event(
	p_event_id uuid,
	p_title text,
	p_description text,
	p_event_type text,
	p_start_at timestamptz,
	p_end_at timestamptz
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
	current_event public.events;
	updated public.events;
	event_title text := nullif(trim(p_title), '');
	event_body text := nullif(trim(coalesce(p_description, '')), '');
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can update events';
	end if;

	select *
	into current_event
	from public.events
	where id = p_event_id
	for update;

	if not found then
		raise exception 'Event not found';
	end if;

	if event_title is null or char_length(event_title) > 120 then
		raise exception 'Enter a valid event title';
	end if;

	if p_event_type not in ('FELLOWSHIP', 'SPECIAL', 'OUTING', 'OTHER') then
		raise exception 'Enter a valid event type';
	end if;

	if p_start_at is null then
		raise exception 'Enter a start time';
	end if;

	if p_end_at is not null and p_end_at <= p_start_at then
		raise exception 'The end must be after the start';
	end if;

	update public.events
	set
		title = event_title,
		description = event_body,
		event_type = p_event_type,
		start_at = p_start_at,
		end_at = p_end_at,
		is_recurring = false
	where id = p_event_id
	returning * into updated;

	insert into public.audit_logs (
		actor_id,
		action,
		entity_type,
		entity_id,
		old_data,
		new_data
	)
	values (
		auth.uid(),
		'event.update',
		'events',
		p_event_id,
		jsonb_build_object(
			'title', current_event.title,
			'event_type', current_event.event_type,
			'start_at', current_event.start_at
		),
		jsonb_build_object(
			'title', updated.title,
			'event_type', updated.event_type,
			'start_at', updated.start_at
		)
	);

	return updated;
end;
$$;

create or replace function public.admin_delete_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	current_event public.events;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can delete events';
	end if;

	select *
	into current_event
	from public.events
	where id = p_event_id
	for update;

	if not found then
		raise exception 'Event not found';
	end if;

	delete from public.events
	where id = p_event_id;

	insert into public.audit_logs (
		actor_id,
		action,
		entity_type,
		entity_id,
		old_data,
		new_data
	)
	values (
		auth.uid(),
		'event.delete',
		'events',
		p_event_id,
		jsonb_build_object(
			'title', current_event.title,
			'event_type', current_event.event_type,
			'start_at', current_event.start_at
		),
		null
	);
end;
$$;

revoke insert, update, delete on public.events from public, anon, authenticated;
grant select on public.events to authenticated;

revoke all on function public.admin_create_event(text, text, text, timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_update_event(uuid, text, text, text, timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_delete_event(uuid) from public, anon;

grant execute on function public.admin_create_event(text, text, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_update_event(uuid, text, text, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_delete_event(uuid) to authenticated;
