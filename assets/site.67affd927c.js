/* 10-menu.js */
/* Menu du téléphone et de la tablette : ouvrir, fermer (bouton, lien, touche Échap).
   (18/11/2026, audit U1) Menu ouvert : le reste de la page est rendu inerte (contenu, pied, barre mobile, bandeau), le
   focus va au premier lien, Tab et Maj+Tab bouclent entre les liens du menu et le bouton « Fermer » ; à la fermeture,
   tout redevient actif et le focus revient au bouton. */
(function () {
  var entete = document.querySelector('.entete'), bouton = document.querySelector('.menu-bouton');
  if (!entete || !bouton) return;
  var texte = bouton.querySelector('.menu-bouton-texte'), nav = document.getElementById('navigation');
  var dehors = ['main', '.pied', '.barre-mobile', '.promo', '.evitement'];
  function focalisables() {
    var l = Array.prototype.filter.call(nav.querySelectorAll('a[href], button:not([disabled])'), function (e) {
      // (19/11/2026, Codex R1) les liens d'un panneau replié sont en visibility:hidden : hors de la boucle
      return e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden';
    });
    l.push(bouton);
    var cat = entete.querySelector('.entete-catalogue:not([hidden])'); if (cat) l.unshift(cat);   // (19/11/2026) bouton Catalogue, visible menu ouvert
    return l;
  }
  function regler(ouvert, rendre) {
    var etait = entete.classList.contains('menu-ouvert');
    entete.classList.toggle('menu-ouvert', ouvert);
    document.documentElement.classList.toggle('menu-ouvert-page', ouvert);
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    if (texte) texte.textContent = ouvert ? 'Fermer' : 'Menu';
    dehors.forEach(function (s) {
      Array.prototype.forEach.call(document.querySelectorAll(s), function (e) {
        if (ouvert) e.setAttribute('inert', ''); else e.removeAttribute('inert');
      });
    });
    if (ouvert && !etait) { var l = focalisables(); if (l.length > 1) l[0].focus(); }
    if (!ouvert && etait && rendre) bouton.focus();
  }
  bouton.addEventListener('click', function () { regler(!entete.classList.contains('menu-ouvert'), true); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a[href]')) regler(false, false); });
  document.addEventListener('keydown', function (e) {
    if (!entete.classList.contains('menu-ouvert')) return;
    if (e.key === 'Escape') { e.preventDefault(); regler(false, true); return; }
    if (e.key !== 'Tab') return;
    var l = focalisables(), i = l.indexOf(document.activeElement);
    if (i < 0) { e.preventDefault(); l[e.shiftKey ? l.length - 1 : 0].focus(); }
    else if (!e.shiftKey && i === l.length - 1) { e.preventDefault(); l[0].focus(); }
    else if (e.shiftKey && i === 0) { e.preventDefault(); l[l.length - 1].focus(); }
    else { e.preventDefault(); l[i + (e.shiftKey ? -1 : 1)].focus(); }
  });
  window.matchMedia('(min-width:1120px)').addEventListener('change', function (m) { if (m.matches) regler(false, false); });
})();

/* 11-catalogue-deroulant.js */
/* Panneau du catalogue (19/11/2026, design/13-catalogue-deroulant.css). Le lien « Catalogue » est remplacé par un bouton
   (aria-expanded) qui ouvre le panneau. Ordinateur : panneau non modal ; survoler, toucher ou parcourir au clavier une pièce
   affiche son contenu ; Échap, un clic ailleurs ou le focus qui sort le referment. Téléphone : plein écran, le reste de la
   page est inerte, Tab boucle dans le panneau, Échap ou le bouton le referment ; une pièce dépliée à la fois, avec un retour
   tactile très léger (Android : 8 ms ; iPhone, Safari 18 et plus : le « tic » d'un interrupteur caché, procédé non standard,
   sans effet s'il disparaît). Jamais au survol, jamais sur ordinateur. */
(function () {
  var entete = document.querySelector('.entete'), panneau = document.getElementById('catalogue-panneau');
  var lien = entete && entete.querySelector('a.entete-catalogue'), bouton = entete && entete.querySelector('.entete-catalogue--bouton');
  if (!panneau || !lien || !bouton) return;
  lien.hidden = true; bouton.hidden = false; entete.classList.add('catalogue-js');
  panneau.inert = true;   // (Codex R1) fermé : hors du parcours clavier et du lecteur d'écran, quoi qu'affiche le CSS
  var large = window.matchMedia('(min-width:1120px)'), tactile = window.matchMedia('(pointer:coarse)');
  var doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pieces = panneau.querySelectorAll('[data-cp]'), menuBouton = entete.querySelector('.menu-bouton');
  var dehors = ['main', '.pied', '.barre-mobile', '.promo', '.evitement'];

  var tic = (function () {
    if (!tactile.matches) return function () {};
    if (navigator.vibrate) return function () { try { navigator.vibrate(8); } catch (e) {} };
    var l = document.createElement('label'), i = document.createElement('input');
    i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
    l.setAttribute('aria-hidden', 'true'); l.className = 'visuellement-cache'; l.appendChild(i);
    document.body.appendChild(l);
    return function () { l.click(); };
  })();

  // photo de fond d'une pièce : son adresse n'est posée que quand la pièce devient active (ordinateur)
  function fond(li) {
    Array.prototype.forEach.call(li.querySelectorAll('.cp-fond [data-srcset], .cp-fond [data-src]'), function (e) {
      if (e.hasAttribute('data-srcset')) { e.setAttribute('srcset', e.getAttribute('data-srcset')); e.removeAttribute('data-srcset'); }
      if (e.hasAttribute('data-src')) { e.setAttribute('src', e.getAttribute('data-src')); e.removeAttribute('data-src'); }
    });
  }
  function activer(li) {
    if (!large.matches || li.classList.contains('actif')) return;
    Array.prototype.forEach.call(pieces, function (p) { p.classList.toggle('actif', p === li); });
    fond(li);
  }
  function ouvert() { return entete.classList.contains('catalogue-ouvert'); }
  function regler(o, rendre) {
    if (o === ouvert()) return;
    if (o && entete.classList.contains('menu-ouvert') && menuBouton) menuBouton.click();   // un seul plein écran à la fois
    panneau.inert = !o;
    entete.classList.toggle('catalogue-ouvert', o);
    bouton.setAttribute('aria-expanded', o ? 'true' : 'false');
    var modal = !large.matches;
    document.documentElement.classList.toggle('catalogue-ouvert-page', o && modal);
    dehors.forEach(function (s) {
      Array.prototype.forEach.call(document.querySelectorAll(s), function (e) {
        if (o && modal) e.setAttribute('inert', ''); else e.removeAttribute('inert');
      });
    });
    if (o) {
      var actif = panneau.querySelector('.cp-piece.actif') || pieces[0];
      if (large.matches) fond(actif);
      if (modal) { var l = focalisables(); if (l.length > 1) l[1].focus(); }
    } else {
      Array.prototype.forEach.call(pieces, function (p) { deplier(p, false); });
      if (rendre) bouton.focus();
    }
  }
  function focalisables() {
    var l = Array.prototype.filter.call(panneau.querySelectorAll('a[href], button:not([disabled])'), function (e) {
      return e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden';
    });
    l.unshift(bouton);
    return l;
  }
  function deplier(li, d) {
    var b = li.querySelector('.cp-bouton');
    li.classList.toggle('deplie', d);
    if (b) b.setAttribute('aria-expanded', d ? 'true' : 'false');
  }

  bouton.addEventListener('click', function () { regler(!ouvert(), true); });
  if (menuBouton) menuBouton.addEventListener('click', function () { if (ouvert()) regler(false, false); }, true);
  Array.prototype.forEach.call(pieces, function (li) {
    li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activer(li); });
    li.addEventListener('focusin', function () { if (!li._doigt) activer(li); });   // au doigt, c'est le toucher qui décide (ci-dessous)
    var nom = li.querySelector('.cp-nom');
    // ordinateur tactile (tablette large) : un premier toucher sur une pièce montre son contenu, le second ouvre sa page
    nom.addEventListener('pointerdown', function (e) { li._doigt = e.pointerType !== 'mouse'; });
    nom.addEventListener('click', function (e) {
      var doigt = li._doigt; li._doigt = false;
      if (large.matches && doigt && !li.classList.contains('actif')) { e.preventDefault(); activer(li); }
    });
    var b = li.querySelector('.cp-bouton');
    if (b) b.addEventListener('click', function () {
      var d = !li.classList.contains('deplie');
      if (d) Array.prototype.forEach.call(pieces, function (p) { if (p !== li) deplier(p, false); });   // une seule pièce dépliée
      deplier(li, d); tic();
    });
  });
  // lueur légère qui suit la souris dans le panneau (ordinateur, sans mouvement réduit)
  var int = panneau.querySelector('.cp-int'), att = 0;
  if (int && doux) int.addEventListener('pointermove', function (e) {
    if (att || e.pointerType !== 'mouse') return;
    att = requestAnimationFrame(function () {
      att = 0; var r = int.getBoundingClientRect();
      int.style.setProperty('--mx', (e.clientX - r.left) + 'px'); int.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (!ouvert()) return;
    if (e.key === 'Escape') { e.preventDefault(); regler(false, true); return; }
    if (e.key !== 'Tab') return;
    var l = focalisables(), i = l.indexOf(document.activeElement);
    if (large.matches) {
      // ordinateur : le panneau est placé après « Mon projet » dans la page ; au clavier, il suit directement le bouton
      var suite = entete.querySelector('.entete-actions .bouton');
      if (i === 0 && !e.shiftKey && l.length > 1) { e.preventDefault(); l[1].focus(); }
      else if (i === 1 && e.shiftKey) { e.preventDefault(); bouton.focus(); }
      else if (i === l.length - 1 && !e.shiftKey && suite) { e.preventDefault(); suite.focus(); }
      else if (document.activeElement === suite && e.shiftKey) { e.preventDefault(); l[l.length - 1].focus(); }
      return;
    }
    e.preventDefault();                                              // téléphone : Tab boucle dans le panneau
    if (i < 0) l[e.shiftKey ? l.length - 1 : 0].focus();
    else l[(i + (e.shiftKey ? -1 : 1) + l.length) % l.length].focus();
  });
  document.addEventListener('click', function (e) {
    if (ouvert() && large.matches && !panneau.contains(e.target) && !bouton.contains(e.target)) regler(false, false);
  });
  entete.addEventListener('focusout', function (e) {
    if (ouvert() && large.matches && e.relatedTarget && !panneau.contains(e.relatedTarget) && e.relatedTarget !== bouton) regler(false, false);
  });
  panneau.addEventListener('click', function (e) { if (!e.defaultPrevented && e.target.closest('a[href]')) regler(false, false); });
  large.addEventListener('change', function () { regler(false, false); });
})();

/* 20-apparition.js */
/* Glissement discret des blocs qui arrivent par le bas de l'écran (rien pour qui préfère moins d'animations).
   (20/11/2026, nino : le site « met du temps à charger ») Avant, les blocs sous la ligne de flottaison étaient masqués
   (opacité 0) puis révélés après leur entrée à l'écran ; mesuré sur téléphone 390 px : retard de 0,15 à 0,45 s, et un
   bloc arrêté dans la bande basse (marge de −8 %) restait invisible. Maintenant RIEN n'est masqué, jamais : le bloc est
   à sa place et lisible sans script. Le script ajoute seulement « vient » (design/90-mouvement.css : 10 px de montée,
   sans toucher à l'opacité) au moment où le bloc arrive au bord bas de l'écran, puis retire la classe. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var blocs = document.querySelectorAll('main .tete-section, main .tuile, main .point, main .fabricant-logo, main .echantillon,'
    + ' main .assemblage-carte, main .visite-carte, main .visite-texte, main .echantillons-texte, main .moment, main .etape'
    // 17/11/2026 : page salon (espace salon) : titres des défilés, textes des grandes photos, cartes, positions
    // (19/11/2026) les cartes des rangées à glisser ne sont pas suivies : leur décalage rendait la rangée défilable en
    // hauteur (design/48-defile.css).
    + ', main.ambiance-salon .defile-tete, main.ambiance-salon .immersion-texte, main.ambiance-salon .position');
  var suivis = [];
  for (var i = 0; i < blocs.length; i++) if (blocs[i].getBoundingClientRect().top > window.innerHeight) suivis.push(blocs[i]);
  if (!suivis.length) return;
  function fini(e) { if (e.target === this) { this.classList.remove('vient'); this.removeEventListener('animationend', fini); } }
  var o = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      o.unobserve(e.target);
      // Seulement si le bloc arrive par le bas et dépasse à peine (moins de 32 px) : un bloc déjà lisible ne bouge pas
      // (saut vers une ancre, retour en arrière, défilement très rapide, remontée de la page).
      if (e.boundingClientRect.top < window.innerHeight - 32) return;
      e.target.addEventListener('animationend', fini);
      e.target.classList.add('vient');
    });
  }, { rootMargin: '0px 0px 24px 0px' });
  suivis.forEach(function (b) { o.observe(b); });
})();

/* 30-operations.js */
/* Opérations : le bandeau et la fenêtre sont commandés par campagne.txt, que nino modifie lui-même dans GitHub.
   Un fichier absent ou mal rempli n'affiche rien ; passé la date de fin, tout s'éteint seul. */
(function () {
  var P = document.getElementById('promo'), M = document.getElementById('fenetre');
  if (!P && !M) return;
  function txt(el, s) { if (el) el.textContent = s || ''; }
  function cle(s) { return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  function oui(v) { return ['oui', 'o', 'yes', 'true', '1'].indexOf(cle(v || 'non')) >= 0; }
  // un lien venu du fichier ne peut être qu'une page du site (chemin relatif sans schéma) ou une adresse https
  function lien(v) {
    v = (v || '').trim(); if (!v) return '';
    if (/^https:\/\//i.test(v)) return v;
    if (/^[a-z0-9][a-z0-9._\/#?=&-]*$/i.test(v) && v.indexOf(':') < 0 && v.indexOf('//') < 0) return v.replace(/\.html(?=$|#)/, '');
    return '';
  }

  function fenetre() {
    if (!M || M.hidden) return;
    var repos = parseInt(M.dataset.repos || '7', 10), delai = parseInt(M.dataset.delai || '25', 10) * 1000, vu = 0, pret = false, moitie = false, rendre = null;
    try { vu = parseInt(localStorage.getItem('fony-pop') || '0', 10) || 0; } catch (e) {}
    if (Date.now() - vu < repos * 86400000) return;
    function ouvrir() {
      if (!pret || !moitie || M.classList.contains('ouverte')) return;
      rendre = document.activeElement; M.classList.add('ouverte');
      var b = M.querySelector('.fenetre-fermer'); if (b) b.focus();
      try { localStorage.setItem('fony-pop', String(Date.now())); } catch (e) {}
    }
    function fermer() { M.classList.remove('ouverte'); M.hidden = true; if (rendre && rendre.focus) rendre.focus(); }
    setTimeout(function () { pret = true; ouvrir(); }, delai);
    function lu() {
      var h = document.documentElement;
      if ((h.scrollTop + window.innerHeight) / h.scrollHeight > 0.5) { moitie = true; ouvrir(); window.removeEventListener('scroll', lu); }
    }
    window.addEventListener('scroll', lu, { passive: true }); lu();
    M.addEventListener('click', function (e) { if (e.target.closest('[data-fermer]')) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && M.classList.contains('ouverte')) fermer(); });
    M.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = M.querySelectorAll('button,a[href]'); if (!f.length) return;
      var p = f[0], d = f[f.length - 1];
      if (e.shiftKey && document.activeElement === p) { d.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === d) { p.focus(); e.preventDefault(); }
    });
  }

  fetch('campagne.txt', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (t) {
    if (!t) return;
    var c = {};
    t.split('\n').forEach(function (l) {
      l = l.trim(); if (!l || l.charAt(0) === '#') return;
      var i = l.indexOf(':'); if (i < 0) return;
      c[cle(l.slice(0, i))] = l.slice(i + 1).trim();
    });
    var fini = false;
    if (c.fin) { var d = new Date(c.fin); if (!isNaN(d) && d < new Date(new Date().toDateString())) fini = true; }
    if (P) {
      var on = !fini && oui(c.bandeau_actif);
      if (on) {
        txt(P.querySelector('.long'), c.bandeau_texte);
        txt(P.querySelector('.court'), c.bandeau_texte_court || c.bandeau_texte);
        var a = P.querySelector('a');
        if (a) { a.textContent = c.bandeau_libelle || "Voir l'offre"; var lb = lien(c.bandeau_lien); if (lb) a.setAttribute('href', lb); }
      }
      P.hidden = !on;
    }
    if (M) {
      var onm = !fini && oui(c.popup_actif);
      if (onm) {
        txt(M.querySelector('.titre-carte'), c.popup_titre);
        txt(M.querySelector('.texte'), c.popup_texte);
        var b = M.querySelector('.fenetre-boite a');
        if (b) { b.textContent = c.popup_bouton || 'En savoir plus'; var lp = lien(c.popup_lien); if (lp) b.setAttribute('href', lp); }
        if (c.popup_delai) M.dataset.delai = c.popup_delai;
        if (c.popup_repos) M.dataset.repos = c.popup_repos;
      }
      M.hidden = !onm;
    }
  }).catch(function () {}).then(fenetre);
})();

/* 40-service.js */
/* Cache des images et des polices (sw.js) : les pages et campagne.txt passent toujours par le réseau. */
if ('serviceWorker' in navigator) addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });

/* 45-aujourdhui.js */
/* Horaires (bloc « pratique », 19/11/2026) : souligne la ligne du jour, à l'heure de Bruxelles. Aucune promesse d'ouverture
   (jours fériés, fermetures exceptionnelles) : seulement « aujourd'hui ». Sans script ou sans Intl : rien ne change. */
(function () {
  var lignes = document.querySelectorAll('[data-horaires] [data-jours]'); if (!lignes.length) return;
  var jour; try { jour = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Europe/Brussels' }).format(new Date()); } catch (e) { return; }
  Array.prototype.forEach.call(lignes, function (l) {
    if ((' ' + l.getAttribute('data-jours') + ' ').indexOf(' ' + jour + ' ') < 0) return;
    l.classList.add('aujourdhui');
    var dt = l.querySelector('dt'), m = document.createElement('span');
    m.className = 'pratique-auj'; m.textContent = 'aujourd’hui'; dt.appendChild(m);
  });
})();

/* 50-fondu.js */
/* Ouverture : fondu lent entre les photos (rien pour qui préfère moins d'animations, rien avec une seule photo).
   (18/11/2026, audit P1) Seule la première photo est chargée d'emblée (eager, fetchpriority="high") ; les suivantes
   arrivent sans adresse (data-src, data-srcset, outils/fabriquer.py, genre « ouverture-suite ») et ne sont demandées
   qu'une fois la première affichée. Sans fondu (mouvement réduit) ou sans script, elles ne sont jamais chargées.
   (18/11/2026, audit U10) Le fondu fait un seul tour puis s'arrête : rien ne bouge indéfiniment à côté du texte.
   (18/11/2026, contre-vérification Codex, WCAG 2.2.2) Un tour dure plus de 5 s (19,5 s sur l'accueil) : un bouton
   « Mettre en pause » / « Reprendre » permet de l'arrêter. Il est créé par le script (sans script, rien ne bouge, donc
   pas de bouton), placé avant le titre dans l'ordre du clavier, et retiré quand le tour est fini (sauf s'il a le focus :
   il disparaît alors dès que le focus le quitte). */
(function () {
  var b = document.querySelector('[data-fondu]'); if (!b) return;
  var p = b.querySelectorAll('.ouverture-photo'); if (p.length < 2) return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var i = 0, tours = 0, minuterie = null, fini = false, pret = false, enPause = false, bouton = document.createElement('button');
  bouton.type = 'button'; bouton.className = 'ouverture-pause'; bouton.textContent = 'Mettre en pause';
  bouton.setAttribute('aria-label', 'Mettre en pause les photos');
  // (19/11/2026, vérification adverse) placé à côté du calque des photos et non dedans : ce calque bouge avec la parallaxe
  // (transform), qui enfermait le bouton sous le texte sur ordinateur (aucun clic possible). Ordre du clavier inchangé.
  b.parentNode.insertBefore(bouton, b.nextSibling);
  function retirer() { if (bouton.parentNode) bouton.parentNode.removeChild(bouton); }
  function demarrer() {
    // un seul tour : chaque photo passe une fois, puis le fondu s'arrête sur la première.
    minuterie = setInterval(function () {
      // (19/11/2026, vérification adverse) on ne passe à la photo suivante que si elle est chargée (réseau lent : sinon un
      // aplat sombre) ; elle réessaie au tour suivant. La photo d'après est demandée dès qu'une photo s'affiche.
      var j = (i + 1) % p.length;
      if (!prete(j)) { poser(j); return; }
      p[i].classList.remove('active'); i = j; p[i].classList.add('active'); poser((i + 1) % p.length);
      if (++tours >= p.length) {
        clearInterval(minuterie); minuterie = null; fini = true;
        if (document.activeElement === bouton) bouton.addEventListener('blur', retirer, { once: true }); else retirer();
      }
    }, 6500);
  }
  bouton.addEventListener('click', function () {
    if (fini) return;
    enPause = !enPause;
    if (enPause) { if (minuterie) { clearInterval(minuterie); minuterie = null; } }
    else if (pret) demarrer();
    bouton.textContent = enPause ? 'Reprendre' : 'Mettre en pause';
    bouton.setAttribute('aria-label', enPause ? 'Reprendre les photos' : 'Mettre en pause les photos');
  });
  // (19/11/2026, vérification adverse : poids sur téléphone) une photo à la fois : la 2e après la 1re, la 3e quand la 2e s'affiche.
  function poser(k) {
    Array.prototype.forEach.call(p[k].querySelectorAll('[data-srcset], [data-src]'), function (e) {
      if (e.hasAttribute('data-srcset')) { e.setAttribute('srcset', e.getAttribute('data-srcset')); e.removeAttribute('data-srcset'); }
      if (e.hasAttribute('data-src')) { e.setAttribute('src', e.getAttribute('data-src')); e.removeAttribute('data-src'); }
    });
  }
  function prete(k) { var im = p[k].querySelector('img'); return !im || (im.complete && im.naturalWidth > 0 && !im.hasAttribute('data-src')); }
  function charger() {
    poser(1);
    // si la personne a déjà mis en pause avant le chargement de la première photo, on ne démarre pas.
    pret = true; if (!enPause) demarrer();
  }
  var premiere = p[0].querySelector('img');
  if (!premiere || (premiere.complete && premiere.naturalWidth)) charger();
  else { premiere.addEventListener('load', charger, { once: true }); premiere.addEventListener('error', charger, { once: true }); }
})();

/* 70-formulaire.js */
/* Formulaires : e-mail ou téléphone au choix ; le téléphone devient obligatoire si l'on demande un rappel ou une visite.
   La pièce est préremplie d'après la page d'origine, et une photo trop lourde est signalée avant l'envoi. */
(function () {
  var fs = document.querySelectorAll('[data-formulaire]');
  Array.prototype.forEach.call(fs, function (f) {
    var mail = f.querySelector('[name=email]'), tel = f.querySelector('[name=tel]'), erreur = f.querySelector('[data-erreur-contact]');
    var choix = f.querySelector('[data-telephone-si]');
    function maj() {
      if (!choix || !tel) return;
      var besoin = choix.getAttribute('data-telephone-si').split('|').indexOf(choix.value) > -1;
      tel.required = besoin;
      var l = f.querySelector('label[for="' + tel.id + '"]'), etoile = l && l.querySelector('.etoile-tel');
      if (l && besoin && !etoile) { etoile = document.createElement('span'); etoile.className = 'etoile-tel'; etoile.setAttribute('aria-hidden', 'true'); etoile.textContent = ' *'; l.appendChild(etoile); }
      else if (etoile && !besoin) etoile.remove();
    }
    if (choix) { choix.addEventListener('change', maj); maj(); }
    // la page d'où l'on vient choisit la pièce (?projet=cuisine…) ; le visiteur peut toujours la changer
    var interet = f.querySelector('select[name=interet]'), projet = null;
    try { projet = new URLSearchParams(location.search).get('projet'); } catch (e) {}
    var pieces = { salon: 'Salon et relax', sejour: 'Séjour', 'salle-a-manger': 'Salle à manger', chambre: 'Chambre et literie',
      'sur-mesure': 'Sur mesure', cuisine: 'Cuisine', complet: 'Projet complet', pro: 'Professionnel' };
    if (interet && pieces[projet]) interet.value = pieces[projet];
    // (14/11/2026) une fiche produit précise le modèle et la demande (?modele=…&demande=essai|devis) : le message est
    // prérempli en clair, le visiteur le voit et peut le changer. Rien n'est ajouté si le message est déjà commencé.
    var message = f.querySelector('textarea[name=message]'), modele = null, demande = null;
    try { var q = new URLSearchParams(location.search); modele = q.get('modele'); demande = q.get('demande'); } catch (e) {}
    if (message && modele && !message.value.trim()) {
      modele = modele.replace(/[^\wÀ-ÿ’' .\-³]/g, '').slice(0, 80);
      message.value = (demande === 'devis' ? 'Je souhaite un devis pour : ' : demande === 'voir' ? 'Je souhaite venir voir : ' : 'Je souhaite venir essayer : ') + modele + '.\n';
    }
    // FormSubmit refuse les envois de plus de 10 Mo : on prévient avant plutôt qu'après
    var photo = f.querySelector('input[type=file]'), erreurPhoto = f.querySelector('[data-erreur-photo]');
    function tropLourde() { return photo && photo.files && photo.files[0] && photo.files[0].size > 10 * 1024 * 1024; }
    // (18/11/2026, audit U3) chaque erreur s'affiche juste sous son champ, reliée par aria-describedby, le champ porte
    // aria-invalid, et le focus va au PREMIER champ en erreur. Le navigateur ne valide plus seul (novalidate, posé ici :
    // sans script, la validation native du navigateur reste en place).
    f.setAttribute('novalidate', '');
    function decrire(c, id, oui) {
      var ids = (c.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== id; });
      if (oui) ids.push(id);
      if (ids.length) c.setAttribute('aria-describedby', ids.join(' ')); else c.removeAttribute('aria-describedby');
    }
    function marquer(c, p, oui) {   // c : le champ ; p : le message (hors du champ, sous lui)
      if (!c || !p) return;
      p.hidden = !oui; decrire(c, p.id, oui);
      // le champ reste « invalide » tant qu'un de ses messages d'erreur est affiché (e-mail mal formé ET coordonnée manquante)
      var reste = (c.getAttribute('aria-describedby') || '').split(' ').some(function (i) { var m = document.getElementById(i); return m && !m.hidden && m.classList.contains('formulaire-erreur'); });
      if (reste) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
    }
    function messageDe(c) {           // message d'un champ obligatoire, créé au besoin juste après son bloc
      var id = c.id + '-erreur', p = document.getElementById(id);
      if (p) return p;
      p = document.createElement('p'); p.className = 'formulaire-erreur champ--large'; p.id = id; p.hidden = true;
      var bloc = c.closest('.champ') || c, aide = document.getElementById(c.id + '-aide');
      var apres = (aide && aide.previousElementSibling === bloc) ? aide : bloc;
      apres.parentNode.insertBefore(p, apres.nextSibling);
      return p;
    }
    function texteErreur(c) {
      if (c.type === 'checkbox') return 'Cochez cette case pour que nous puissions vous recontacter.';
      if (c.name === 'tel' && c.required) return 'Indiquez un téléphone pour être rappelé ou recevoir une visite chez vous.';
      if (c.type === 'email' && c.value.trim()) return 'Cette adresse e-mail semble incomplète (exemple : nom@domaine.be).';
      var l = f.querySelector('label[for="' + c.id + '"]');
      return 'Indiquez ' + (l ? 'votre ' + l.textContent.replace(/\*|\(facultatif\)/g, '').trim().toLowerCase() : 'ce champ') + '.';
    }
    function verifier(c) {          // champ ordinaire : obligatoire vide ou e-mail mal formé
      var faux = !c.checkValidity();
      var p = (faux || document.getElementById(c.id + '-erreur')) ? messageDe(c) : null;
      if (p && faux) p.textContent = texteErreur(c);
      if (p) marquer(c, p, faux);
      return !faux;
    }
    function contactManquant() { return mail && tel && !mail.value.trim() && !tel.value.trim(); }
    function majContact() {
      var manque = contactManquant();
      if (!manque && erreur && !erreur.hidden) { marquer(mail, erreur, false); marquer(tel, erreur, false); }
    }
    var champs = Array.prototype.filter.call(f.querySelectorAll('input, select, textarea'), function (c) {
      return c.type !== 'hidden' && c.type !== 'file' && !c.closest('.formulaire-pot');
    });
    // (18/11/2026) pendant la frappe, un message d'erreur peut seulement DISPARAÎTRE (le champ redevient valable) : il
    // ne change pas de texte à la première lettre. La vérification complète se fait quand on quitte le champ.
    champs.forEach(function (c) {
      var frappe = !(c.type === 'checkbox' || c.tagName === 'SELECT');
      c.addEventListener(frappe ? 'input' : 'change', function () {
        if (c.getAttribute('aria-invalid') === 'true' && (!frappe || c.checkValidity())) verifier(c);
        if (c === mail || c === tel) majContact();
      });
      if (frappe) c.addEventListener('blur', function () {
        if (c.getAttribute('aria-invalid') === 'true' || (c.value.trim() && !c.checkValidity())) verifier(c);
      });
    });
    if (photo) photo.addEventListener('change', function () { marquer(photo, erreurPhoto, tropLourde()); });
    if (choix) choix.addEventListener('change', function () { if (tel && !tel.required && tel.getAttribute('aria-invalid') === 'true') verifier(tel); });
    f.addEventListener('submit', function (e) {
      var enErreur = [];
      champs.forEach(function (c) { if (!verifier(c)) enErreur.push(c); });
      if (contactManquant() && !tel.required) {   // téléphone exigé (rappel, visite) : son propre message suffit
        marquer(mail, erreur, true); marquer(tel, erreur, true);
        if (enErreur.indexOf(mail) < 0) enErreur.push(mail);
      } else if (erreur && mail && tel) { marquer(mail, erreur, false); marquer(tel, erreur, false); }
      if (tropLourde()) { marquer(photo, erreurPhoto, true); enErreur.push(photo); }
      if (enErreur.length) {
        e.preventDefault();
        enErreur.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
        // le champ et son message à l'écran (pas sous la barre du téléphone), puis le focus sans second défilement
        var premier = enErreur[0], ids = (premier.getAttribute('aria-describedby') || '').split(' ');
        var msg = ids.map(function (i) { return document.getElementById(i); }).filter(function (m) { return m && !m.hidden && m.classList.contains('formulaire-erreur'); })[0];
        (msg || premier).scrollIntoView({ block: 'center' });
        premier.focus({ preventScroll: true });
      }
    });
  });
})();

/* 80-onglets.js */
/* Onglets : un volet visible à la fois ; flèches, Début et Fin au clavier ; l'adresse suit le volet (#bureaux…).
   Un lien « data-secteur » préremplit le choix du formulaire. Sans script : tous les volets restent affichés.
   Un élément « data-vers="n" » dans le bloc (couche d'un schéma) choisit le volet n et reçoit la classe « actif ». */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('[data-onglets]'), function (bloc) {
    var liste = bloc.querySelector('[role=tablist]'); if (!liste) return;
    var onglets = Array.prototype.slice.call(liste.querySelectorAll('[role=tab]'));
    var volets = onglets.map(function (o) { return document.getElementById(o.getAttribute('aria-controls')); });
    liste.hidden = false; bloc.classList.add('onglets--actifs');
    volets.forEach(function (v, i) { v.setAttribute('role', 'tabpanel'); v.setAttribute('aria-labelledby', onglets[i].id); v.setAttribute('tabindex', '-1'); });
    function choisir(i, focus, adresse) {
      onglets.forEach(function (o, j) {
        var actif = i === j;
        o.setAttribute('aria-selected', actif ? 'true' : 'false'); o.tabIndex = actif ? 0 : -1;
        volets[j].hidden = !actif;
      });
      Array.prototype.forEach.call(bloc.querySelectorAll('[data-vers]'), function (e) { e.classList.toggle('actif', +e.getAttribute('data-vers') === i); });
      if (focus) onglets[i].focus();
      if (adresse && history.replaceState) history.replaceState(null, '', '#' + volets[i].id);
    }
    onglets.forEach(function (o, i) {
      o.addEventListener('click', function () { choisir(i, false, true); });
      o.addEventListener('keydown', function (e) {
        var n = onglets.length, k = e.key, c = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') c = (i + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') c = (i - 1 + n) % n;
        else if (k === 'Home') c = 0; else if (k === 'End') c = n - 1;
        if (c !== null) { e.preventDefault(); choisir(c, true, true); }
      });
    });
    Array.prototype.forEach.call(bloc.querySelectorAll('[data-vers]'), function (e) { e.addEventListener('click', function () { choisir(+e.getAttribute('data-vers'), false, true); }); });
    function indice() {
      var id = decodeURIComponent(location.hash.slice(1)), i = -1;
      volets.forEach(function (v, j) { if (v.id === id) i = j; });
      return i;
    }
    var depart = indice(); choisir(depart > -1 ? depart : 0, false, false);
    if (depart > -1) bloc.scrollIntoView();
    window.addEventListener('hashchange', function () { var i = indice(); if (i > -1) { choisir(i, false, false); bloc.scrollIntoView(); } });
  });
  /* Variantes d'un schéma : des boutons changent l'image (assise sur sangles / sur ressorts ensachés). Sans script, la première reste. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-variantes]'), function (g) {
    var img = g.parentNode.querySelector('.coupe-rendu img'), bs = Array.prototype.slice.call(g.querySelectorAll('button')); if (!img) return;
    g.hidden = false;
    bs.forEach(function (b) { b.addEventListener('click', function () {
      bs.forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      img.src = b.getAttribute('data-image');
    }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-secteur]'), function (a) {
    a.addEventListener('click', function () {
      var cible = document.querySelector(a.getAttribute('href')), choix = cible && cible.querySelector('select[name=secteur]');
      if (choix) { choix.value = a.getAttribute('data-secteur'); choix.dispatchEvent(new Event('change')); }
    });
  });
})();

/* 84-video-projet.js */
/* Vidéos des réalisations (20/11/2026). Le lecteur Instagram n'est créé qu'au clic du visiteur : avant, la page n'envoie
   aucune requête vers Instagram (le cadre n'existe pas). Un seul lecteur à la fois ; si le cadre ne répond pas en
   10 secondes, un message renvoie vers le lien direct. Sans script : le lien « Ouvrir sur Instagram » reste seul. */
(() => {
  let actif;
  for (const mention of document.querySelectorAll('[data-video-mention]')) mention.hidden = false;
  for (const bouton of document.querySelectorAll('[data-video-instagram]')) {
    bouton.hidden = false;
    bouton.addEventListener('click', () => {
      const section = bouton.closest('[data-video-projet]');
      const lecteur = section.querySelector('[data-video-lecteur]');
      const etat = section.querySelector('[data-video-etat]');
      if (actif) {
        clearTimeout(actif.delai);
        actif.lecteur.replaceChildren();
        actif.etat.textContent = '';
        actif.bouton.removeAttribute('aria-pressed');
      }
      const cadre = document.createElement('iframe');
      cadre.title = bouton.dataset.titre + ' — Instagram';
      // Adresse du cadre fourni par Instagram pour les publications et les Reels ; aucun script tiers dans la page FONY.
      cadre.src = bouton.dataset.videoInstagram + 'embed/';
      cadre.allowFullscreen = true;
      const delai = setTimeout(() => {
        if (actif && actif.cadre === cadre) etat.textContent = 'Le lecteur Instagram tarde à répondre : utilisez le lien « Ouvrir sur Instagram ».';
      }, 10000);
      cadre.addEventListener('load', () => {
        clearTimeout(delai);
        if (actif && actif.cadre === cadre) etat.textContent = '';
      }, { once: true });
      actif = { lecteur, etat, cadre, bouton, delai };
      bouton.setAttribute('aria-pressed', 'true');
      etat.textContent = 'Chargement du lecteur Instagram…';
      lecteur.replaceChildren(cadre);
      lecteur.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }
})();

/* 85-repli.js */
/* Sections repliées : un lien ou une adresse (#methode…) qui vise une section repliée l'ouvre avant d'y aller. */
(function () {
  if (!document.querySelector('details.repli')) return;
  function ouvrir() {
    var id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; } if (!id) return;
    var c = document.getElementById(id), d = c && c.closest ? c.closest('details.repli') : null;
    if (d && !d.open) { d.open = true; c.scrollIntoView(); }
  }
  ouvrir(); window.addEventListener('hashchange', ouvrir);
})();
/* Galeries qui défilent sur une ligne (téléphone) : atteignables au clavier, avec un nom pour les lecteurs d'écran. */
(function () {
  function regler() {
    Array.prototype.forEach.call(document.querySelectorAll('.galerie, .sequence-etapes, .modeles'), function (g) {
      if (g.scrollWidth > g.clientWidth + 1) {
        g.tabIndex = 0;
        var t = (g.closest ? g.closest('section') : g.parentNode).querySelector('.titre-section'); g.setAttribute('aria-label', 'Photos' + (t ? ' : ' + t.textContent.trim() : '') + ', à faire défiler');
      } else { g.removeAttribute('tabindex'); g.removeAttribute('aria-label'); }
    });
  }
  regler(); window.addEventListener('resize', regler);
  /* une galerie dans une section repliée n'est mesurable qu'une fois la section ouverte */
  Array.prototype.forEach.call(document.querySelectorAll('details.repli'), function (d) { d.addEventListener('toggle', regler); });
})();

/* 86-sequence.js */
/* Séquence : sur grand écran, l'étape la plus proche du milieu de la fenêtre choisit la vue affichée. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-sequence]'), function (b) {
    var vues = b.querySelectorAll('.sequence-vue'), etapes = b.querySelectorAll('.sequence-etape');
    if (!vues.length || vues.length !== etapes.length) return;
    b.classList.add('sequence--active');
    function choisir(i) {
      for (var k = 0; k < vues.length; k++) { vues[k].classList.toggle('actif', k === i); etapes[k].classList.toggle('actif', k === i); }
    }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) choisir(Array.prototype.indexOf.call(etapes, e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    Array.prototype.forEach.call(etapes, function (e) { o.observe(e); });
  });
})();

/* 87-fiche.js */
/* Fiches produit (17/11/2026, lot 4 du parcours « explorer »).
   1. Retour à la sélection : si l'on arrive d'une autre page du site, le lien du haut ramène à cette page telle qu'on
      l'avait laissée (entrée choisie, position), comme le bouton Retour du navigateur. Sinon il mène à la rubrique.
   2. Photos d'une fiche et modèles d'une marque qui se balaient sur téléphone : deux flèches et un compteur, en plus du geste. */
(function () {
  var lien = document.querySelector('[data-retour]');
  if (lien) {
    var d = '';
    try { d = new URL(document.referrer); } catch (e) { d = null; }
    if (d && d.origin === location.origin && d.pathname !== location.pathname && history.length > 1) {
      var t = lien.querySelector('[data-retour-texte]'); if (t) t.textContent = 'Retour à ma sélection';
      lien.addEventListener('click', function (e) {
        /* clic avec une touche (nouvel onglet, nouvelle fenêtre) ou autre bouton que le principal : on laisse faire le lien */
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); history.back();
      });
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-fleches]'), function (barre) {
    var liste = barre.parentNode.querySelector('.fiche-photos, .modeles'); if (!liste) return;
    var items = liste.children, rang = barre.querySelector('[data-rang]'), bs = barre.querySelectorAll('button');
    function courant() {
      var c = liste.scrollLeft + liste.clientWidth / 2, i, m = 0, best = 1e9;
      for (i = 0; i < items.length; i++) { var x = items[i].offsetLeft + items[i].offsetWidth / 2, e = Math.abs(x - c); if (e < best) { best = e; m = i; } }
      return m;
    }
    function maj() {
      var defile = liste.scrollWidth > liste.clientWidth + 1; barre.hidden = !defile; if (!defile) return;
      var i = courant(); if (rang.textContent !== String(i + 1)) rang.textContent = i + 1;   /* n'annonce que si le numéro change */
      bs[0].disabled = i === 0; bs[1].disabled = i === items.length - 1;
    }
    Array.prototype.forEach.call(bs, function (b) { b.addEventListener('click', function () {
      var i = Math.max(0, Math.min(items.length - 1, courant() + (+b.getAttribute('data-sens'))));
      var doux = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      var x = items[i].offsetLeft - (liste.clientWidth - items[i].offsetWidth) / 2;
      try { liste.scrollTo({ left: x, behavior: doux ? 'smooth' : 'auto' }); } catch (e) { liste.scrollLeft = x; }
      if (!('scrollBehavior' in document.documentElement.style)) liste.scrollLeft = x;
    }); });
    var attente; liste.addEventListener('scroll', function () { clearTimeout(attente); attente = setTimeout(maj, 180); }, { passive: true });
    window.addEventListener('resize', maj); maj();
  });
})();

