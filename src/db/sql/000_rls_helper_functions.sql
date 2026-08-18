-- ════════════════════════════════════════════════════════════════════
-- Funciones auxiliares para RLS multi-tenant
--
-- Requiere que el Custom Access Token Hook de Supabase Auth inyecte
-- en app_metadata del JWT: tenant_id, rol (slug del rol) al momento
-- del login. Ver: supabase/hooks/custom_access_token_hook.sql
--
-- Estas funciones se ejecutan en cada evaluación de política RLS,
-- por eso están marcadas STABLE (no vuelven a leer nada por fuera
-- del JWT/sesión actual, así que Postgres puede cachear el resultado
-- dentro de la misma consulta).
-- ════════════════════════════════════════════════════════════════════

create schema if not exists app;

-- Tenant del usuario autenticado (null si no hay tenant en el token,
-- ej. super_admin de plataforma).
create or replace function app.current_tenant_id()
returns uuid
language sql
stable
security invoker
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$;

-- Slug del rol del usuario autenticado (ej: 'admin_tenant', 'cajero').
create or replace function app.current_rol()
returns text
language sql
stable
security invoker
as $$
  select auth.jwt() -> 'app_metadata' ->> 'rol';
$$;

-- true si el usuario es super_admin de la plataforma (soporte, no
-- pertenece a un tenant).
create or replace function app.is_super_admin()
returns boolean
language sql
stable
security invoker
as $$
  select app.current_rol() = 'super_admin';
$$;

-- true si el usuario administra todo el tenant (todas las sucursales).
create or replace function app.is_admin_tenant()
returns boolean
language sql
stable
security invoker
as $$
  select app.current_rol() = 'admin_tenant';
$$;

-- Sucursales asignadas explícitamente al usuario autenticado
-- (tabla usuarios_sucursales). admin_tenant no necesita filas ahí:
-- su acceso ya es a nivel de tenant completo.
create or replace function app.user_sucursales()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select sucursal_id
  from usuarios_sucursales
  where usuario_id = auth.uid();
$$;

-- true si el usuario autenticado tiene acceso a la sucursal indicada:
-- primero se exige que la sucursal pertenezca al tenant del usuario
-- (esto es lo que realmente aísla entre tenants), y luego, dentro de
-- ese tenant: admin_tenant tiene acceso a todas las sucursales, el
-- resto de roles solo si están asignados explícitamente a ella.
create or replace function app.has_sucursal_access(target_sucursal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from sucursales s
    where s.id = target_sucursal_id
      and s.tenant_id = app.current_tenant_id()
      and (
        app.is_admin_tenant()
        or s.id in (select app.user_sucursales())
      )
  );
$$;

-- true si el rol del usuario tiene el permiso indicado (por código,
-- ej: 'ventas.anular'), consultando rol_permisos. admin_tenant se
-- considera con acceso total sin necesidad de filas explícitas.
create or replace function app.has_permission(permiso_codigo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app.is_admin_tenant()
    or exists (
      select 1
      from usuarios u
      join rol_permisos rp on rp.rol_id = u.rol_id
      join permisos p on p.id = rp.permiso_id
      where u.id = auth.uid()
        and p.codigo = permiso_codigo
    );
$$;
