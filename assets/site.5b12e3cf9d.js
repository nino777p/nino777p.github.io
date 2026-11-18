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
  var zones = [];
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
      for (i = n - 1; i > 0 && zones[i].haut > m; i--) {}
      return cz(zones[i]);
    }
    if (m <= zones[0].centre) return cz(zones[0]);
    for (i = 0; i < n - 1 && zones[i + 1].centre <= m; i++) {}
    if (i === n - 1) return cz(zones[i]);
    var A = zones[i], B = zones[i + 1], cA = cz(A), cB = cz(B);
    if (cA.sombre !== cB.sombre) return m < (A.bas + B.haut) / 2 ? cA : cB;
    if (B.centre <= A.centre) return cB;
    var t = (m - A.centre) / (B.centre - A.centre); t = t * t * (3 - 2 * t);
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
    if ('ResizeObserver' in window) new ResizeObserver(remesurer).observe(document.body);   // photos chargées, volets ouverts
    addEventListener('load', remesurer);
  }
  maj();
})();