/* 88-catalogue.js */
/* Catalogue à balayer (cuisine, 18/11/2026) : sur chaque rangée, boutons précédent / suivant (souris), compteur discret,
   barre de position, et flèches du clavier (← → début fin) quand la rangée a le focus. Aucune lecture automatique.
   Sans ce script, la rangée reste une bande à glisser (design/51-catalogue.css). */
(function () {
  var rangees = document.querySelectorAll('[data-catalogue]');
  if (!rangees.length) return;
  /* (19/11/2026, vérification adverse : poids sur téléphone) photos différées (« differe: true », outils/fabriquer.py,
     filtre differer) : leurs adresses ne sont posées qu'à l'approche de la rangée (un écran avant). Sans script : <noscript>. */
  function poser(r) {
    Array.prototype.forEach.call(r.querySelectorAll('.differee [data-srcset], .differee [data-src]'), function (e) {
      if (e.hasAttribute('data-srcset')) { e.setAttribute('srcset', e.getAttribute('data-srcset')); e.removeAttribute('data-srcset'); }
      if (e.hasAttribute('data-src')) { e.setAttribute('src', e.getAttribute('data-src')); e.removeAttribute('data-src'); }
    });
  }
  var attendues = Array.prototype.filter.call(rangees, function (r) { return r.querySelector('.differee'); });
  if (attendues.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { poser(e.target); io.unobserve(e.target); } }); }, { rootMargin: '100% 0px' });
      attendues.forEach(function (r) { io.observe(r); });
    } else attendues.forEach(poser);
  }
  function doux() { return !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  Array.prototype.forEach.call(rangees, function (r) {
    var liste = r.querySelector('.catalogue-liste'), cmd = r.querySelector('[data-commandes]'), barre = r.querySelector('[data-progres]');
    if (!liste) return;
    var items = liste.children, rang = cmd && cmd.querySelector('[data-rang]'), bs = cmd ? cmd.querySelectorAll('button') : [];
    /* 18/11 (relecture) : le compteur visible n'est plus une zone annoncée (il parlait à chaque arrêt du défilement) ;
       une zone cachée annonce la position seulement après un bouton ou une touche. */
    var compte = cmd && cmd.querySelector('.catalogue-compte'), parler = false, annonce = null;
    if (compte) {
      annonce = document.createElement('span'); annonce.className = 'visuellement-cache'; annonce.setAttribute('aria-live', 'polite');
      cmd.appendChild(annonce);
    }
    function debut() { return parseFloat(getComputedStyle(liste).paddingLeft) || 0; }
    function max() { return liste.scrollWidth - liste.clientWidth; }
    /* la photo calée au début de la rangée (celle que l'accrochage vise) */
    function courant() {
      var x = liste.scrollLeft + debut(), i, m = 0, best = 1e9;
      for (i = 0; i < items.length; i++) { var e = Math.abs(items[i].offsetLeft - x); if (e < best) { best = e; m = i; } }
      return m;
    }
    /* compteur : les photos visibles au moins pour moitié, « 1 » sur téléphone, « 1–2 » sur un grand écran.
       18/11 (relecture) : au bout de la rangée, l'ancien compteur affichait la dernière photo alors que la photo calée
       à gauche était l'avant-dernière ; « précédent » semblait alors sauter une photo (13 → 11). */
    function visibles() {
      var g = liste.scrollLeft, d = g + liste.clientWidth, a = -1, z = -1, i;
      for (i = 0; i < items.length; i++) {
        var l = items[i].offsetLeft, w = items[i].offsetWidth, vu = Math.min(d, l + w) - Math.max(g, l);
        if (vu >= w / 2 - 1) { if (a < 0) a = i; z = i; }
      }
      if (a < 0) a = z = courant();
      return [a, z];
    }
    function cible(i) { return Math.min(max(), Math.max(0, items[i].offsetLeft - debut())); }
    function aller(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      var x = cible(i);
      if (Math.abs(x - liste.scrollLeft) < 1) { maj(); return; }
      try { liste.scrollTo({ left: x, behavior: doux() ? 'smooth' : 'auto' }); } catch (e) { liste.scrollLeft = x; }
    }
    /* photo voisine dans un sens : la première dont la position calée est au-delà de la position actuelle.
       18/11 (relecture) : « précédent » depuis la fin sautait une photo (13 → 11), plusieurs photos partageant la butée. */
    function voisine(sens) {
      var x = liste.scrollLeft, i;
      if (sens > 0) { for (i = 0; i < items.length; i++) if (cible(i) > x + 2) return i; return items.length - 1; }
      for (i = items.length - 1; i >= 0; i--) if (cible(i) < x - 2) return i; return 0;
    }
    /* annonce aux lecteurs d'écran seulement après un bouton ou une touche (pas à chaque arrêt du défilement) */
    function annoncer() { parler = true; }
    function maj() {
      var defile = max() > 1;
      if (cmd) cmd.hidden = !defile;
      if (barre) barre.hidden = !defile;
      if (!defile) return;
      var v = visibles(), t = v[0] === v[1] ? String(v[0] + 1) : (v[0] + 1) + '–' + (v[1] + 1);
      if (rang && rang.textContent !== t) rang.textContent = t;
      if (parler && annonce) { parler = false; annonce.textContent = (v[0] === v[1] ? 'Photo ' + (v[0] + 1) : 'Photos ' + (v[0] + 1) + ' à ' + (v[1] + 1)) + ' sur ' + items.length; }
      // (19/11/2026, vérification adverse) aria-disabled plutôt que disabled : un bouton désactivé perdait le focus clavier
      // (renvoyé sur la page) au bout de la rangée.
      if (bs.length === 2) { bs[0].setAttribute('aria-disabled', liste.scrollLeft <= 2 ? 'true' : 'false'); bs[1].setAttribute('aria-disabled', liste.scrollLeft >= max() - 2 ? 'true' : 'false'); }
      if (barre) barre.firstElementChild.style.setProperty('--part', Math.min(1, (liste.scrollLeft + liste.clientWidth) / liste.scrollWidth).toFixed(4));
    }
    Array.prototype.forEach.call(bs, function (b) {
      b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') === 'true') return; annoncer(); aller(voisine(+b.getAttribute('data-sens'))); });
    });
    liste.addEventListener('keydown', function (e) {
      if (e.target !== liste || e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key, i = null;
      if (k === 'ArrowRight') i = voisine(1); else if (k === 'ArrowLeft') i = voisine(-1);
      else if (k === 'Home') i = 0; else if (k === 'End') i = items.length - 1;
      if (i === null) return;
      e.preventDefault(); annoncer(); aller(i);
    });
    // (19/11/2026) une carte reliée à sa fiche qui reçoit le focus est calée entièrement dans la rangée
    liste.addEventListener('focusin', function (e) { if (e.target === liste) return; var li = e.target.closest('.catalogue-vue'); if (li) aller(Array.prototype.indexOf.call(items, li)); });
    var attente, img;
    liste.addEventListener('scroll', function () {
      if (barre && !img) { img = requestAnimationFrame(function () { img = 0; if (barre) barre.firstElementChild.style.setProperty('--part', Math.min(1, (liste.scrollLeft + liste.clientWidth) / liste.scrollWidth).toFixed(4)); }); }
      clearTimeout(attente); attente = setTimeout(maj, 120);
    }, { passive: true });
    window.addEventListener('resize', function () { clearTimeout(attente); attente = setTimeout(maj, 150); });
    maj();
  });
})();

