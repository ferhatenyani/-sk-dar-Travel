// Télécharge les photos Pexels (licence libre) et les convertit en WebP
// dans site/public/images/. Outil de build one-shot, conservé pour rejouer.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/images";

const PHOTOS = [
  // [fichier, id pexels, largeur max]
  ["hero", 3889704, 2400],
  ["tr-istanbul", 12776938, 1600],
  ["tr-cappadoce", 3185493, 1600],
  ["tr-pamukkale", 6027880, 1600],
  ["tn-sidi", 29679525, 1600],
  ["tn-douz", 2114984, 1600],
  ["tn-eljem", 3274752, 1600],
  ["eg-pyramides", 35453890, 1600],
  ["eg-louxor", 3214972, 1600],
  ["eg-nil", 1755390, 1600],
  ["my-petronas", 13029916, 1600],
  ["my-batu", 3731615, 1600],
  ["my-mosquee", 326716, 1600],
  ["dz-constantine", 15404649, 1600],
  ["dz-gorges", 33630736, 1600],
  ["dz-alger", 1281669, 1600],
  ["dz-casbah", 13682900, 1600],
  ["sv-organises", 6181059, 1600],
  ["sv-sur-mesure", 346885, 1600],
  ["sv-hotellerie", 338504, 1600],
  ["sv-billetterie", 37644602, 1600],
  ["sv-transferts", 20993514, 1600],
  ["sv-assurance", 1128318, 1600],
  ["about-1", 2325447, 1600],
  ["about-2", 11092342, 1600],
];

mkdirSync(OUT, { recursive: true });

for (const [name, id, width] of PHOTOS) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.error(`✗ ${name} (${id}) : HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20_000) {
    console.error(`✗ ${name} (${id}) : fichier trop petit (${buf.length} o)`);
    continue;
  }
  await sharp(buf).webp({ quality: 80 }).toFile(`${OUT}/${name}.webp`);
  console.log(`✓ ${name}.webp (${Math.round(buf.length / 1024)} ko source)`);
}

writeFileSync(
  `${OUT}/CREDITS.md`,
  `# Crédits photos (banque gratuite Pexels — licence Pexels, usage commercial OK)\n\n` +
    PHOTOS.map(([name, id]) => `- ${name}.webp — https://www.pexels.com/photo/${id}/`).join("\n") +
    "\n",
);
console.log("terminé");
