// Juboo s'installe par WhatsApp : le vendeur envoie l'application et le code d'activation.
//
// Avant d'ouvrir WhatsApp, une fenêtre dit honnêtement où en est Juboo — une première version,
// qu'on améliore avec ceux qui l'utilisent — et rappelle l'offre de lancement. Tout lien marqué
// `data-whatsapp` passe par elle, sur l'accueil comme à la fin d'une leçon.
(() => {
  const NUMERO = '221775543487';
  const MESSAGE = 'Bonjour, je souhaite installer Juboo.';
  const lien = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(MESSAGE);

  const style = document.createElement('style');
  style.textContent = `
    .wa-voile{position:fixed;inset:0;z-index:100;background:rgba(26,27,75,.55);
      display:flex;align-items:center;justify-content:center;padding:18px}
    .wa-carte{background:#fff;color:#20203A;border-radius:20px;max-width:380px;width:100%;
      padding:22px 20px 18px;box-shadow:0 24px 60px rgba(26,27,75,.3);
      font-family:Roboto,system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
    .wa-carte h2{margin:0 0 12px;font-size:20px;color:#1A1B4B}
    .wa-carte p{margin:0 0 12px;font-size:16px;line-height:1.5}
    .wa-carte .wa-offre{background:#FFF3E0;border-left:4px solid #F99F1B;border-radius:10px;
      padding:10px 12px}
    .wa-carte .wa-boutons{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
    .wa-carte button,.wa-carte a{font:inherit;font-weight:700;font-size:16px;border-radius:12px;
      padding:12px 16px;text-decoration:none;cursor:pointer;border:0}
    .wa-carte .wa-annuler{background:none;color:#C97D00}
    .wa-carte .wa-ok{background:#1F8F4E;color:#fff}
  `;
  document.head.append(style);

  function ouvrir(e) {
    e.preventDefault();
    const voile = document.createElement('div');
    voile.className = 'wa-voile';
    voile.innerHTML = `
      <div class="wa-carte" role="dialog" aria-modal="true" aria-labelledby="wa-titre">
        <h2 id="wa-titre">Avant de continuer</h2>
        <p>Juboo en est à sa <b>première version</b>. Il reste sans doute des choses à
          améliorer : vos remarques nous aideront à le faire.</p>
        <p class="wa-offre"><b>Offre de lancement :</b> Juboo <b>à vie pour 10 000 F</b>, moins
          cher qu'une année (12 000 F). Réservé aux dix premiers clients.</p>
        <p>Sur WhatsApp, nous vous envoyons l'application et votre code d'activation.</p>
        <div class="wa-boutons">
          <button type="button" class="wa-annuler">Annuler</button>
          <a class="wa-ok" href="${lien}" target="_blank" rel="noopener">Continuer sur WhatsApp</a>
        </div>
      </div>`;
    const fermer = () => voile.remove();
    voile.querySelector('.wa-annuler').onclick = fermer;
    voile.querySelector('.wa-ok').addEventListener('click', () => setTimeout(fermer, 300));
    voile.onclick = ev => { if (ev.target === voile) fermer(); };
    document.addEventListener('keydown', function echap(ev) {
      if (ev.key === 'Escape') { fermer(); document.removeEventListener('keydown', echap); }
    });
    document.body.append(voile);
    voile.querySelector('.wa-ok').focus();
  }

  // Délégué : les liens ajoutés après coup (la carte de fin d'une leçon) en profitent aussi.
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-whatsapp]');
    if (a) ouvrir(e);
  });
})();
