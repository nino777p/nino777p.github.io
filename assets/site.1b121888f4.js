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
  var blocs = document.querySelectorAll('main .tete-section, main .tuile, main .point, main .fabricant, main .echantillon,'
    + ' main .assemblage-carte, main .visite-carte, main .visite-texte, main .echantillons-texte, main .moment, main .etape');
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
/* Formulaires : e-mail ou téléphone au choix ; le téléphone devient obligatoire si l'on demande un rappel ou une visite. */
(function () {
  var fs = document.querySelectorAll('[data-formulaire]');
  Array.prototype.forEach.call(fs, function (f) {
    var mail = f.querySelector('[name=email]'), tel = f.querySelector('[name=tel]'), erreur = f.querySelector('.formulaire-erreur');
    var choix = f.querySelector('[data-telephone-si]');
    function maj() {
      if (!choix || !tel) return;
      var besoin = choix.getAttribute('data-telephone-si').split('|').indexOf(choix.value) > -1;
      tel.required = besoin;
    }
    if (choix) { choix.addEventListener('change', maj); maj(); }
    f.addEventListener('submit', function (e) {
      if (mail && tel && !mail.value.trim() && !tel.value.trim()) {
        e.preventDefault(); if (erreur) erreur.hidden = false; (mail || tel).focus();
      }
    });
  });
})();

/* 80-onglets.js */
/* Onglets : un volet visible à la fois ; flèches, Début et Fin au clavier ; l'adresse suit le volet (#bureaux…).
   Un lien « data-secteur » préremplit le choix du formulaire. Sans script : tous les volets restent affichés. */
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
    function indice() {
      var id = decodeURIComponent(location.hash.slice(1)), i = -1;
      volets.forEach(function (v, j) { if (v.id === id) i = j; });
      return i;
    }
    var depart = indice(); choisir(depart > -1 ? depart : 0, false, false);
    if (depart > -1) bloc.scrollIntoView();
    window.addEventListener('hashchange', function () { var i = indice(); if (i > -1) { choisir(i, false, false); bloc.scrollIntoView(); } });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-secteur]'), function (a) {
    a.addEventListener('click', function () {
      var cible = document.querySelector(a.getAttribute('href')), choix = cible && cible.querySelector('select[name=secteur]');
      if (choix) { choix.value = a.getAttribute('data-secteur'); choix.dispatchEvent(new Event('change')); }
    });
  });
})();
