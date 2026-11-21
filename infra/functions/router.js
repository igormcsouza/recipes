// CloudFront Function (viewer-request, runtime cloudfront-js-2.0).
// 1. "/" -> 302 to the reader's language: `lang` cookie first, then Accept-Language, else en.
// 2. "/pt/receitas/x/" -> origin key "/pt/receitas/x/index.html" (S3 has no directory index).
// Mirrors pickLang in lib/i18n.ts; both are covered by tests.
var LANGS = ["pt", "en", "fr"];

function pickLang(header) {
  var ranked = (header || "")
    .split(",")
    .map(function (part, i) {
      var bits = part.trim().split(";");
      var q = 1;
      for (var k = 1; k < bits.length; k++) if (bits[k].trim().indexOf("q=") === 0) q = Number(bits[k].trim().slice(2));
      return { primary: bits[0].toLowerCase().split("-")[0], q: q, i: i };
    })
    .filter(function (x) { return x.primary; })
    .sort(function (a, b) { return b.q - a.q || a.i - b.i; });
  for (var n = 0; n < ranked.length; n++) if (LANGS.indexOf(ranked[n].primary) >= 0) return ranked[n].primary;
  return "en";
}

function handler(event) {
  var req = event.request;
  // Collapse leading slashes: "//evil" must never become a protocol-relative redirect target.
  var uri = req.uri.replace(/^\/{2,}/, "/");

  if (uri === "/" || uri === "/index.html") {
    var saved = req.cookies && req.cookies.lang && req.cookies.lang.value;
    var accept = req.headers["accept-language"] && req.headers["accept-language"].value;
    var lang = LANGS.indexOf(saved) >= 0 ? saved : pickLang(accept);
    return {
      statusCode: 302,
      statusDescription: "Found",
      headers: { location: { value: "/" + lang + "/" }, "cache-control": { value: "no-store" } },
    };
  }

  var last = uri.split("/").pop();
  req.uri = uri;
  if (uri.charAt(uri.length - 1) === "/") req.uri = uri + "index.html";
  else if (last.indexOf(".") < 0)
    return { statusCode: 301, statusDescription: "Moved Permanently", headers: { location: { value: uri + "/" } } };
  return req;
}

if (typeof module !== "undefined") module.exports = { handler: handler, pickLang: pickLang };
