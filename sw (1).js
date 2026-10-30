// Service Worker do Campus Acessível – Classificador de Locais
// Guarda tudo no aparelho na primeira abertura (com internet) e passa a funcionar sem internet.
//
// IMPORTANTE: sempre que você alterar algum arquivo da lista abaixo, troque a VERSAO
// (ex.: "classificador-v2") para os aparelhos baixarem a nova versão.
const VERSAO = "classificador-v1";

const ARQUIVOS = [
    "./classificador.html",
    "./manifest.webmanifest",
    "./icon-192.png",
    "./icon-512.png",
    "./lib/tf.min.js",
    "./lib/teachablemachine-image.min.js",
    "./modelos/andar0/model.json",
    "./modelos/andar0/metadata.json",
    "./modelos/andar0/weights.bin",
    "./modelos/andar1/model.json",
    "./modelos/andar1/metadata.json",
    "./modelos/andar1/weights.bin",
    "./modelos/andar2/model.json",
    "./modelos/andar2/metadata.json",
    "./modelos/andar2/weights.bin"
];

self.addEventListener("install", (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(VERSAO);
        // allSettled: se um arquivo faltar, os outros continuam sendo guardados
        // (a tela do app avisa quais ainda faltam)
        await Promise.allSettled(ARQUIVOS.map(u => cache.add(u)));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (e) => {
    e.waitUntil((async () => {
        for (const chave of await caches.keys()) {
            if (chave !== VERSAO) await caches.delete(chave);
        }
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", (e) => {
    const req = e.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return; // só cuida dos arquivos do próprio site

    e.respondWith((async () => {
        const cache = await caches.open(VERSAO);
        const guardado = await cache.match(req, { ignoreSearch: true });

        if (guardado) {
            // Páginas e manifesto: mostra o guardado e atualiza em segundo plano (se houver internet).
            // Modelos e bibliotecas são grandes e não mudam: não são baixados de novo.
            if (/\.(html|webmanifest)$/.test(url.pathname)) {
                fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); }).catch(() => {});
            }
            return guardado;
        }

        try {
            const res = await fetch(req);
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        } catch (err) {
            if (req.mode === "navigate") {
                const pagina = await cache.match("./classificador.html");
                if (pagina) return pagina;
            }
            return new Response("Sem conexão e arquivo não guardado.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
    })());
});
