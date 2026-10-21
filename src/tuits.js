/* ══ Tuits: enlaces, datos públicos, tarjeta dibujada en el navegador y captura con una API de capturas ══
   Tres fuentes para la imagen de cada tuit, de la más barata a la de reserva:
     1) tarjeta: el código descarga los datos públicos del tuit (sin clave) y lo dibuja en un lienzo → PNG nítido, sin cuota;
     2) captura: una API de capturas con la clave gratuita de la persona (cada tuit se captura UNA vez y se guarda);
     3) propia: la persona pega o sube su propia captura.
   Los datos se piden a servicios públicos que espejan X (FxTwitter, vxTwitter) y, si fallan, al servicio de inserción de X. */

/* ── enlaces ── */
const RX_TUIT = /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx|nitter\.[a-z.]+)\.com\/(?:#!\/)?(\w{1,15}|i(?:\/web)?)\/status(?:es)?\/(\d{5,25})/gi;
/* todos los tuits que aparecen en un texto (enlaces pegados, respuesta de la IA…), sin repetir */
function enlacesTuit(txt) {
  const vistos = new Set(), o = []; let m; RX_TUIT.lastIndex = 0;
  while ((m = RX_TUIT.exec(String(txt || '')))) { const id = m[2]; if (vistos.has(id)) continue; vistos.add(id); o.push({id, usuario: /^i(\/web)?$/i.test(m[1]) ? '' : m[1]}); }
  return o;
}
const urlTuit = tw => `https://x.com/${tw.usuario || 'i'}/status/${tw.id}`;
const urlBusquedaX = (q, modo = 'top') => `https://x.com/search?q=${encodeURIComponent(q)}&src=typed_query${modo === 'live' ? '&f=live' : ''}`;

/* ── datos públicos del tuit ── */
async function _json(u) {
  let r; try { r = await fetch(u, {headers: {Accept: 'application/json'}}); } catch { return {red: true}; }
  if (r.status === 404) return {no: true};
  if (!r.ok) return {st: r.status};
  try { return {j: await r.json()}; } catch { return {st: 'json'}; }
}
const _num = v => (v === undefined || v === null || v === '' ? null : Number(v));
function _deFx(x) {
  return {usuario: x.author?.screen_name || '', autor: x.author?.name || '', avatarUrl: x.author?.avatar_url || '', verificado: !!(x.author?.verification?.verified),
    texto: x.raw_text?.text || x.text || '', fecha: x.created_timestamp ? new Date(x.created_timestamp * 1000).toISOString() : (x.created_at ? new Date(x.created_at).toISOString() : ''),
    likes: _num(x.likes), rts: _num(x.retweets), resp: _num(x.replies), vistas: _num(x.views), lang: x.lang || '',
    fotos: (x.media?.photos || []).map(p => p.url).concat((x.media?.videos || []).map(v => v.thumbnail_url)).filter(Boolean),
    citado: x.quote ? {usuario: x.quote.author?.screen_name || '', autor: x.quote.author?.name || '', texto: x.quote.text || ''} : null};
}
function _deVx(x) {
  return {usuario: x.user_screen_name || '', autor: x.user_name || '', avatarUrl: x.user_profile_image_url || '', verificado: false,
    texto: x.text || '', fecha: x.date_epoch ? new Date(x.date_epoch * 1000).toISOString() : '', likes: _num(x.likes), rts: _num(x.retweets), resp: _num(x.replies), vistas: null, lang: x.lang || '',
    fotos: (x.media_extended || []).map(m => m.type === 'image' ? m.url : m.thumbnail_url).filter(Boolean),
    citado: x.qrt ? {usuario: x.qrt.user_screen_name || '', autor: x.qrt.user_name || '', texto: x.qrt.text || ''} : null};
}
/* token del servicio de inserción de X (el mismo cálculo que usa la librería react-tweet) */
const _tokSyn = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
function _deSyn(x) {
  return {usuario: x.user?.screen_name || '', autor: x.user?.name || '', avatarUrl: x.user?.profile_image_url_https || '', verificado: !!(x.user?.is_blue_verified || x.user?.verified),
    texto: x.text || '', fecha: x.created_at ? new Date(x.created_at).toISOString() : '', likes: _num(x.favorite_count), rts: null, resp: _num(x.conversation_count), vistas: null, lang: x.lang || '',
    fotos: (x.mediaDetails || []).map(m => m.media_url_https).filter(Boolean),
    citado: x.quoted_tweet ? {usuario: x.quoted_tweet.user?.screen_name || '', autor: x.quoted_tweet.user?.name || '', texto: x.quoted_tweet.text || ''} : null};
}
/* elimina los enlaces t.co finales que X añade a las fotos y normaliza entidades */
const limpiaTexto = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s*https:\/\/t\.co\/\w+\s*$/g, '').trim();
/* devuelve {ok:true, ...datos} o {ok:false, motivo:'no'|'red'|'error'} */
async function obtenTuit(id, usuario = '') {
  const u = usuario || 'i';
  const fuentes = [
    [`https://api.fxtwitter.com/${u}/status/${id}`, j => j.tweet && _deFx(j.tweet), 'FxTwitter'],
    [`https://api.vxtwitter.com/${u}/status/${id}`, j => j.text !== undefined && _deVx(j), 'vxTwitter'],
    [`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=es&token=${_tokSyn(id)}`, j => j.text !== undefined && j.__typename !== 'TweetTombstone' && _deSyn(j), 'X']
  ];
  let noExiste = 0, red = 0;
  for (const [url, conv, nombre] of fuentes) {
    const r = await _json(url);
    if (r.no) { noExiste++; continue; }
    if (r.red) { red++; continue; }
    const d = r.j && conv(r.j);
    if (d && (d.texto || d.fotos.length)) return {ok: true, id, ...d, texto: limpiaTexto(d.texto), fuente: nombre};
  }
  return {ok: false, id, usuario, motivo: noExiste >= 2 ? 'no' : red === fuentes.length ? 'red' : 'error'};
}

