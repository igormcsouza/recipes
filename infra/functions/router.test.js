const test = require("node:test");
const assert = require("node:assert");
const { handler, pickLang } = require("./router.js");

const ev = (uri, { accept, lang } = {}) => ({
  request: {
    uri,
    headers: accept ? { "accept-language": { value: accept } } : {},
    cookies: lang ? { lang: { value: lang } } : {},
  },
});

test("pickLang", () => {
  const cases = [
    ["pt-BR,pt;q=0.9,en;q=0.8", "pt"],
    ["pt-PT", "pt"],
    ["fr-CA,fr;q=0.9", "fr"],
    ["en-US,en;q=0.9,pt;q=0.8", "en"],
    ["de,pt;q=0.5", "pt"],
    ["de,es;q=0.9", "en"],
    ["en;q=0.5,fr;q=0.9", "fr"],
    ["*", "en"],
    ["", "en"],
    [undefined, "en"],
  ];
  for (const [h, want] of cases) assert.strictEqual(pickLang(h), want, String(h));
});

test("/ redirects by cookie, then Accept-Language, then en", () => {
  assert.strictEqual(handler(ev("/", { lang: "fr", accept: "pt-BR" })).headers.location.value, "/fr/");
  assert.strictEqual(handler(ev("/", { lang: "xx", accept: "pt-BR" })).headers.location.value, "/pt/");
  assert.strictEqual(handler(ev("/", { accept: "pt-BR,en;q=0.5" })).headers.location.value, "/pt/");
  assert.strictEqual(handler(ev("/")).headers.location.value, "/en/");
  assert.strictEqual(handler(ev("/index.html")).statusCode, 302);
  assert.strictEqual(handler(ev("/")).headers["cache-control"].value, "no-store");
});

test("directory URLs map to index.html", () => {
  assert.strictEqual(handler(ev("/pt/")).uri, "/pt/index.html");
  assert.strictEqual(handler(ev("/en/recipes/missionary-fricassee/")).uri, "/en/recipes/missionary-fricassee/index.html");
});

test("files pass through, extensionless paths get a trailing slash", () => {
  assert.strictEqual(handler(ev("/pt/rss.xml")).uri, "/pt/rss.xml");
  assert.strictEqual(handler(ev("/_next/static/a.js")).uri, "/_next/static/a.js");
  const r = handler(ev("/pt/receitas/fricasse-missionario"));
  assert.strictEqual(r.statusCode, 301);
  assert.strictEqual(r.headers.location.value, "/pt/receitas/fricasse-missionario/");
});
