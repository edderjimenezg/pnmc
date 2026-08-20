/*
    PNMC - Usuarios de prueba para el panel de "Cuentas de Prueba" del login.

    pnmc-web/src/app/features/admin/admin-login/admin-login.component.ts define
    ROLE_CREDENTIALS con seis cuentas (contrasena 'admin' para todas). La API ya
    las crea en tiempo de ejecucion via DatabaseBootstrapper.EnsureBootstrapUserAsync,
    pero solo si Database:SeedBootstrapUsers esta en true (appsettings.Local.json) y
    solo despues de que la API arranca al menos una vez. Este archivo las siembra
    tambien por SQL para que existan desde la preparacion de la base, sin depender
    de ese arranque previo: la semilla de datos de moderacion (07) ya las necesita
    creadas, con estos mismos IdUsuario.

    Los IdUsuario se fijan de forma explicita (2 a 7) para que coincidan exactamente
    con el orden en que DatabaseBootstrapper.cs los crea en tiempo de ejecucion
    (sistema@pnmc.local ya ocupa el 1, sembrado en la semilla 03). Si alguna vez
    difieren, no rompe nada: solo dejarian de coincidir con los IdUsuarioCreador /
    IdUsuarioResponsable que la semilla 07 da por hecho.

    El hash de contrasena es el que produce Microsoft.AspNetCore.Identity.PasswordHasher
    para la contrasena 'admin', extraido de una ejecucion real de la API (mismo
    algoritmo que valida el login: PNMC.Api.Endpoints.AdminAuthEndpoints). Si en el
    futuro cambia el algoritmo de hash de la API, este valor debe regenerarse.
*/

DECLARE @HashAdmin nvarchar(500) = N'AQAAAAIAAYagAAAAEKQUwPF3xliNnfYcL0nmpXL6mDdOAVdW4k+bJUDa01XKsFmT6VNZjmYgxyVOvqFAaw==';

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE CorreoElectronico = N'admin@pnmc.local')
BEGIN
    SET IDENTITY_INSERT dbo.Usuarios ON;

    INSERT INTO dbo.Usuarios (IdUsuario, NombreCompleto, CorreoElectronico, HashContrasena, IdRol, CanalAcceso, TipoPerfil, Activo)
    VALUES
        (2, N'Webmaster PNMC',       N'admin@pnmc.local',         @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'webmaster'),      N'interno', NULL,             1),
        (3, N'Gestor Interno PNMC',  N'gestor@pnmc.local',        @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'gestor_interno'), N'interno', NULL,             1),
        (4, N'Aliado Administrador', N'aliado-admin@pnmc.local',  @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_admin'),   N'aliado',  NULL,             1),
        (5, N'Aliado Editor',        N'aliado-editor@pnmc.local', @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_editor'),  N'aliado',  NULL,             1),
        (6, N'Aliado Lector',        N'aliado-lector@pnmc.local', @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_lector'),  N'aliado',  NULL,             1),
        (7, N'Colaborador Externo',  N'externo@pnmc.local',       @HashAdmin, (SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'externo'),        N'externo', N'organizacion',  1);

    SET IDENTITY_INSERT dbo.Usuarios OFF;
END;
