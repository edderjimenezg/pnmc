# Convenciones de trabajo

## Ramas

`main` es la rama principal y debe permanecer siempre en estado desplegable. El trabajo se
hace en ramas temáticas creadas desde `main` y se integra por merge.

| Prefijo | Uso |
|---|---|
| `cv/` | Corte vertical: una capacidad completa de punta a punta |
| `piloto/` | Trabajo de piloto acotado |
| `mantenimiento/` | Saneamiento, deuda técnica y actualizaciones |
| `fix/` | Corrección de un defecto concreto |
| `docs/` | Solo documentación |

El nombre lleva el prefijo, un número cuando aplique y una descripción corta en minúscula
separada por guiones: `cv/012-vinculacion-escuelas`.

Una rama integrada se cierra con `git branch -d`, que rechaza la operación si el trabajo no
está integrado.

## Commits

Formato `tipo(ámbito): descripción`, en minúscula y en presente.

| Tipo | Uso |
|---|---|
| `feat` | Capacidad nueva |
| `fix` | Corrección de un defecto |
| `refactor` | Reorganización sin cambio de comportamiento |
| `test` | Pruebas |
| `docs` | Documentación |
| `chore` | Mantenimiento del repositorio, dependencias y configuración |

Cada commit contiene una sola idea. El título dice qué cambia; el cuerpo, separado por una
línea en blanco, dice por qué.

```
feat(festival): solicitudes de administracion de festival

Permite que una organizacion externa solicite el reconocimiento de la
administracion de un festival y que la institucion revise, pida informacion
adicional y decida.
```

Cuando un cambio de código altera lo que describe un documento, el documento se actualiza
en el mismo commit.

## Verificación antes de integrar

```bash
cd pnmc-api && dotnet test PNMC.Api.sln
cd ../pnmc-web && npm test && npm run build
```

No se integra en `main` con pruebas en rojo.

## Tags

Los hitos se marcan con tags anotados, que son el registro de qué se entregó y cuándo. Los
cambios relevantes de cada versión se resumen en `CHANGELOG.md`.

```bash
git tag -a v0.1 -m "Descripcion del hito"
git push origin v0.1
```

Los tags no se suben con el `push` ordinario: requieren `git push origin --tags` o el
nombre explícito del tag.

## Qué no se versiona

`.gitignore` cubre estas categorías. Conviene conocer el motivo de cada una.

| Categoría | Motivo |
|---|---|
| `appsettings.Local.json`, `.env` | Contienen credenciales |
| `node_modules/`, `bin/`, `obj/`, `dist/`, `.angular/` | Se regeneran |
| `tmp/` | Artefactos intermedios de generación |
| `.agents/`, `.claude/`, `skills-lock.json` | Herramientas locales, ajenas al proyecto |

Los archivos `.example` sí se versionan: son las plantillas desde las que se crea la
configuración local.

Antes de un commit amplio conviene comprobar que no se cuele configuración local:

```bash
git status --porcelain | grep -iE "appsettings.local|\.env"
```

## Configuración local

```bash
cp pnmc-api/src/PNMC.Api/appsettings.Local.example.json \
   pnmc-api/src/PNMC.Api/appsettings.Local.json
```

El arranque y los puertos están en el `README.md` de la raíz.

## Publicar en GitHub

No hay automatización de publicación: cada subida es una acción deliberada, en el momento
que decidas que el trabajo está listo. El procedimiento es siempre el mismo, manual:

```bash
# 1. Verificar que compila y pasa las pruebas (ver arriba)
# 2. Verificar que no hay configuracion local en el commit
git status --porcelain | grep -iE "appsettings.local|\.env"

# 3. Subir la rama principal
git checkout main
git push origin main

# 4. Subir los tags nuevos, si creaste alguno
git push origin --tags
```

Si trabajaste en una rama distinta de `main`, intégrala primero (ver "Ramas" arriba) y sube
`main` ya actualizada. No hay un script que automatice este paso a propósito: forzar una
pausa antes de publicar es lo que evita subir algo a medio probar o con credenciales sueltas.
