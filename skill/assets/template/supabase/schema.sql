-- smb-site schema.
--
-- Two content tables, matching the two things the owner edits:
--   facts  — singleton documents. One row per site.
--   pages  — one Puck JSON tree per page. Composition only.
-- Facts are referenced by blocks, never copied into them, which is what keeps
-- a price correct on every page at once.

create table if not exists facts (
  site_id     text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists pages (
  id          uuid primary key default gen_random_uuid(),
  site_id     text not null,
  slug        text not null,
  title       text,
  data        jsonb not null default '{"content":[],"root":{}}'::jsonb,
  published   boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (site_id, slug)
);

-- Collections: owner-maintained repeating records that grow over time —
-- products, news, team, dishes. The third content type, and the one that
-- decides whether an owner keeps using the site after handover.
--
-- Not facts: there are hundreds and they are not referenced by id from pages.
-- Not pages: they share one layout and the owner adds them without touching
-- composition. A row per item, its shape defined by the collection.
create table if not exists collection_items (
  id          uuid primary key default gen_random_uuid(),
  site_id     text not null,
  collection  text not null,           -- 'producten', 'nieuws', …
  slug        text not null,           -- unique within (site_id, collection)
  data        jsonb not null default '{}'::jsonb,
  published   boolean not null default true,
  sort_key    text,                    -- optional manual ordering
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (site_id, collection, slug)
);

-- The queries this table actually serves: "every published product", and
-- "every published product in this department and category".
create index if not exists collection_items_lookup
  on collection_items (site_id, collection, published);

-- Filtering happens inside the jsonb (dept, category, brand for products), so
-- the whole document needs to be indexed rather than named columns.
create index if not exists collection_items_data
  on collection_items using gin (data);

create table if not exists media (
  id          uuid primary key default gen_random_uuid(),
  site_id     text not null,
  path        text not null,
  alt         text,
  created_at  timestamptz not null default now()
);

alter table facts enable row level security;
alter table pages enable row level security;
alter table collection_items enable row level security;
alter table media enable row level security;

-- Anonymous visitors may read. Nothing anonymous may write; all writes go
-- through /api/publish with the service-role key after a session check.
create policy "public read facts" on facts for select using (true);
create policy "public read published pages" on pages for select using (published);
create policy "public read published items" on collection_items for select using (published);
create policy "public read media" on media for select using (true);

-- Storage bucket for owner-uploaded images.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- The owner uploads product photos straight from the browser, so signed-in
-- users need write access to this bucket. Anonymous visitors get read only.
create policy "public read site-media" on storage.objects
  for select using (bucket_id = 'site-media');

create policy "owner uploads site-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-media');

create policy "owner replaces site-media" on storage.objects
  for update to authenticated using (bucket_id = 'site-media');
