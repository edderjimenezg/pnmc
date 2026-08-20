export const environment = {
  production: false,
  // 127.0.0.1, no localhost: el frontend sirve en 127.0.0.1:4200
  // (ng serve --host 127.0.0.1) y la API en 127.0.0.1:8080
  // (scripts/api-local.sh). Si difieren el host aqui, el navegador trata
  // frontend y API como sitios distintos para la cookie de sesion
  // (SameSite=Lax), y la bloquea en cualquier peticion que no sea login:
  // el login funciona porque lee el usuario de la respuesta directa, pero
  // las siguientes llamadas autenticadas (monitor, registros) llegan sin
  // cookie y devuelven 401 aunque la sesion sea valida.
  apiBaseUrl: 'http://127.0.0.1:8080',
};
