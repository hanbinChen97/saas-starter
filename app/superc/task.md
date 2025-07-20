

在 demo page 增加表单。 填写表单后，点击提交按钮，提交表单数据到后端 user_profiles 表。
填写的内容包括：
- 姓名
- 电话
- 邮箱
- 出生日期
preferred_locations 默认 superc



后端使用 supabase 数据库。
表结构如下：
Name	Description	Data Type	Format	Nullable	
id

No description

bigint	int8		
user_id

No description

integer	int4		
vorname

No description

text	text		
nachname

No description

text	text		
phone

No description

text	text		
geburtsdatum_day

No description

integer	int4		
geburtsdatum_month

No description

integer	int4		
geburtsdatum_year

No description

integer	int4		
preferred_locations

No description

jsonb	jsonb		
is_complete

No description

boolean	bool		
created_at

No description

timestamp without time zone	timestamp		
updated_at

No description

timestamp without time zone	timestamp		


数据库新加了 user_profiles 表， create table public.user_profiles (
  id bigserial not null,
  user_id integer null,
  vorname text null,
  nachname text null,
  phone text null,
  geburtsdatum_day integer null,
  geburtsdatum_month integer null,
  geburtsdatum_year integer null,
  preferred_locations jsonb null,
  is_complete boolean null default false,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;


waiting_list 表， 存储等待名单：
create table public.waiting_list (
  id bigserial not null,
  user_id integer null,
  location_type text null,
  status text null default 'pending'::text,
  current_retry_count integer null default 0,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint waiting_list_pkey primary key (id),
  constraint waiting_list_user_id_location_type_key unique (user_id, location_type),
  constraint waiting_list_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint waiting_list_location_type_check check (
    (
      location_type = any (array['superc'::text, 'infostelle'::text])
    )
  ),
  constraint waiting_list_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_waiting_list_status on public.waiting_list using btree (status) TABLESPACE pg_default;

create index IF not exists idx_waiting_list_user_id on public.waiting_list using btree (user_id) TABLESPACE pg_default;


appointment_records 表， 存储预约记录：
create table public.appointment_records (
  id bigserial not null,
  user_id integer null,
  waiting_list_id bigint null,
  location_type text null,
  booking_status text null,
  appointment_date timestamp without time zone null,
  error_message text null,
  form_data_snapshot jsonb null,
  booking_duration_ms integer null,
  created_at timestamp without time zone null default now(),
  constraint appointment_records_pkey primary key (id),
  constraint appointment_records_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint appointment_records_waiting_list_id_fkey foreign KEY (waiting_list_id) references waiting_list (id) on delete set null,
  constraint appointment_records_booking_status_check check (
    (
      booking_status = any (
        array[
          'success'::text,
          'failed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_appointment_records_user_id on public.appointment_records using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_appointment_records_waiting_list_id on public.appointment_records using btree (waiting_list_id) TABLESPACE pg_default;


现在加上 superc/main/page.tsx 页面 的提交表单的功能， 上传数据到数据库。