/* 89-espace.js */
/* Espaces (« site dans le site », 17/11/2026) : apparitions lentes, atelier (bascule de vues, repères et couches),
   questionnaire « préparer l'essai ». Sans script, tout reste affiché et lisible. */
(function () {
  var main = document.querySelector('main[class*="ambiance-"]');
  if (!document.querySelector('.es-barre')) return;
  var calme = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (l, f) { Array.prototype.forEach.call(l, f); };

  /* apparitions */
  if (!calme && 'IntersectionObserver' in window && main) {
    main.classList.add('js-espace');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('es-vu'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    each(document.querySelectorAll('.es-apparait'), function (el) { io.observe(el); });
  }

  /* atelier */
  each(document.querySelectorAll('[data-atelier]'), function (at) {
    at.classList.add('js-atelier');
    var blocs = at.querySelectorAll('[data-vue-bloc]');
    function couche(bloc, i) {
      each(bloc.querySelectorAll('.es-point'), function (p) { p.setAttribute('aria-pressed', p.getAttribute('data-couche') == i ? 'true' : 'false'); });
      each(bloc.querySelectorAll('.es-couche'), function (li) {
        var on = li.getAttribute('data-couche') == i;
        li.classList.toggle('est-active', on);
        li.querySelector('h4 button').setAttribute('aria-expanded', on ? 'true' : 'false');
        var corps = li.querySelector('.es-couche-corps');
        if (on) { corps.removeAttribute('inert'); corps.removeAttribute('aria-hidden'); } else { corps.setAttribute('inert', ''); corps.setAttribute('aria-hidden', 'true'); }
      });
    }
    each(blocs, function (bloc) {
      each(bloc.querySelectorAll('.es-point'), function (p) {
        p.hidden = false;
        p.addEventListener('click', function () { couche(bloc, p.getAttribute('data-couche')); });
      });
      each(bloc.querySelectorAll('.es-couche h4 button'), function (b) {
        b.addEventListener('click', function () { couche(bloc, b.closest('.es-couche').getAttribute('data-couche')); });
      });
      couche(bloc, 0);
    });
    var bascule = at.querySelector('[data-bascule]');
    if (!bascule) return;
    bascule.hidden = false;
    function vue(id, adresse) {
      each(bascule.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-vue') === id ? 'true' : 'false'); });
      each(blocs, function (bl) { bl.hidden = bl.getAttribute('data-vue-bloc') !== id; });
      if (adresse && history.replaceState) history.replaceState(null, '', '#' + id);
    }
    each(bascule.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { vue(b.getAttribute('data-vue'), true); });
    });
    var h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = ''; }
    var depart = at.querySelector('[data-vue-bloc="' + h.replace(/[^\w-]/g, '') + '"]');
    vue(depart ? h : blocs[0].getAttribute('data-vue-bloc'), false);
    /* un lien de la page vers une vue (#vue-…) bascule au lieu de sauter */
    each(document.querySelectorAll('a[href*="#"]'), function (a) {
      var cible = a.getAttribute('href').split('#')[1];
      if (cible && at.querySelector('[data-vue-bloc="' + cible.replace(/[^\w-]/g, '') + '"]') && a.pathname === location.pathname) {
        a.addEventListener('click', function () { vue(cible, false); });
      }
    });
  });

  /* questionnaire */
  each(document.querySelectorAll('[data-quiz]'), function (qz) {
    var qs = qz.querySelectorAll('.es-q'), res = qz.querySelector('[data-resume]'), barre = qz.querySelector('.es-progression span');
    if (!qs.length || !res) return;
    qz.classList.add('js-quiz');
    var rep = [];
    function montrer(i) { each(qs, function (q, k) { q.hidden = k !== i; }); }
    each(qs, function (q, i) {
      each(q.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          rep[i] = b.textContent;
          barre.style.width = ((i + 1) / qs.length * 100) + '%';
          if (i + 1 < qs.length) { montrer(i + 1); var s = qs[i + 1].querySelector('button'); if (s) s.focus(); }
          else {
            montrer(-1);
            var ul = res.querySelector('ul'); ul.textContent = '';
            rep.forEach(function (r, k) {
              var li = document.createElement('li'), b2 = document.createElement('strong');
              b2.textContent = qs[k].getAttribute('data-etiquette') + ' : '; li.appendChild(b2); li.appendChild(document.createTextNode(r)); ul.appendChild(li);
            });
            res.hidden = false; res.querySelector('[tabindex]').focus();
          }
        });
      });
    });
    qz.querySelector('[data-recommencer]').addEventListener('click', function () {
      rep = []; res.hidden = true; barre.style.width = '0'; montrer(0); qs[0].querySelector('button').focus();
    });
    montrer(0);
  });
})();

