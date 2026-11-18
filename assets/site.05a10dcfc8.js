/* 10-menu.js */
/* Menu du téléphone et de la tablette : ouvrir, fermer (bouton, lien, touche Échap). */
(function () {
  var entete = document.querySelector('.entete'), bouton = document.querySelector('.menu-bouton');
  if (!entete || !bouton) return;
  var texte = bouton.querySelector('.menu-bouton-texte');
  function regler(ouvert) {
    entete.classList.toggle('menu-ouvert', ouvert);
    document.documentElement.classList.toggle('menu-ouvert-page', ouvert);
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    if (texte) texte.textContent = ouvert ? 'Fermer' : 'Menu';
  }
  bouton.addEventListener('click', function () { regler(!entete.classList.contains('menu-ouvert')); });
  document.getElementById('navigation').addEventListener('click', function (e) { if (e.target.closest('a[href]')) regler(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && entete.classList.contains('menu-ouvert')) { regler(false); bouton.focus(); }
  });
  window.matchMedia('(min-width:1120px)').addEventListener('change', function (m) { if (m.matches) regler(false); });
})();

/* 20-apparition.js */
/* Apparition discrète des blocs situés sous la ligne de flottaison (rien pour qui préfère moins d'animations). */
(function () {
  if (!('IntersectionObserver' in window)) return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var blocs = document.querySelectorAll('main .tete-section, main .tuile, main .point, main .fabricant-logo, main .echantillon,'
    + ' main .assemblage-carte, main .visite-carte, main .visite-texte, main .echantillons-texte, main .moment, main .etape'
    // 17/11/2026 : page salon (espace salon) : titres des défilés, textes des grandes photos, cartes, positions
    + ', main.ambiance-salon .defile-tete, main.ambiance-salon .immersion-texte, main.ambiance-salon .defile-carte,'
    + ' main.ambiance-salon .defile-vue, main.ambiance-salon .position');
  var bas = window.innerHeight * 0.92, suivis = [];
  for (var i = 0; i < blocs.length; i++) if (blocs[i].getBoundingClientRect().top > bas) suivis.push(blocs[i]);
  if (!suivis.length) return;
  document.documentElement.classList.add('apparition');
  var o = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); o.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  suivis.forEach(function (b) { b.classList.add('vient'); o.observe(b); });
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

/* 50-fondu.js */
/* Ouverture : fondu lent entre les photos (rien pour qui préfère moins d'animations, rien avec une seule photo). */
(function () {
  var b = document.querySelector('[data-fondu]'); if (!b) return;
  var p = b.querySelectorAll('.ouverture-photo'); if (p.length < 2) return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var i = 0;
  setInterval(function () { p[i].classList.remove('active'); i = (i + 1) % p.length; p[i].classList.add('active'); }, 6500);
})();

/* 60-parallaxe.js */
/* Ouverture : les photos descendent un peu moins vite que la page (profondeur légère ; ordinateur seulement). */
(function () {
  var o = document.querySelector('.ouverture-photos'); if (!o) return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(min-width: 961px)').matches) return; } catch (e) { return; }
  document.documentElement.classList.add('parallaxe');
  var t = false;
  function maj() { var y = window.scrollY; if (y < window.innerHeight) o.style.transform = 'translateY(' + (y * 0.28) + 'px)'; t = false; }
  window.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(maj); } }, { passive: true });
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
    if (photo) photo.addEventListener('change', function () { if (erreurPhoto) erreurPhoto.hidden = !tropLourde(); });
    // (15/11/2026) le message « e-mail ou téléphone » disparaît dès qu'une coordonnée est saisie
    [mail, tel].forEach(function (c) { if (c) c.addEventListener('input', function () { if (erreur && ((mail && mail.value.trim()) || (tel && tel.value.trim()))) erreur.hidden = true; }); });
    f.addEventListener('submit', function (e) {
      if (mail && tel && !mail.value.trim() && !tel.value.trim()) {
        e.preventDefault(); if (erreur) erreur.hidden = false; (mail || tel).focus();
      } else if (tropLourde()) {
        e.preventDefault(); if (erreurPhoto) erreurPhoto.hidden = false; photo.focus();
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
/* Teinte de page et plans photo liés au défilement (voir design/49-mouvement.css). Sans script : page claire, photo fixe. */
(function () {
  var racine = document.documentElement;
  var teintes = document.querySelectorAll('[data-teinte]');
  if (teintes.length && 'IntersectionObserver' in window) {
    // 17/11/2026 : le pied de page est une zone neutre. Quand il arrive au centre de l'écran, la teinte en cours est
    // gardée (plus d'éclair clair entre la dernière section sombre et le pied) ; elle ne part que si une section non
    // teintée passe au centre (en remontant).
    var pied = document.querySelector('.pied');
    var actives = new Set(), piedAuCentre = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target === pied) { piedAuCentre = e.isIntersecting; return; }
        if (e.isIntersecting) actives.add(e.target); else actives.delete(e.target);
      });
      var t = null; actives.forEach(function (el) { t = el.getAttribute('data-teinte'); });
      if (t) racine.setAttribute('data-teinte', t);
      else if (!piedAuCentre) racine.removeAttribute('data-teinte');
    }, { rootMargin: '-45% 0px -45% 0px' });
    Array.prototype.forEach.call(teintes, function (el) { io.observe(el); });
    if (pied) io.observe(pied);
  }
  var plans = document.querySelectorAll('[data-plan]');
  if (!plans.length || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var demande = false;
  function maj() {
    demande = false;
    var h = window.innerHeight;
    Array.prototype.forEach.call(plans, function (pl) {
      var r = pl.getBoundingClientRect();
      if (r.bottom < -h || r.top > 2 * h) return;
      var p = (h - r.top) / (r.height + h);
      pl.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    });
  }
  function surDefilement() { if (!demande) { demande = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', surDefilement, { passive: true });
  addEventListener('resize', surDefilement);
  maj();
})();