/* ── imágenes: se descargan como bytes (no como <img> remoto) para poder dibujarlas, guardarlas y exportarlas ── */
const blobADataURL = b => new Promise((ok, ko) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ko(fr.error); fr.readAsDataURL(b); });
const cargaImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('img')); i.src = src; });
/* reduce una imagen a lado ≤ max (JPEG o PNG) */
async function ajustaImg(dataURL, max = 1200, tipo = 'image/jpeg') {
  const im = await cargaImg(dataURL), k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
  if (k >= 1 && dataURL.startsWith('data:' + tipo)) return dataURL;
  const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
  const g = c.getContext('2d'); if (tipo === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL(tipo, 0.88);
}
async function bajaImagen(url, max = 1200) {
  if (!url) return '';
  try { const r = await fetch(url); if (!r.ok) return ''; return await ajustaImg(await blobADataURL(await r.blob()), max); } catch { return ''; }
}

/* ── tarjeta del tuit dibujada en un lienzo (sin cuota, nítida al proyectar) ── */
const TEMAS_TARJ = {
  claro: {fondo: '#FFFFFF', borde: '#CFD9DE', texto: '#0F1419', gris: '#536471', marca: '#FFE58A', enlace: '#1D9BF0', citaFondo: '#F7F9F9'},
  oscuro: {fondo: '#000000', borde: '#2F3336', texto: '#E7E9EA', gris: '#71767B', marca: '#6B5A00', enlace: '#1D9BF0', citaFondo: '#16181C'}
};
const FUENTE_TARJ = '"Instrument Sans", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
/* parte un texto en líneas que caben en «ancho»; respeta los saltos de línea del tuit */
function lineas(g, txt, ancho) {
  const o = [];
  for (const par of String(txt).split('\n')) {
    if (!par.trim()) { o.push(''); continue; }
    let lin = '';
    for (const w of par.split(/(\s+)/)) {
      const prueba = lin + w;
      if (g.measureText(prueba).width <= ancho || !lin.trim()) {
        if (g.measureText(prueba).width > ancho && !lin.trim()) {   // palabra más larga que la línea (enlaces): se corta
          let trozo = ''; for (const ch of w) { if (g.measureText(trozo + ch).width > ancho) { o.push(trozo); trozo = ''; } trozo += ch; } lin = trozo;
        } else lin = prueba;
      } else { o.push(lin.trimEnd()); lin = w.trimStart(); }
    }
    o.push(lin.trimEnd());
  }
  while (o.length && o.at(-1) === '') o.pop();
  return o;
}
const compacto = n => n === null || n === undefined || isNaN(n) ? '' : new Intl.NumberFormat(locale(), {notation: 'compact', maximumFractionDigits: 1}).format(n);
function _redondo(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* rangos [ini, fin) del texto que coinciden con la frase resaltada (sin distinguir mayúsculas ni tildes) */
function rangoFrase(texto, frase) { if (!frase) return null; const r = localiza(texto, frase, 8); return r ? [r[0], r[1] + 1] : null; }
/* dibuja la tarjeta; devuelve un dataURL PNG. tw: datos del tuit; o.tema 'claro'|'oscuro'; o.frase: texto a resaltar; o.ejemplo: rótulo de ficticio */
async function dibujaTarjeta(tw, o = {}) {
  const T = TEMAS_TARJ[o.tema] || TEMAS_TARJ.claro, E = 2, W = 1000, P = 44, AV = 84;
  try { await document.fonts?.ready; } catch {}
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const fTexto = `400 34px ${FUENTE_TARJ}`, lh = 48, anchoTxt = W - 2 * P;
  g.font = fTexto; const L = lineas(g, tw.texto || '', anchoTxt);
  let foto = null; if (tw.fotoData) try { foto = await cargaImg(tw.fotoData); } catch {}
  let av = null; if (tw.avatarData) try { av = await cargaImg(tw.avatarData); } catch {}
  const fotoH = foto ? Math.min(560, Math.round(anchoTxt * foto.naturalHeight / foto.naturalWidth)) : 0;
  g.font = `400 26px ${FUENTE_TARJ}`; const LC = tw.citado ? lineas(g, tw.citado.texto || '', anchoTxt - 48).slice(0, 4) : [];
  const citH = tw.citado ? 70 + LC.length * 36 + 20 : 0;
  const H = P + AV + 26 + L.length * lh + (fotoH ? 24 + fotoH : 0) + (citH ? 24 + citH : 0) + 30 + 1 + 64 + (o.pie ? 34 : 0) + P - 10;
  c.width = W * E; c.height = H * E; g.scale(E, E);
  g.fillStyle = T.fondo; _redondo(g, 1, 1, W - 2, H - 2, 28); g.fill(); g.strokeStyle = T.borde; g.lineWidth = 2; g.stroke();
  /* cabecera: avatar, nombre, usuario y logotipo */
  const ax = P, ay = P; g.save(); g.beginPath(); g.arc(ax + AV / 2, ay + AV / 2, AV / 2, 0, Math.PI * 2); g.clip();
  if (av) g.drawImage(av, ax, ay, AV, AV); else { g.fillStyle = '#E4572E'; g.fillRect(ax, ay, AV, AV); g.fillStyle = '#fff'; g.font = `700 36px ${FUENTE_TARJ}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(((tw.autor || tw.usuario || '?').trim()[0] || '?').toUpperCase(), ax + AV / 2, ay + AV / 2 + 2); }
  g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const nx = ax + AV + 20; g.fillStyle = T.texto; g.font = `700 32px ${FUENTE_TARJ}`;
  let nombre = tw.autor || tw.usuario || ''; while (nombre.length > 3 && g.measureText(nombre).width > W - nx - P - 90) nombre = nombre.slice(0, -2) + '…';
  g.fillText(nombre, nx, ay + 36);
  if (tw.verificado) { const vx = nx + g.measureText(nombre).width + 10; g.fillStyle = T.enlace; g.beginPath(); g.arc(vx + 13, ay + 25, 13, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(vx + 7, ay + 25); g.lineTo(vx + 11.5, ay + 30); g.lineTo(vx + 19.5, ay + 20); g.stroke(); }
  g.fillStyle = T.gris; g.font = `400 28px ${FUENTE_TARJ}`; g.fillText('@' + (tw.usuario || ''), nx, ay + 74);
  g.fillStyle = T.texto; g.font = `700 44px ${FUENTE_TARJ}`; g.textAlign = 'right'; g.fillText('𝕏', W - P, ay + 46); g.textAlign = 'left';
  /* texto, con la frase clave resaltada si se pidió */
  let y = ay + AV + 26; g.font = fTexto;
  const rg = rangoFrase(tw.texto || '', o.frase); let pos = 0; const txt = String(tw.texto || '');
  for (const lin of L) {
    const ini = txt.indexOf(lin, pos); const i0 = ini < 0 ? pos : ini;
    if (rg && lin) {
      const a = Math.max(rg[0], i0) - i0, b = Math.min(rg[1], i0 + lin.length) - i0;
      if (b > a) { const x0 = P + g.measureText(lin.slice(0, a)).width, x1 = P + g.measureText(lin.slice(0, b)).width; g.fillStyle = T.marca; _redondo(g, x0 - 4, y + 6, x1 - x0 + 8, lh - 4, 6); g.fill(); }
    }
    g.fillStyle = T.texto;
    /* menciones, etiquetas y enlaces en azul, como en X */
    let x = P; for (const parte of lin.split(/((?:@\w{1,15}|#[\p{L}\p{N}_]+|https?:\/\/\S+))/u)) { if (!parte) continue; g.fillStyle = /^(@|#|https?:)/u.test(parte) ? T.enlace : T.texto; g.fillText(parte, x, y + 36); x += g.measureText(parte).width; }
    y += lh; if (ini >= 0) pos = ini + lin.length;
  }
  if (foto) { y += 24; g.save(); _redondo(g, P, y, anchoTxt, fotoH, 18); g.clip(); const k = Math.max(anchoTxt / foto.naturalWidth, fotoH / foto.naturalHeight), dw = foto.naturalWidth * k, dh = foto.naturalHeight * k; g.drawImage(foto, P + (anchoTxt - dw) / 2, y + (fotoH - dh) / 2, dw, dh); g.restore(); g.strokeStyle = T.borde; g.lineWidth = 1.5; _redondo(g, P, y, anchoTxt, fotoH, 18); g.stroke(); y += fotoH; }
  if (tw.citado) {
    y += 24; g.strokeStyle = T.borde; g.lineWidth = 2; g.fillStyle = T.citaFondo; _redondo(g, P, y, anchoTxt, citH, 18); g.fill(); g.stroke();
    g.fillStyle = T.texto; g.font = `700 26px ${FUENTE_TARJ}`; g.fillText(tw.citado.autor || '', P + 24, y + 44); const an = g.measureText(tw.citado.autor || '').width;
    g.fillStyle = T.gris; g.font = `400 24px ${FUENTE_TARJ}`; g.fillText(' @' + (tw.citado.usuario || ''), P + 24 + an, y + 44);
    g.fillStyle = T.texto; g.font = `400 26px ${FUENTE_TARJ}`; LC.forEach((l, i) => g.fillText(l, P + 24, y + 86 + i * 36)); y += citH;
  }
  /* fecha y métricas */
  y += 30; g.fillStyle = T.gris; g.font = `400 26px ${FUENTE_TARJ}`;
  const f = tw.fecha ? new Date(tw.fecha) : null;
  g.fillText(f && !isNaN(f) ? f.toLocaleTimeString(locale(), {hour: '2-digit', minute: '2-digit'}) + ' · ' + f.toLocaleDateString(locale(), {day: 'numeric', month: 'short', year: 'numeric'}) : '', P, y);
  y += 22; g.fillStyle = T.borde; g.fillRect(P, y, anchoTxt, 1.5); y += 46;
  g.font = `400 26px ${FUENTE_TARJ}`; let mx = P;
  for (const [ico, v] of [['💬', tw.resp], ['🔁', tw.rts], ['♥', tw.likes], ['📊', tw.vistas]]) { const s = compacto(v); if (!s) continue; g.fillStyle = T.gris; g.fillText(`${ico} ${s}`, mx, y); mx += g.measureText(`${ico} ${s}`).width + 44; }
  if (o.pie) { y += 40; g.fillStyle = T.gris; g.font = `600 21px ${FUENTE_TARJ}`; let p = o.pie; while (p.length > 8 && g.measureText(p).width > anchoTxt) p = p.slice(0, -2) + '…'; g.fillText(p, P, y); }
  return c.toDataURL('image/png');
}

/* ── capturas con una API (clave gratuita de la persona). Se captura la versión incrustada del tuit:
      no tiene muro de inicio de sesión ni avisos de cookies, y su fondo liso se recorta solo. ── */
const CAPT = {
  microlink: {n: 'Microlink', lim: 50, per: 'dia', clave: false, web: 'https://microlink.io/screenshot',
    url: (obj, k) => `https://${k ? 'pro' : 'api'}.microlink.io/?url=${encodeURIComponent(obj)}&screenshot=true&meta=false&embed=screenshot.url&waitForTimeout=3500&viewport.width=600&viewport.height=1100&viewport.deviceScaleFactor=2`,
    cab: k => (k ? {'x-api-key': k} : {})},
  screenshotone: {n: 'ScreenshotOne', lim: 100, per: 'mes', clave: true, web: 'https://screenshotone.com',
    url: (obj, k) => `https://api.screenshotone.com/take?access_key=${encodeURIComponent(k)}&url=${encodeURIComponent(obj)}&viewport_width=600&viewport_height=1100&device_scale_factor=2&format=png&delay=4&block_cookie_banners=true&block_ads=true&cache=false`, cab: () => ({})},
  apiflash: {n: 'ApiFlash', lim: 100, per: 'mes', clave: true, web: 'https://apiflash.com',
    url: (obj, k) => `https://api.apiflash.com/v1/urltoimage?access_key=${encodeURIComponent(k)}&url=${encodeURIComponent(obj)}&width=600&height=1100&scale_factor=2&format=png&delay=4&fresh=true&response_type=image`, cab: () => ({})}
};
const getCapProv = () => CAPT[localStorage.getItem(APP + '_cap_prov')] ? localStorage.getItem(APP + '_cap_prov') : 'microlink';
const getCapKey = (p = getCapProv()) => localStorage.getItem(APP + '_cap_key_' + p) || '';
const getCapLim = (p = getCapProv()) => +localStorage.getItem(APP + '_cap_lim_' + p) || CAPT[p].lim;
const urlEmbed = (id, tema) => `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=${tema === 'oscuro' ? 'dark' : 'light'}&lang=${LANG === 'pt' ? 'pt' : LANG === 'en' ? 'en' : 'es'}&dnt=true&hideThread=true`;
/* contador de uso: por día (Microlink) o por mes (las demás), solo en este navegador */
const _periodo = p => CAPT[p].per === 'dia' ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 7);
function usoCaptura(p = getCapProv()) { try { const u = JSON.parse(localStorage.getItem(APP + '_cap_uso_' + p) || '{}'); return u.per === _periodo(p) ? u.n : 0; } catch { return 0; } }
const sumaUso = (p = getCapProv()) => localStorage.setItem(APP + '_cap_uso_' + p, JSON.stringify({per: _periodo(p), n: usoCaptura(p) + 1}));
/* recorta el fondo liso alrededor de la captura (la página incrustada deja márgenes vacíos) */
async function recorta(dataURL, margen = 12) {
  const im = await cargaImg(dataURL), w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, w, h).data;
  const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; }, f = px(0, 0);
  const igual = (x, y) => { const q = px(x, y); return Math.abs(q[0] - f[0]) + Math.abs(q[1] - f[1]) + Math.abs(q[2] - f[2]) + Math.abs(q[3] - f[3]) < 24; };
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (!igual(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return {dataURL, vacia: true};
  x0 = Math.max(0, x0 - margen); y0 = Math.max(0, y0 - margen); x1 = Math.min(w - 1, x1 + margen); y1 = Math.min(h - 1, y1 + margen);
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return {dataURL: o.toDataURL('image/png'), vacia: false};
}
/* hace UNA captura (gasta una de la cuota). Devuelve el dataURL ya recortado o lanza un error legible */
async function capturaTuit(id, tema = 'claro') {
  const p = getCapProv(), C = CAPT[p], k = getCapKey(p);
  if (C.clave && !k) throw new Error(t('Falta la clave de {0}. Pégala en «Capturas reales».', C.n));
  let r; try { r = await fetch(C.url(urlEmbed(id, tema), k), {headers: C.cab(k)}); } catch { throw new Error(t('No se pudo conectar con {0}. Si el problema sigue, usa la tarjeta o pega tu propia captura.', C.n)); }
  if (r.status === 401 || r.status === 403) throw new Error(t('{0} no acepta la clave o la ha bloqueado ({1}).', C.n, r.status));
  if (r.status === 429) throw new Error(t('Has agotado la cuota gratuita de {0} por ahora. Usa la tarjeta o tu propia captura.', C.n));
  if (!r.ok) throw new Error(t('{0} respondió con un error ({1}).', C.n, r.status));
  sumaUso(p);
  const b = await r.blob(); if (!/^image\//.test(b.type)) throw new Error(t('{0} no devolvió una imagen.', C.n));
  const rc = await recorta(await blobADataURL(b)); if (rc.vacia) throw new Error(t('La captura salió en blanco: puede que el tuit no exista o que la página no cargara a tiempo.'));
  return rc.dataURL;
}
