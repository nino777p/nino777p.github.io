(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('projet') !== 'salon' || params.get('demande') !== 'devis' || !params.has('composition')) return;
  const references = {
  "osaka-172-95": "Osaka · Deux places · L 172 × P 95 × H 100 cm",
  "osaka-204-95": "Osaka · Trois places · L 204 × P 95 × H 100 cm",
  "osaka-102-159-244": "Osaka · Chaise longue, accoudoir à gauche sur le plan · L 102 × P 159 cm · Modules 244",
  "osaka-102-159-243": "Osaka · Chaise longue, accoudoir à droite sur le plan · L 102 × P 159 cm · Modules 243",
  "emu-216-109": "Emu · Trois places · L 216 × P 109 cm",
  "emu-196-109": "Emu · Deux places · L 196 × P 109 cm",
  "emu-204-109": "Emu · Deux places avec deux relax · L 204 × P 109 cm",
  "emu-234-109": "Emu · Trois places avec deux relax · L 234 × P 109 cm",
  "emu-291-171": "Emu · Trois places avec chaise longue · L 291 × P 171 cm",
  "emu-285-238": "Emu · Angle · L 285 × P 238 cm",
  "emu-295-238": "Emu · Angle avec un relax · L 295 × P 238 cm",
  "emu-80-80": "Emu · Pouf carré · L 80 × P 80 × H 47 cm",
  "gala-292-160": "Gala · Canapé avec chaise longue · L 292 × P 160 cm · Modules 113 + 246",
  "gala-125-105": "Gala · Fauteuil · L 125 × P 105 cm",
  "gala-252-105": "Gala · Canapé deux places · L 252 × P 105 cm · Modules 116 + 117",
  "gala-299-160": "Gala · Trois places avec chaise longue · L 299 × P 160 cm · Modules 102 + 115 + 235",
  "gala-378-277": "Gala · Angle · L 378 × P 277 cm · Modules 116 + 103 + 417 + 139",
  "gala-418-291": "Gala · Grand angle · L 418 × P 291 cm · Modules 114 + 417 + 125 + 113",
  "gala-100-100": "Gala · Pouf carré · L 100 × P 100 × H 42 cm",
  "curry-202-98": "Curry · Trois places, deux grandes assises · L 202 × P 98 × H 92 cm",
  "curry-172-98": "Curry · Deux places · L 172 × P 98 × H 92 cm",
  "curry-109-98": "Curry · Fauteuil · L 109 × P 98 × H 92 cm",
  "zebra-287-238": "Zebra · Angle fixe avec chaise longue · L 287 × P 238 cm",
  "zebra-291-238": "Zebra · Angle avec un relax électrique · L 291 × P 238 cm",
  "zebra-206-110": "Zebra · Trois places fixe · L 206 × P 110 cm",
  "zebra-214-110": "Zebra · Trois places avec deux relax · L 214 × P 110 cm",
  "zebra-186-110": "Zebra · Deux places fixe · L 186 × P 110 cm",
  "zebra-194-110": "Zebra · Deux places avec deux relax · L 194 × P 110 cm",
  "dana-104-93-fixe": "Dana · Fauteuil fixe · L 104 × P 93 × H 74 cm",
  "dana-104-93-pivotant": "Dana · Fauteuil pivotant à 360° · L 104 × P 93 × H 74 cm",
  "dana-90-70": "Dana · Pouf · L 90 × P 70 × H 40 cm",
  "dana-90-58": "Dana · Petit pouf · L 90 × P 58 × H 40 cm",
  "coffee-236-112": "Coffee · Trois places · L 236 × P 112 cm · Modules 308",
  "coffee-216-112": "Coffee · Deux places · L 216 × P 112 cm · Modules 200",
  "coffee-322": "Coffee · Trois places avec chaise longue · L 322 cm · Modules 310 + 243",
  "coffee-316-316": "Coffee · Angle · L 316 × P 316 cm · Modules 310 + 401 + 309",
  "coffee-112-112": "Coffee · Pouf carré · L 112 × P 112 × H 44 cm · Modules 508",
  "tata-370-230": "Tata · Angle arrondi avec relax · L 370 × P 230 cm",
  "tata-305": "Tata · Trois places avec relax et chaise longue · L 305 cm",
  "tata-370-260": "Tata · Angle avec relax et pouf · L 370 × P 260 cm",
  "tata-439-224": "Tata · Grand angle ouvert · L 439 × P 224 cm",
  "kuma-206": "Kuma · Deux places avec deux relax · L 206 cm · Modules 2168 + 2169",
  "kuma-231": "Kuma · Trois places avec deux relax · L 231 cm · Modules 192 + 115 + 193",
  "kuma-227": "Kuma · Deux places et chaise longue · L 227 cm · Modules 102 + 115 + 235",
  "kuma-277": "Kuma · Trois places avec relax et chaise longue · L 277 cm · Modules 2168 + 125 + 245",
  "kuma-362-289": "Kuma · Angle avec deux relax · L 362 × P 289 cm · Modules 2168 + 125 + 125 + 400 + 125 + 2169",
  "nest-242": "Nest · Trois places avec un relax · L 242 cm · Modules 102 + 115 + 3193",
  "nest-287": "Nest · Trois places avec relax et chaise longue · L 287 cm · Modules 3168 + 125 + 245",
  "nest-297-249": "Nest · Angle avec un relax · L 297 × P 249 cm · Modules 3168 + 125 + 400 + 145",
  "willy-172": "Willy · Deux places · L 172 cm · Modules 102 + 101",
  "willy-196": "Willy · Deux places avec deux relax · L 196 cm · Modules 1196 + 1197",
  "willy-232": "Willy · Trois places avec deux relax · L 232 cm · Modules 192 + 115 + 193",
  "willy-268": "Willy · Trois places avec relax et chaise longue · L 268 cm · Modules 196 + 103 + 243",
  "willy-358-286": "Willy · Angle avec relax · L 358 × P 286 cm · Modules 1196 + 103 + 103 + 400 + 103 + 117"
};
  const formulaire = document.querySelector('#visite [data-formulaire]');
  if (!formulaire) return;
  const message = formulaire.elements.namedItem('message');
  const contact = formulaire.elements.namedItem('contact');
  const interet = formulaire.elements.namedItem('interet');
  const selection = new Map();

  for (const article of params.get('composition').split(',')) {
    const detail = /^([a-z0-9-]+)~([1-9]\d*)$/.exec(article);
    if (!detail) continue;
    const [, id, nombre] = detail;
    if (!Object.prototype.hasOwnProperty.call(references, id) || selection.has(id)) continue;
    const quantite = Number(nombre);
    if (Number.isSafeInteger(quantite)) selection.set(id, quantite);
  }
  if (!selection.size || !message || !contact || !interet) return;
  const lignes = Array.from(selection, ([id, nombre]) => nombre + ' × ' + references[id]);
  const recap = 'Demande de devis · Salons Max Divani\n' + lignes.join('\n');
  // La sélection reste dans le devis même si le client réécrit son message libre.
  const champSelection = document.createElement('input');
  champSelection.type = 'hidden';
  champSelection.name = 'selection';
  champSelection.value = lignes.join('\n');
  formulaire.append(champSelection);
  const aideTelephone = document.getElementById('f-tel-aide');
  if (aideTelephone) aideTelephone.textContent = 'Indiquez votre numéro pour que le magasin puisse vous rappeler au sujet de cette composition.';
  contact.dataset.telephoneSi = Array.from(contact.options, option => option.value).join('|');
  // Les valeurs par défaut conservent la sélection si le navigateur réinitialise ce formulaire.
  message.defaultValue = recap;
  if (!message.value.trim()) message.value = recap;
  for (const [select, valeur] of [[contact, 'Être rappelé'], [interet, 'Salon et relax']]) {
    const option = Array.from(select.options).find(option => option.value === valeur);
    if (!option) continue;
    option.defaultSelected = true;
    select.value = valeur;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const source = formulaire.elements.namedItem('source');
  const sujet = formulaire.elements.namedItem('_subject');
  if (source) source.value = 'Catalogue · Salons Max Divani à composer';
  if (sujet) sujet.value = 'Demande de devis FONY · Salon Max Divani';
  formulaire.addEventListener('reset', () => setTimeout(() => {
    contact.dispatchEvent(new Event('change', { bubbles: true }));
  }));
})();
