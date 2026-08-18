-- ════════════════════════════════════════════════════════════════════
-- Custom Access Token Hook
--
-- Se configura en Supabase Dashboard → Authentication → Hooks
-- ("Custom Access Token" → apuntar a auth.custom_access_token_hook).
-- Se ejecuta en cada login/refresh de token e inyecta tenant_id y
-- rol dentro de app_metadata del JWT, que luego leen las funciones
-- de app/000_rls_helper_functions.sql.
--
-- sucursal_id NO se inyecta aquí: un usuario puede tener acceso a
-- varias sucursales (tabla usuarios_sucursales), así que la sucursal
-- activa se maneja como estado de sesión en la aplicación (selector
-- de sucursal tras login), no como claim fijo del JWT.
-- ════════════════════════════════════════════════════════════════════

create or replace function auth.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  usuario_tenant_id uuid;
  usuario_rol_slug text;
begin
  select u.tenant_id, r.slug
  into usuario_tenant_id, usuario_rol_slug
  from usuarios u
  join roles r on r.id = u.rol_id
  where u.id = (event ->> 'user_id')::uuid
    and u.activo = true;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if usuario_tenant_id is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata,tenant_id}',
      to_jsonb(usuario_tenant_id::text)
    );
    claims := jsonb_set(
      claims,
      '{app_metadata,rol}',
      to_jsonb(usuario_rol_slug)
    );
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Permisos requeridos por Supabase Auth para invocar el hook.
grant usage on schema public to supabase_auth_admin;
grant select on public.usuarios, public.roles to supabase_auth_admin;
revoke execute on function auth.custom_access_token_hook from authenticated, anon, public;
grant execute on function auth.custom_access_token_hook to supabase_auth_admin;
