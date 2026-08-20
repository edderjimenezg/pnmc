# Cómo se trabaja en este repositorio

Guía práctica de Git para SIMUS. Está escrita para quien no maneja Git a diario: explica
qué hace cada comando y por qué, no solo cuál escribir.

## Las cuatro ideas que hay que tener claras

**Commit.** Una foto del proyecto en un momento, con un mensaje que dice qué cambió y por
qué. Un commit debería contener *una sola idea*: si tienes que usar «y» para describirlo,
probablemente son dos commits.

**Rama.** Una línea de trabajo paralela. Naces desde `main`, haces tus commits sin molestar
a nadie, y cuando funciona la integras de vuelta. `main` siempre debe estar sana.

**Tag.** Una etiqueta permanente sobre un commit concreto. Marca hitos: «esta es la
versión que se entregó», «esta es la línea base». A diferencia de una rama, no se mueve.

**Área de preparación (*staging*).** El paso intermedio entre «cambié un archivo» y «lo
confirmé». `git add` mete cambios ahí; `git commit` los sella. Sirve para elegir qué entra
en cada commit cuando has tocado varias cosas a la vez.

## El ciclo de trabajo normal

### 1. Partir siempre de `main` al día

```bash
git checkout main
git pull
```

### 2. Crear la rama del trabajo

```bash
git checkout -b cv/012-nombre-corto
```

`checkout -b` crea la rama y te cambia a ella. El nombre usa un prefijo que dice de qué
tipo de trabajo se trata:

| Prefijo | Para qué |
|---|---|
| `cv/` | Corte vertical: una funcionalidad completa de punta a punta |
| `piloto/` | Trabajo de piloto acotado |
| `mantenimiento/` | Saneamiento, deuda técnica, actualizaciones |
| `fix/` | Corrección de un error concreto |
| `docs/` | Solo documentación |

Este esquema no lo invento: es el que ya venías usando y quedó en el historial.

### 3. Ver en qué estado estás

```bash
git status        # qué archivos cambiaron
git diff          # qué cambió exactamente, línea por línea
```

Acostúmbrate a `git diff` antes de cada commit. Es la única forma de no confirmar algo sin
querer.

### 4. Confirmar por partes

```bash
git add ruta/al/archivo.ts        # un archivo
git add pnmc-api/                 # una carpeta entera
git commit -m "feat(festival): permitir editar la periodicidad"
```

Evita `git add -A` (añade *todo*, incluidos archivos que no querías). Si lo usas, mira
antes `git status`.

### 5. Verificar antes de integrar

```bash
cd pnmc-api && dotnet test PNMC.Api.sln
cd ../pnmc-web && npm test && npm run build
```

### 6. Integrar en `main`

```bash
git checkout main
git merge cv/012-nombre-corto
git push
```

### 7. Borrar la rama ya integrada

```bash
git branch -d cv/012-nombre-corto
```

La `-d` minúscula solo borra si ya está integrada; si no lo está, Git se niega. Es una
red de seguridad: úsala siempre en vez de `-D`.

## Los mensajes de commit

El formato es `tipo(ámbito): descripción en minúscula`.

```
feat(festival): solicitudes de administracion de festival
fix(acceso): corregir redireccion tras el registro externo
refactor(festival): centralizar la creacion de la version vigente
chore(repo): retirar los lanzadores .command de la raiz
docs: actualizar el README a la estructura depurada
test(api): cubrir el rechazo de solicitudes duplicadas
```

| Tipo | Cuándo |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un error |
| `refactor` | Reorganizar código sin cambiar el comportamiento |
| `test` | Pruebas |
| `docs` | Documentación |
| `chore` | Mantenimiento del repositorio, dependencias, configuración |

Si el commit necesita explicación, deja una línea en blanco y escribe un párrafo debajo.
El título dice *qué*; el cuerpo dice *por qué*.

## Cómo deshacer

Esto es lo que más tranquilidad da: en Git casi nada se pierde.

```bash
git checkout -- archivo.ts         # descartar cambios no confirmados de un archivo
git restore --staged archivo.ts    # sacar un archivo del area de preparacion
git commit --amend                 # corregir el ultimo commit (solo si no lo has subido)
git revert <hash>                  # crear un commit que deshace otro commit
git reflog                         # ver TODO lo que hiciste, incluso lo que creias perdido
```

`git revert` es la forma segura de deshacer algo ya integrado: no borra historia, añade un
commit que la revierte. `git reset --hard` sí borra: no lo uses sin estar seguro.

## Qué nunca se confirma

Ya está en `.gitignore`, pero conviene saber por qué:

- `appsettings.Local.json` y `.env` — **contienen contraseñas.**
- `node_modules/`, `bin/`, `obj/`, `dist/`, `.angular/` — se regeneran solos.
- `tmp/` — artefactos intermedios.
- `.agents/`, `.claude/`, `skills-lock.json` — herramientas locales, no del proyecto.

Antes de un commit grande, comprueba que no se cuele nada:

```bash
git status --porcelain | grep -iE "appsettings.local|\.env"
```

## Ver el historial

```bash
git log --oneline -20                    # los ultimos 20 commits, una linea cada uno
git log --oneline --graph --all          # el arbol de ramas, en dibujo
git log --stat -3                        # que archivos toco cada commit
git show <hash>                          # el contenido completo de un commit
git log --follow -- ruta/al/archivo.ts   # la historia de un solo archivo
```

`git log --oneline --graph --all` es el que conviene memorizar: te dibuja de dónde salió
cada rama y dónde se integró.

## Tags: marcar hitos

```bash
git tag -a v1.0 -m "Descripcion del hito"    # crear
git tag                                       # listar
git push origin v1.0                          # subir (los tags no van en el push normal)
git checkout v0.0-base                        # mirar como estaba el proyecto en ese punto
```

En este repositorio los tags existentes documentan cada corte vertical entregado:
`simus-impl-001-cv004` … `simus-impl-008-cv011`, `simus-piloto-001-pv01`,
`simus-piloto-002-acceso`, `simus-preprod-001-festival`, y la línea base `v0.0-base`.
