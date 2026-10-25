// Script servido em `/docs/swagger-csrf.js` e injetado no Swagger UI.
// O Swagger UI roda na MESMA origem da API: o cookie de sessão vai sozinho, mas
// o cookie CSRF não é enviado como header automaticamente. Este script lê o
// `drivo_csrf` (não-HttpOnly, por design do double-submit) e ecoa em
// `X-CSRF-Token` em toda requisição mutável — é o que faz o "Try it out" passar
// no CsrfGuard sem o avaliador precisar copiar token na mão.
export const SWAGGER_CSRF_SCRIPT = `(function () {
  var NAMES = ['drivo_csrf', '__Host-drivo_csrf'];
  var SAFE = { GET: true, HEAD: true, OPTIONS: true };

  function readToken() {
    var parts = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < parts.length; i += 1) {
      for (var j = 0; j < NAMES.length; j += 1) {
        if (parts[i].indexOf(NAMES[j] + '=') === 0) {
          return decodeURIComponent(parts[i].slice(NAMES[j].length + 1));
        }
      }
    }
    return null;
  }

  var originalFetch = window.fetch;
  if (!originalFetch) {
    return;
  }

  window.fetch = function (input, init) {
    var token = readToken();
    var method = String(
      (init && init.method) || (input && input.method) || 'GET'
    ).toUpperCase();

    if (token && !SAFE[method]) {
      var headers = new Headers(
        (init && init.headers) ||
          (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
      );
      headers.set('X-CSRF-Token', token);
      init = Object.assign({}, init, { headers: headers });
    }

    return originalFetch.call(this, input, init);
  };
})();`;
