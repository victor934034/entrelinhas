/* Conjunto de ícones próprio: traço de 1,7 px, pontas retas e cantos vivos, sempre com um detalhe de "papel" (dobra, marcador, lombada). */
(function () {
  const P = {
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
    ribbon: '<path d="M6 3h12v18l-6-4.5L6 21z" class="f"/>',
    download: '<path d="M12 3v11"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/><path d="M12 14.5v2.5"/>',
    pix: '<path d="M12 2.8l4.6 4.6-3 3a2.2 2.2 0 01-3.2 0l-3-3z"/><path d="M12 21.2l-4.6-4.6 3-3a2.2 2.2 0 013.2 0l3 3z"/><path d="M2.8 12l3.4-3.4M2.8 12l3.4 3.4M21.2 12l-3.4-3.4M21.2 12l-3.4 3.4"/>',
    card: '<rect x="3" y="5.5" width="18" height="13"/><path d="M3 10h18"/><path d="M6.5 15h4"/>',
    boleto: '<path d="M4 5v14M7 5v14M11 5v14M14 5v14M17 5v14M20 5v14" stroke-width="1.6"/>',
    file: '<path d="M6 3h8l4.5 4.5V21H6z"/><path d="M14 3v4.5h4.5"/>',
    epub: '<path d="M6 3h8l4.5 4.5V21H6z"/><path d="M14 3v4.5h4.5"/><path d="M9 13h6M9 16.5h4"/>',
    play: '<rect x="3" y="5" width="18" height="14"/><path d="M10.5 9.5v5l4-2.5z" class="f"/>',
    star: '<path d="M12 2.8l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.6 6.2 20.1l1.5-6.4L2.8 9.4l6.5-.6z" class="f"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    menu: '<path d="M4 7h16M4 12h11M4 17h16"/>',
    check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4.4 3.5-6.5 7.5-6.5s6.9 2.1 7.5 6.5"/>',
    spine: '<path d="M5 3h4v18H5zM9 3h4v18H9z"/><path d="M15.2 4.4l3.6-1 3 16.2-3.6 1z"/>',
    pen: '<path d="M4 20l1.2-4.6L16.5 4.1l3.4 3.4L8.6 18.8z"/><path d="M14.5 6.2l3.4 3.4"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    wallet: '<path d="M4 7h14v13H4z"/><path d="M4 7l11-3.5V7"/><path d="M14 13.5h4"/>',
    copy: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13"/><path d="M3.5 6.5l8.5 7 8.5-7"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.9-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 2 0 3 5.2 1.3 5.2 4.1 0 1.2-1.1 2.1-2.7 2.1-1.2 0-2.2-.5-2.7-1.5M12 6.5v1.4M12 16.2v1.3"/>',
    upload: '<path d="M12 15V4"/><path d="M7 8l5-5 5 5"/><path d="M4 20h16"/>',
    quote: '<path d="M4 18v-6c0-3.3 1.7-5.8 5-6.5M14 18v-6c0-3.3 1.7-5.8 5-6.5"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0112 6.6a4.7 4.7 0 018.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    logout: '<path d="M10 4H4v16h6"/><path d="M14 8l4 4-4 4M18 12H9"/>'
  };

  function icon(name, size, cls) {
    const body = (P[name] || '').replace(/class="f"/g, 'class="ic-fill"');
    const s = size ? ` style="width:${size}px;height:${size}px"` : '';
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"${s}>${body}</svg>`;
  }

  window.icon = icon;
  window.ICON_NAMES = Object.keys(P);
})();
