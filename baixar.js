// Baixa as bibliotecas e os 3 modelos para a pasta do projeto, para o app funcionar SEM internet.
//
// Como usar (uma única vez, no computador, com internet):
//   1. Instale o Node.js (versão 18 ou mais nova): https://nodejs.org
//   2. Abra o terminal DENTRO da pasta onde estão classificador.html, sw.js e este arquivo
//   3. Rode:  node baixar.js
//
// Vão aparecer as pastas  lib/  e  modelos/andar0, andar1, andar2.
// Depois, envie tudo para o GitHub (mantendo as pastas).

const fs = require("fs");
const path = require("path");

// Os mesmos modelos do Teachable Machine usados no app
const MODELOS = { 0: "gPTMKh0iV", 1: "m8i3tW5uf", 2: "N6xHCcS5t" };

const BIBLIOTECAS = [
    ["lib/tf.min.js", "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"],
    ["lib/teachablemachine-image.min.js", "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js"]
];

async function baixar(url, destino) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buf);
    console.log(`ok  ${destino}  (${(buf.length / 1024).toFixed(0)} KB)`);
    return buf;
}

(async () => {
    for (const [destino, url] of BIBLIOTECAS) await baixar(url, destino);

    for (const [andar, id] of Object.entries(MODELOS)) {
        const base = `https://teachablemachine.withgoogle.com/models/${id}/`;
        const pasta = `modelos/andar${andar}/`;

        const modelJson = await baixar(base + "model.json", pasta + "model.json");
        await baixar(base + "metadata.json", pasta + "metadata.json");

        // O model.json diz quais arquivos de pesos existem (normalmente só weights.bin)
        const manifesto = JSON.parse(modelJson.toString("utf8")).weightsManifest || [];
        for (const grupo of manifesto) {
            for (const arquivo of grupo.paths) await baixar(base + arquivo, pasta + arquivo);
        }
    }
    console.log("\nPronto! Agora envie tudo (inclusive as pastas lib e modelos) para o GitHub.");
})().catch((e) => {
    console.error("\nERRO:", e.message);
    process.exit(1);
});
