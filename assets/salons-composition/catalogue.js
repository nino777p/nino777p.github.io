(() => {
  'use strict';
  const catalogue = document.querySelector('#compositions');
  if (!catalogue) return;
  const selection = catalogue.querySelector('#ma-selection');
  const panier = selection.querySelector('.sc-panier');
  const lienDevis = selection.querySelector('.sc-devis');
  const raccourci = catalogue.querySelector('.sc-raccourci');
  const annonce = catalogue.querySelector('#sc-annonce');
  const selectModele = catalogue.querySelector('#sc-modele');
  const cartes = Array.from(catalogue.querySelectorAll('.sc-carte'));
  const catalogueVersions = new Map();
  const lignes = new Map();
  const cleSession = 'fony.salons.compositions.v1';

  function montrerPlan(carte) {
    const option = carte.querySelector('.sc-select-version').selectedOptions[0];
    const dessin = carte.querySelector('.sc-plan img');
    dessin.alt = option.dataset.alt;
    carte.querySelector('.sc-dimensions').textContent = option.dataset.dimensions;
    dessin.src = '/assets/salons-composition/plans/' + option.value + '.svg';
  }

  cartes.forEach(carte => {
    const select = carte.querySelector('.sc-select-version');
    const versions = carte.querySelector('details');
    select.querySelectorAll('option').forEach(option => {
      catalogueVersions.set(option.value, {
        modele: carte.dataset.modele,
        version: option.dataset.version,
        dimensions: option.dataset.dimensions,
      });
    });
    select.addEventListener('change', () => montrerPlan(carte));
    versions.addEventListener('toggle', () => {
      if (versions.open) montrerPlan(carte);
    });
    carte.querySelector('.sc-config').hidden = false;
    carte.querySelector('[data-ajouter]').addEventListener('click', () => {
      const id = select.value;
      const quantite = (lignes.get(id) || 0) + 1;
      if (!Number.isSafeInteger(quantite)) return;
      lignes.set(id, quantite);
      mettreAJour();
      annonce.textContent = carte.dataset.modele + ' ajouté à la sélection. Quantité ' + quantite + '.';
    });
  });

  function dansSession() {
    try { sessionStorage.setItem(cleSession, JSON.stringify(Array.from(lignes))); } catch {}
  }

  function ouvrirModele() {
    const carte = cartes.find(carte => '#' + carte.id === location.hash);
    if (!carte) return;
    carte.querySelector('details').open = true;
    selectModele.value = carte.id;
  }
  selectModele.parentElement.hidden = false;
  selectModele.addEventListener('change', () => {
    if (!selectModele.value) return;
    const carte = document.getElementById(selectModele.value);
    carte.querySelector('details').open = true;
    location.hash = carte.id;
    carte.scrollIntoView({ block: 'start' });
    carte.querySelector('summary').focus({ preventScroll: true });
  });
  addEventListener('hashchange', ouvrirModele);
  ouvrirModele();

  function majLien() {
    const url = new URL('/magasin-contact', location.href);
    url.searchParams.set('projet', 'salon');
    url.searchParams.set('demande', 'devis');
    url.searchParams.set('composition', Array.from(lignes, ([id, n]) => id + '~' + n).join(','));
    url.hash = 'visite';
    lienDevis.href = url.pathname + url.search + url.hash;
    dansSession();
  }

  function creerLigne(id, nombre) {
    const { modele, version, dimensions } = catalogueVersions.get(id);
    const li = document.createElement('li');
    const article = document.createElement('div');
    article.className = 'sc-article';
    const titre = document.createElement('strong');
    titre.textContent = modele + ' · ' + version;
    const cotes = document.createElement('span');
    cotes.textContent = dimensions;
    article.append(titre, cotes);

    const quantite = document.createElement('label');
    quantite.className = 'sc-quantite';
    quantite.textContent = 'Quantité';
    const champ = document.createElement('input');
    champ.type = 'number';
    champ.min = '1';
    champ.step = '1';
    champ.value = nombre;
    champ.setAttribute('aria-label', 'Quantité pour ' + modele + ', ' + version);
    champ.addEventListener('input', () => {
      if (Number.isSafeInteger(champ.valueAsNumber) && champ.valueAsNumber >= 1) {
        lignes.set(id, champ.valueAsNumber);
        majLien();
      }
    });
    champ.addEventListener('change', () => { champ.value = lignes.get(id); });
    quantite.append(champ);
    const retirer = document.createElement('button');
    retirer.type = 'button';
    retirer.className = 'sc-retirer';
    retirer.textContent = 'Retirer';
    retirer.setAttribute('aria-label', 'Retirer ' + modele + ', ' + version);
    retirer.addEventListener('click', () => {
      lignes.delete(id);
      mettreAJour();
      annonce.textContent = modele + ' retiré de la sélection.';
      (lignes.size ? selection.querySelector('h2') : selectModele).focus();
    });
    li.append(article, quantite, retirer);
    return li;
  }

  function mettreAJour() {
    panier.replaceChildren(...Array.from(lignes, ([id, n]) => creerLigne(id, n)));
    selection.hidden = raccourci.hidden = !lignes.size;
    cartes.forEach(carte => { carte.querySelector('.sc-revoir').hidden = !lignes.size; });
    majLien();
  }

  try {
    const stock = JSON.parse(sessionStorage.getItem(cleSession));
    if (Array.isArray(stock)) {
      stock.forEach(entree => {
        if (!Array.isArray(entree)) return;
        const [id, quantite] = entree;
        if (catalogueVersions.has(id) && Number.isSafeInteger(quantite) && quantite > 0) lignes.set(id, quantite);
      });
    }
  } catch {}
  mettreAJour();
})();