/* 90-mouvement.js */
/* Teinte de page, plans photo et parallaxe d'ouverture liés au défilement (voir design/49-mouvement.css). Un seul
   écouteur de défilement (passif), une mise à jour par image (requestAnimationFrame) : toutes les lectures (position,
   rectangles) d'abord, les écritures ensuite, pour ne jamais forcer un recalcul de style au milieu.
   Sans script : chaque section peint sa teinte, photo fixe. */
(function () {
  var racine = document.documentElement, contenu = document.getElementById('contenu');
  var reduit = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var plans = document.querySelectorAll('[data-plan]');

  // ---- 1. Teinte (nino, 18/11/2026). Chaque enfant de <main> est une zone : sa teinte vient de « teinte: » (YAML,
  // résolue par outils/fabriquer.py dans --teinte-section), sinon c'est le fond de l'ambiance (--fond de <main>).
  // Aucune couleur n'est écrite ici. Le fond suit le milieu de l'écran : entre les centres de deux zones voisines, il
  // glisse de l'une à l'autre en OKLab (espace perceptuel : un fondu régulier, sans gris sale au milieu). Entre une zone
  // claire et une zone sombre, il saute à leur frontière (l'espace vide entre les deux sections), d'un coup, fond et encre
  // dans la même image : aucune couleur intermédiaire où ni l'encre claire ni l'encre foncée n'atteindrait 4,5:1.
  // Le pied de page et ce qui suit la dernière zone gardent la dernière teinte. En remontant, tout revient à l'envers.
  // « Réduire les animations » : chaque zone prend sa teinte d'un coup, sans glissement ni fondu.
  var zones = [], fondus = [];
  function versLineaire(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function versSrgb(v) { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
  function lireCouleur(texte) {
    var m = /^#([0-9a-f]{6})$/i.exec((texte || '').trim());
    if (!m) return null;
    var n = parseInt(m[1], 16), r = versLineaire(n >> 16), g = versLineaire((n >> 8) & 255), b = versLineaire(n & 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var c = { L: 0.2104542553 * l + 0.7936177850 * mm - 0.0040720468 * s,
              a: 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s,
              b: 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s };
    c.sombre = luminance(c) < 0.18;
    return c;
  }
  function versRgbLineaire(c) {
    var l = Math.pow(c.L + 0.3963377774 * c.a + 0.2158037573 * c.b, 3);
    var m = Math.pow(c.L - 0.1055613458 * c.a - 0.0638541728 * c.b, 3);
    var s = Math.pow(c.L - 0.0894841775 * c.a - 1.2914855480 * c.b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  // luminance relative (WCAG) ; sous 0,18, l'encre claire contraste plus que l'encre foncée
  function luminance(c) { var v = versRgbLineaire(c).map(function (x) { return Math.max(0, Math.min(1, x)); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
  function versHex(c) { return '#' + versRgbLineaire(c).map(function (x) { return (256 + versSrgb(x)).toString(16).slice(1); }).join(''); }

  // la section teintée d'un enfant de <main> : lui-même, ou celle qu'il enveloppe (section repliée, <details class="repli">)
  function teintee(el) { return el.classList.contains('teinte') ? el : el.querySelector(':scope > .teinte[data-teinte]'); }
  if (contenu && contenu.querySelector(':scope > .teinte[data-teinte], :scope > .repli > .teinte[data-teinte]')) {
    var parDefaut = lireCouleur(getComputedStyle(contenu).getPropertyValue('--fond'));
    Array.prototype.forEach.call(contenu.children, function (el) {
      if (/^(SCRIPT|TEMPLATE|STYLE|LINK)$/.test(el.tagName)) return;
      if (el.classList.contains('fondu')) { fondus.push({ el: el }); return; }   // bande de fondu : pas une zone, un seuil
      var t = teintee(el);
      // Une section peut porter une suite de teintes, une par élément (« teinte: » d'un modèle, Max Divani, CAHIER.md §3.6) :
      // chaque élément [data-teinte-sous] devient une zone ; la première prend le haut de la section, la dernière son bas.
      var sous = t ? t.querySelectorAll('[data-teinte-sous]') : [];
      if (sous.length) {
        Array.prototype.forEach.call(sous, function (e, k) {
          zones.push({ el: e, t: k ? null : t, bloc: el, premier: k === 0, dernier: k === sous.length - 1,
                       c: lireCouleur(getComputedStyle(e).getPropertyValue('--teinte-section')) });
        });
        return;
      }
      zones.push({ el: el, t: t, c: t ? lireCouleur(getComputedStyle(t).getPropertyValue('--teinte-section')) : parDefaut });
    });
    if (zones.some(function (z) { return !z.c; })) zones = [];   // teinte illisible : on garde le repli sans script
    if (!zones.length) fondus = [];
  }
  var vues = [];     // les zones rendues (hauteur non nulle), dans l'ordre de la page
  var hauteur = window.innerHeight;
  // Une suite de zones sombres entre deux zones claires, plus courte que l'écran, ne fait pas basculer la page : deux
  // bascules en quelques secondes clignoteraient (revue « élégance » du 18/11, surtout en 390). Elle se peint alors
  // elle-même (.teinte-propre, design/49-mouvement.css) et le fond de page glisse d'une zone claire à l'autre.
  function mesurer() {
    var y = window.scrollY;
    hauteur = window.innerHeight;
    zones.forEach(function (z) {
      var r = z.el.getBoundingClientRect(); z.haut = r.top + y; z.bas = r.bottom + y;
      if (z.bloc && z.bas > z.haut) { var rb = z.bloc.getBoundingClientRect(); if (z.premier) z.haut = rb.top + y; if (z.dernier) z.bas = rb.bottom + y; }
    });
    // éléments d'une même section posés côte à côte (grille à deux colonnes en 390) : le premier de la rangée garde la zone
    // Ils forment une « rangée » : sa teinte suit celle du modèle affiché (carrousel horizontal du téléphone, 44-vitrine.css ;
    // relecture Codex du 18/11, R3), voir suivreRangees().
    var rendues = [], propres = [];
    zones.forEach(function (z) {
      z.rangee = null; z.cVue = null;
      if (!(z.bas > z.haut)) return;
      var p = rendues[rendues.length - 1];
      if (p && z.bloc && p.bloc === z.bloc && z.haut < p.bas) { p.bas = Math.max(p.bas, z.bas); (p.rangee = p.rangee || [p]).push(z); return; }
      rendues.push(z);
    });
    rendues.forEach(function (z) { z.centre = (z.haut + z.bas) / 2; });
    for (var i = 0; i < rendues.length; i++) {
      if (!rendues[i].c.sombre) continue;
      var k = i; while (k + 1 < rendues.length && rendues[k + 1].c.sombre) k++;
      if (i > 0 && k + 1 < rendues.length && rendues[k].bas - rendues[i].haut < hauteur) propres = propres.concat(rendues.slice(i, k + 1));
      i = k;
    }
    zones.forEach(function (z) { if (z.t) z.t.classList.toggle('teinte-propre', propres.indexOf(z) >= 0); });
    vues = rendues.filter(function (z) { return propres.indexOf(z) < 0; });
    if (!vues.length) vues = zones.slice(0, 1);
    // Bandes de fondu (design/49-mouvement.css) : la bascule entre deux zones de familles différentes a lieu au milieu de la
    // bande qui les sépare (z.seuil, sur la zone qui suit) ; sans bande, à la frontière des deux zones, comme avant.
    // Les aplats prolongés sous les sections voisines vont jusqu'à 75 % de l'écran, sans dépasser la bande voisine.
    fondus.forEach(function (f) { var r = f.el.getBoundingClientRect(); f.haut = r.top + y; f.bas = r.bottom + y; });
    vues.forEach(function (z, i) {
      z.seuil = null;
      if (!i || vues[i - 1].c.sombre === z.c.sombre) return;
      var A = vues[i - 1];
      fondus.forEach(function (f) { if (f.haut >= A.centre && f.bas <= z.centre) z.seuil = (f.haut + f.bas) / 2; });
      if (z.seuil === null) z.seuil = (A.bas + z.haut) / 2;
    });
    var cap = 0.75 * hauteur;
    fondus.forEach(function (f, j) {
      var avant = j ? fondus[j - 1].bas : 0, apres = j + 1 < fondus.length ? fondus[j + 1].haut : Infinity;
      var h = Math.round(Math.max(0, Math.min(cap, f.haut - avant))) + 'px', b = Math.round(Math.max(0, Math.min(cap, apres - f.bas))) + 'px';
      if (f.h !== h) { f.el.style.setProperty('--fondu-haut', h); f.h = h; }
      if (f.b !== b) { f.el.style.setProperty('--fondu-bas', b); f.b = b; }
    });
  }
  // Rangée défilant à l'horizontale : la teinte suit le modèle au milieu de la rangée, et glisse de l'un à l'autre pendant
  // le glissement du doigt (même règle que le défilement vertical : fondu dans une famille, saut net entre clair et sombre).
  // Rangée sans défilement (deux colonnes) : la teinte du premier. Lecture seule (rectangles), faite avant toute écriture.
  function suivreRangees() {
    vues.forEach(function (z) {
      if (!z.rangee) return;
      var sc = z.el.parentElement;
      if (!sc || sc.scrollWidth <= sc.clientWidth + 1) { z.cVue = null; return; }
      var rs = sc.getBoundingClientRect(), m = rs.left + rs.width / 2;
      var cx = z.rangee.map(function (e) { var r = e.el.getBoundingClientRect(); return r.left + r.width / 2; });
      var n = cx.length, i;
      if (reduit.matches) {
        var k = 0; for (i = 1; i < n; i++) if (Math.abs(cx[i] - m) < Math.abs(cx[k] - m)) k = i;
        z.cVue = z.rangee[k].c; return;
      }
      if (m <= cx[0]) { z.cVue = z.rangee[0].c; return; }
      for (i = 0; i < n - 1 && cx[i + 1] <= m; i++) {}
      if (i === n - 1) { z.cVue = z.rangee[i].c; return; }
      var A = z.rangee[i].c, B = z.rangee[i + 1].c;
      if (A.sombre !== B.sombre) { z.cVue = m < (cx[i] + cx[i + 1]) / 2 ? A : B; return; }
      var t = (m - cx[i]) / (cx[i + 1] - cx[i]); t = t * t * (3 - 2 * t);
      z.cVue = melange(A, B, t);
    });
  }
  function cz(z) { return z.cVue || z.c; }
  function teinteA(m) {
    var zones = vues, n = zones.length, i;
    if (reduit.matches) {          // la zone sous le milieu de l'écran (ou la dernière dépassée)
      for (i = n - 1; i > 0 && (zones[i].seuil !== null ? zones[i].seuil : zones[i].haut) > m; i--) {}
      return cz(zones[i]);
    }
    if (m <= zones[0].centre) return cz(zones[0]);
    for (i = 0; i < n - 1 && zones[i + 1].centre <= m; i++) {}
    if (i === n - 1) return cz(zones[i]);
    var A = zones[i], B = zones[i + 1], cA = cz(A), cB = cz(B);
    if (cA.sombre !== cB.sombre) return m < (B.seuil !== null ? B.seuil : (A.bas + B.haut) / 2) ? cA : cB;
    if (B.centre <= A.centre) return cB;
    var t = (m - A.centre) / (B.centre - A.centre); t = t * t * (3 - 2 * t);
    // (19/11/2026, vérification adverse : défilement moins fluide) 24 paliers par passage d'une teinte à l'autre : la
    // couleur n'est plus réécrite à chaque image (chaque écriture recalcule le style de toute la page) ; l'écart entre deux
    // paliers voisins reste invisible (deux sections voisines ne diffèrent que de 1 à 4 points de luminance OKLab).
    t = Math.round(t * 24) / 24;
    return melange(cA, cB, t);
  }
  function melange(A, B, t) { return { L: A.L + (B.L - A.L) * t, a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t, sombre: A.sombre }; }
  // Passage clair ↔ sombre (relecture Codex du 18/11, R1 ; CAHIER.md §5) : AUCUNE couleur intermédiaire entre les deux
  // familles. teinteA() rend déjà l'une ou l'autre teinte, jamais un mélange, de part et d'autre de la frontière des
  // sections : le fond (--teinte) et l'encre (data-teinte) changent ensemble, dans la même image. Pour cette image-là,
  // .teinte-bascule coupe les transitions de couleur des boutons, liens et cartes (design/49-mouvement.css) : sinon leur
  // texte et leurs bords glisseraient sur .2 s de l'ancienne encre vers la nouvelle, sur un fond déjà changé. Le fondu
  // doux reste entier à l'intérieur d'une même famille (clair → clair, sombre → sombre).
  var hexEnCours = '', sombreEnCours = null, retrait = 0;
  function peindre(y) {
    var c = teinteA(y + hauteur / 2), hex = versHex(c), sombre = luminance(c) < 0.18;
    // Première peinture comprise (relecture Codex du 18/11, R1 bis) : une page ouverte directement en zone sombre passe
    // aussi d'un coup de l'encre foncée par défaut à l'encre claire, sans transition des boutons.
    if (sombre !== sombreEnCours) {
      racine.classList.add('teinte-bascule'); clearTimeout(retrait);
      // retirée un peu plus tard (≈ 8 images) : le style de la bascule est alors calculé sans transition ; la retirer ne change
      // aucune valeur, donc ne relance rien
      retrait = setTimeout(function () { requestAnimationFrame(function () { racine.classList.remove('teinte-bascule'); }); }, 120);
    }
    if (hex !== hexEnCours) { racine.style.setProperty('--teinte', hex); hexEnCours = hex; }
    if (sombre !== sombreEnCours) {
      if (sombre) racine.setAttribute('data-teinte', 'sombre'); else racine.removeAttribute('data-teinte');
      sombreEnCours = sombre;
    }
  }

  // ---- 2. Plans photo (« derive: true ») : --p va de 0 à 1 pendant la traversée de l'écran (design/47-immersion.css).
  function lirePlans() {
    var h = hauteur, valeurs = [];
    Array.prototype.forEach.call(plans, function (pl) {
      var r = pl.getBoundingClientRect();
      if (r.bottom < -h || r.top > 2 * h) return;
      valeurs.push([pl, Math.max(0, Math.min(1, (h - r.top) / (r.height + h))).toFixed(3)]);
    });
    return valeurs;
  }

  // ---- 3. Parallaxe de l'ouverture (ordinateur seulement) : les photos descendent un peu moins vite que la page.
  // Recalculée quand « réduire les animations » ou la largeur change en cours de visite (relecture Codex du 18/11, R2) :
  // désactivée, elle retire sa classe et le décalage déjà posé.
  var ouverture = document.querySelector('.ouverture-photos'), parallaxe = false;
  var large = window.matchMedia ? matchMedia('(min-width: 961px)') : { matches: false };
  function regler() {
    var avant = parallaxe;
    parallaxe = !!ouverture && !reduit.matches && large.matches;
    racine.classList.toggle('parallaxe', parallaxe);
    if (avant && !parallaxe) ouverture.style.transform = '';
  }
  regler();

  if (!zones.length && !plans.length && !ouverture) return;
  var demande = false, aMesurer = true;
  function maj() {
    demande = false;
    // lectures
    if (zones.length && aMesurer) { mesurer(); aMesurer = false; }   // (écrit seulement des classes, avant toute teinte)
    if (zones.length) suivreRangees();
    var y = window.scrollY, valeurs = plans.length && !reduit.matches ? lirePlans() : [];
    // écritures
    if (zones.length) peindre(y);
    valeurs.forEach(function (v) { v[0].style.setProperty('--p', v[1]); });
    if (parallaxe && y < hauteur) ouverture.style.transform = 'translateY(' + (y * 0.28) + 'px)';
  }
  function planifier() { if (!demande) { demande = true; requestAnimationFrame(maj); } }
  function remesurer() { aMesurer = true; planifier(); }
  // capture : reçoit aussi le défilement horizontal des rangées (l'événement « scroll » d'un élément ne remonte pas)
  addEventListener('scroll', planifier, { passive: true, capture: true });
  addEventListener('resize', function () { hauteur = window.innerHeight; regler(); remesurer(); });
  if (reduit.addEventListener) reduit.addEventListener('change', function () { regler(); remesurer(); });
  if (large.addEventListener) large.addEventListener('change', function () { regler(); planifier(); });
  if (zones.length) {
    racine.classList.add('teintes-continues');
    if (fondus.length) racine.classList.add('teintes-fondues');   // l'encre suit chaque section (design/49-mouvement.css)
    if ('ResizeObserver' in window) new ResizeObserver(remesurer).observe(document.body);   // photos chargées, volets ouverts
    addEventListener('load', remesurer);
  }
  maj();
})();
