/* ══ TuitIA: del guion de clase a una presentación con tuits reales y comprobados ══
   Recorrido: guion → ideas (con búsquedas para X) → tuits (enlaces comprobados por código) → diapositivas → presentar o descargar.
   La IA propone (ideas, búsquedas, encaje de cada tuit, frase clave, título y notas); el código comprueba:
     · cada idea cita un fragmento literal del guion (esFiel);
     · cada tuit existe de verdad (se leen sus datos públicos) y la frase clave que señala la IA está en su texto;
     · los enlaces que encuentra la IA en la web se abren uno a uno: los que no existen se marcan como inventados.
   Guarda datos, no frases: los avisos se redactan al pintar, en el idioma del momento. ══ */
const STEPS = ['Inicio', 'Guion', 'Ideas', 'Tuits', 'Diapositivas', 'Presentar'];
const NAV = [['Empezar', 'Prueba con el ejemplo: no necesita clave.'], ['Siguiente: ideas', 'Separa el guion en ideas, con IA o sin ella.'], ['Siguiente: tuits', 'Abre las búsquedas en X y pega los enlaces de los tuits.'], ['Siguiente: diapositivas', 'Elige qué tuits entran y cómo se ven.'], ['Siguiente: presentar', 'Revisa la presentación y oculta lo que sobre.'], ['Volver al inicio', 'Presenta o descarga en PowerPoint o PDF.']];
const RENDER = {0: pintaInicio, 1: pintaGuion, 2: pintaIdeas, 3: pintaTuits, 4: pintaDiapos, 5: pintaFinal};
const GLOS = [
  ['¿Qué hace?', 'Convierte el guion de tu clase en una presentación con tuits reales que refuerzan cada idea: separa las ideas, te prepara búsquedas para X, comprueba los tuits que eliges y monta las diapositivas.'],
  ['Buscar tuits en X', 'Cada búsqueda se abre en X con tu propia sesión. Copia el enlace de los tuits que te sirvan (Compartir → Copiar enlace) y pégalo en su idea. Puedes editar las búsquedas: "frase exacta", OR, lang:es, min_faves:50, from:cuenta o since:2025-01-01.'],
  ['Búsqueda con IA en la web', 'Es opcional y encuentra pocos tuits, porque X limita lo que muestran los buscadores. Cada enlace que propone la IA se abre por código: si no existe, se marca como inventado; si la IA describe un texto que no está en el tuit, también se avisa.'],
  ['Qué comprueba el código', 'Que cada idea se basa en un fragmento literal de tu guion, que cada tuit existe y que la frase clave que señala la IA aparece en el tuit. Lo que no se puede comprobar se marca con ⚠.'],
  ['Tarjeta, captura o imagen propia', 'La tarjeta se dibuja en tu navegador con los datos públicos del tuit: es nítida, no gasta cuota y puede resaltar la frase clave, pero es una reproducción, no una captura de X. La captura real usa tu API de capturas. También puedes subir o pegar (Ctrl+V) tu propia captura.'],
  ['Cuota de capturas', 'Microlink funciona sin clave con un límite diario; ScreenshotOne y ApiFlash piden una clave gratuita con un límite mensual (consulta las condiciones actuales en su web). Cada tuit se captura una sola vez y se guarda; el contador de uso es solo de este navegador.'],
  ['Privacidad', 'Tu guion se guarda solo en este navegador. Si pides separarlo con IA, sale hacia tu proveedor con los datos personales enmascarados, y antes del primer envío ves lo que sale. Para leer un tuit solo se envía su número a un servicio público de tuits.'],
  ['Citar los tuits', 'Cada diapositiva lleva el enlace al tuit original y la presentación termina con una diapositiva de fuentes. Usa los tuits para comentar y analizar, cita siempre a su autor y revisa que el contenido sea adecuado para tu clase.'],
  ['Tu clave de IA', 'Funciona con OpenAI, Google Gemini o Anthropic Claude. La clave se guarda solo en este navegador. La búsqueda en la web usa la herramienta de búsqueda de tu proveedor y puede costar algo más que una llamada normal.']
];
const CAN_NEXT = i => i === 1 && !S.ideas.length ? t('Primero separa el guion en ideas, con IA o sin ella.') : true;
const OP0 = {temaTarj: 'claro', resalta: true, temaPres: 'claro', diapoIdea: true, fuentes: true};
const nuevoS = () => ({titulo: '', curso: '', guion: '', ideas: [], tuits: {}, op: {...OP0}, ocultas: {}, esEjemplo: false});
let S = nuevoS();
let ENVIO_OK = false;   // el aviso previo se pide una vez por sesión: solo en memoria, no se guarda
const LANG_X = () => (LANG === 'pt' ? 'pt' : LANG === 'en' ? 'en' : 'es');

/* ══ ejemplo sin clave, en cada idioma. Los tuits son FICTICIOS (cuentas y textos inventados, marcados como tales):
      atraviesan las mismas funciones que los reales (verificación de citas, tarjetas, diapositivas y PowerPoint). ══ */
const EJ = {
  es: {titulo: 'Desinformación en redes sociales', curso: 'Alfabetización mediática · Sesión 4',
    guion: 'Clase 4. Desinformación en redes sociales: cómo circula y cómo frenarla.\n\n1. Las noticias falsas se difunden más rápido que las verdaderas. Un estudio publicado en Science en 2018 analizó miles de cascadas de rumores en Twitter y encontró que las falsedades llegaban a más personas y lo hacían antes. La novedad y la sorpresa explican buena parte de ese efecto.\n\n2. Las emociones fuertes, sobre todo la indignación, aumentan la probabilidad de compartir. Antes de reenviar, conviene detenerse y preguntarse qué emoción nos está provocando el mensaje.\n\n3. La verificación lateral es la estrategia más eficaz: en lugar de quedarse en la página, abrir otras pestañas y comprobar qué dicen otras fuentes sobre quién publica.',
    ideas: [{titulo: 'Lo falso corre más que lo verdadero', texto: 'Las falsedades llegan a más personas y antes, en buena parte por su novedad.', cita: 'las falsedades llegaban a más personas y lo hacían antes', consultas: ['bulo desmentido "más rápido" lang:es min_faves:50', '"noticia falsa" viral desmentido lang:es -filter:replies']},
      {titulo: 'La indignación se comparte', texto: 'Las emociones fuertes aumentan la probabilidad de compartir sin comprobar.', cita: 'Las emociones fuertes, sobre todo la indignación, aumentan la probabilidad de compartir', consultas: ['"antes de compartir" indignación lang:es', 'bulo emociones compartir lang:es min_faves:20']},
      {titulo: 'Verificar de lado', texto: 'Para valorar una fuente, mira qué dicen otras sobre ella en lugar de quedarte en su página.', cita: 'abrir otras pestañas y comprobar qué dicen otras fuentes sobre quién publica', consultas: ['"lectura lateral" verificación lang:es', 'cómo verificar una web fuentes lang:es min_faves:30']}],
    tuits: [
      {id: 'ej1', idea: 0, usuario: 'lab_datos_ej', autor: 'Laboratorio de Datos (ficticio)', texto: 'Un bulo tarda horas en dar la vuelta a la red; el desmentido, días. Hoy hemos seguido una falsa alerta sanitaria: 40.000 compartidos antes de que nadie la comprobara. 📉', fecha: '2026-03-12T09:41:00Z', likes: 1840, rts: 920, resp: 75, vistas: 152000,
        val: {encaje: 'alto', porque: 'Muestra con un caso concreto cómo el bulo se adelanta al desmentido.', frase: 'Un bulo tarda horas en dar la vuelta a la red; el desmentido, días', titulo: 'El bulo va por delante del desmentido', nota: 'Pregunta a la clase por qué el desmentido llega más tarde y a menos gente. Relaciónalo con la novedad y la sorpresa del guion.'}},
      {id: 'ej4', idea: 0, usuario: 'humor_ej', autor: 'Cuenta de humor (ficticia)', texto: 'Mi abuela ya compartía cadenas de WhatsApp antes de que fuera tendencia 😂', fecha: '2026-02-02T20:15:00Z', likes: 310, rts: 40, resp: 12, vistas: 9800, incluir: false,
        val: {encaje: 'bajo', porque: 'Es un chiste: no aporta información sobre la velocidad de difusión.', frase: 'Mi abuela ya compartía cadenas de WhatsApp', titulo: 'Compartir sin pensar', nota: 'Puede servir para romper el hielo, pero no como prueba.'}},
      {id: 'ej2', idea: 1, usuario: 'ana_ejemplo', autor: 'Prof. Ana Ejemplo (ficticia)', texto: 'Regla de clase: si un mensaje te enfada mucho, espera diez minutos antes de compartirlo. La indignación es el combustible favorito de la desinformación.', fecha: '2026-01-20T08:05:00Z', likes: 5200, rts: 2100, resp: 230, vistas: 410000,
        val: {encaje: 'alto', porque: 'Formula la idea como una regla práctica que el alumnado puede aplicar.', frase: 'La indignación es el combustible favorito de la desinformación', titulo: 'Si te enfada, espera', nota: 'Pide que cada estudiante recuerde el último mensaje que le indignó y si lo comprobó antes de compartirlo.'}},
      {id: 'ej3', idea: 2, usuario: 'verifica_ej', autor: 'Verificadora Ficticia', texto: '¿Una web que no conoces? No leas su página de «Quiénes somos»: abre otra pestaña y busca qué dicen de ella otros medios. Eso es la lectura lateral. 🔎', fecha: '2025-11-05T17:30:00Z', likes: 2300, rts: 1300, resp: 64, vistas: 98000,
        val: {encaje: 'alto', porque: 'Explica la verificación lateral con un gesto concreto.', frase: 'abre otra pestaña y busca qué dicen de ella otros medios', titulo: 'Abre otra pestaña', nota: 'Haz una demostración en directo con una web desconocida.'}}]},
  en: {titulo: 'Misinformation on social media', curso: 'Media literacy · Session 4',
    guion: 'Lesson 4. Misinformation on social media: how it spreads and how to stop it.\n\n1. False news spreads faster than true news. A study published in Science in 2018 analysed thousands of rumour cascades on Twitter and found that falsehoods reached more people and did so sooner. Novelty and surprise explain much of that effect.\n\n2. Strong emotions, especially outrage, increase the likelihood of sharing. Before forwarding, it is worth pausing to ask what emotion the message is triggering in us.\n\n3. Lateral reading is the most effective strategy: instead of staying on the page, open other tabs and check what other sources say about who is publishing.',
    ideas: [{titulo: 'Falsehood travels faster than truth', texto: 'Falsehoods reach more people and sooner, largely because of their novelty.', cita: 'falsehoods reached more people and did so sooner', consultas: ['hoax debunked "spread faster" lang:en min_faves:50', '"fake news" viral debunked lang:en -filter:replies']},
      {titulo: 'Outrage gets shared', texto: 'Strong emotions increase the likelihood of sharing without checking.', cita: 'Strong emotions, especially outrage, increase the likelihood of sharing', consultas: ['"before you share" outrage lang:en', 'misinformation emotions sharing lang:en min_faves:20']},
      {titulo: 'Read laterally', texto: 'To judge a source, look at what others say about it instead of staying on its page.', cita: 'open other tabs and check what other sources say about who is publishing', consultas: ['"lateral reading" fact-checking lang:en', 'how to verify a website sources lang:en min_faves:30']}],
    tuits: [
      {id: 'ej1', idea: 0, usuario: 'data_lab_ex', autor: 'Data Lab (fictitious)', texto: 'A hoax takes hours to go around the web; the correction takes days. Today we tracked a false health alert: 40,000 shares before anyone checked it. 📉', fecha: '2026-03-12T09:41:00Z', likes: 1840, rts: 920, resp: 75, vistas: 152000,
        val: {encaje: 'alto', porque: 'It shows with a concrete case how the hoax gets ahead of the correction.', frase: 'A hoax takes hours to go around the web; the correction takes days', titulo: 'The hoax runs ahead of the correction', nota: 'Ask the class why the correction arrives later and reaches fewer people. Link it to novelty and surprise in the script.'}},
      {id: 'ej4', idea: 0, usuario: 'humour_ex', autor: 'Humour account (fictitious)', texto: 'My grandma was forwarding chain messages before it was cool 😂', fecha: '2026-02-02T20:15:00Z', likes: 310, rts: 40, resp: 12, vistas: 9800, incluir: false,
        val: {encaje: 'bajo', porque: 'It is a joke: it says nothing about how fast content spreads.', frase: 'My grandma was forwarding chain messages', titulo: 'Sharing without thinking', nota: 'It can break the ice, but not serve as evidence.'}},
      {id: 'ej2', idea: 1, usuario: 'ann_example', autor: 'Prof. Ann Example (fictitious)', texto: 'Class rule: if a post makes you really angry, wait ten minutes before sharing it. Outrage is the favourite fuel of misinformation.', fecha: '2026-01-20T08:05:00Z', likes: 5200, rts: 2100, resp: 230, vistas: 410000,
        val: {encaje: 'alto', porque: 'It turns the idea into a practical rule students can apply.', frase: 'Outrage is the favourite fuel of misinformation', titulo: 'If it angers you, wait', nota: 'Ask each student to recall the last post that outraged them and whether they checked it before sharing.'}},
      {id: 'ej3', idea: 2, usuario: 'factcheck_ex', autor: 'Fictitious Fact-Checker', texto: 'A website you do not know? Do not read its "About us" page: open another tab and search what other outlets say about it. That is lateral reading. 🔎', fecha: '2025-11-05T17:30:00Z', likes: 2300, rts: 1300, resp: 64, vistas: 98000,
        val: {encaje: 'alto', porque: 'It explains lateral reading with one concrete action.', frase: 'open another tab and search what other outlets say about it', titulo: 'Open another tab', nota: 'Give a live demonstration with an unknown website.'}}]},
  pt: {titulo: 'Desinformação nas redes sociais', curso: 'Literacia mediática · Sessão 4',
    guion: 'Aula 4. Desinformação nas redes sociais: como circula e como travá-la.\n\n1. As notícias falsas espalham-se mais depressa do que as verdadeiras. Um estudo publicado na Science em 2018 analisou milhares de cascatas de rumores no Twitter e concluiu que as falsidades chegavam a mais pessoas e chegavam mais cedo. A novidade e a surpresa explicam boa parte desse efeito.\n\n2. As emoções fortes, sobretudo a indignação, aumentam a probabilidade de partilhar. Antes de reencaminhar, convém parar e perguntar que emoção a mensagem nos está a provocar.\n\n3. A verificação lateral é a estratégia mais eficaz: em vez de ficar na página, abrir outros separadores e verificar o que dizem outras fontes sobre quem publica.',
    ideas: [{titulo: 'O falso corre mais do que o verdadeiro', texto: 'As falsidades chegam a mais pessoas e mais cedo, em grande parte pela sua novidade.', cita: 'as falsidades chegavam a mais pessoas e chegavam mais cedo', consultas: ['boato desmentido "mais rápido" lang:pt min_faves:50', '"notícia falsa" viral desmentido lang:pt -filter:replies']},
      {titulo: 'A indignação partilha-se', texto: 'As emoções fortes aumentam a probabilidade de partilhar sem verificar.', cita: 'As emoções fortes, sobretudo a indignação, aumentam a probabilidade de partilhar', consultas: ['"antes de partilhar" indignação lang:pt', 'desinformação emoções partilhar lang:pt min_faves:20']},
      {titulo: 'Verificar de lado', texto: 'Para avaliar uma fonte, veja o que outras dizem sobre ela em vez de ficar na sua página.', cita: 'abrir outros separadores e verificar o que dizem outras fontes sobre quem publica', consultas: ['"leitura lateral" verificação lang:pt', 'como verificar um site fontes lang:pt min_faves:30']}],
    tuits: [
      {id: 'ej1', idea: 0, usuario: 'lab_dados_ex', autor: 'Laboratório de Dados (fictício)', texto: 'Um boato demora horas a dar a volta à rede; o desmentido, dias. Hoje seguimos um falso alerta sanitário: 40.000 partilhas antes de alguém o verificar. 📉', fecha: '2026-03-12T09:41:00Z', likes: 1840, rts: 920, resp: 75, vistas: 152000,
        val: {encaje: 'alto', porque: 'Mostra com um caso concreto como o boato se antecipa ao desmentido.', frase: 'Um boato demora horas a dar a volta à rede; o desmentido, dias', titulo: 'O boato vai à frente do desmentido', nota: 'Pergunte à turma porque é que o desmentido chega mais tarde e a menos pessoas. Relacione com a novidade e a surpresa do guião.'}},
      {id: 'ej4', idea: 0, usuario: 'humor_ex', autor: 'Conta de humor (fictícia)', texto: 'A minha avó já partilhava correntes no WhatsApp antes de ser moda 😂', fecha: '2026-02-02T20:15:00Z', likes: 310, rts: 40, resp: 12, vistas: 9800, incluir: false,
        val: {encaje: 'bajo', porque: 'É uma piada: não diz nada sobre a velocidade de difusão.', frase: 'A minha avó já partilhava correntes no WhatsApp', titulo: 'Partilhar sem pensar', nota: 'Pode servir para quebrar o gelo, mas não como prova.'}},
      {id: 'ej2', idea: 1, usuario: 'ana_exemplo', autor: 'Prof.ª Ana Exemplo (fictícia)', texto: 'Regra da aula: se uma mensagem o irrita muito, espere dez minutos antes de a partilhar. A indignação é o combustível preferido da desinformação.', fecha: '2026-01-20T08:05:00Z', likes: 5200, rts: 2100, resp: 230, vistas: 410000,
        val: {encaje: 'alto', porque: 'Formula a ideia como uma regra prática que os estudantes podem aplicar.', frase: 'A indignação é o combustível preferido da desinformação', titulo: 'Se o irrita, espere', nota: 'Peça a cada estudante que recorde a última mensagem que o indignou e se a verificou antes de a partilhar.'}},
      {id: 'ej3', idea: 2, usuario: 'verifica_ex', autor: 'Verificadora Fictícia', texto: 'Um site que não conhece? Não leia a página «Quem somos»: abra outro separador e procure o que dizem dele outros meios. Isso é a leitura lateral. 🔎', fecha: '2025-11-05T17:30:00Z', likes: 2300, rts: 1300, resp: 64, vistas: 98000,
        val: {encaje: 'alto', porque: 'Explica a verificação lateral com um gesto concreto.', frase: 'abra outro separador e procure o que dizem dele outros meios', titulo: 'Abra outro separador', nota: 'Faça uma demonstração ao vivo com um site desconhecido.'}}]}
};
const ejemplo = () => EJ[LANG] || EJ.es;
function aplicaEjemplo() {
  const e = ejemplo(), op = S.op; S = {...nuevoS(), op: {...OP0, ...op}, titulo: e.titulo, curso: e.curso, guion: e.guion, esEjemplo: true};
  S.ideas = procesaIdeas({ideas: e.ideas}, e.guion);
  for (const x of e.tuits) {
    const idea = S.ideas[x.idea];
    S.tuits[x.id] = {...tuitVacio(x.id, '', idea.id), ...x, idea: idea.id, estado: 'ok', ejemplo: true, incluir: x.incluir !== false};
    idea.tuits.push(x.id);
    aplicaVal(S.tuits[x.id], x.val);
  }
  TARJ.clear();
}
/* si estás viendo el ejemplo y cambias de idioma, se carga el ejemplo en el nuevo idioma (el trabajo propio no se toca) */
window.addEventListener('langchange', () => { TARJ.clear(); if (S.esEjemplo) { aplicaEjemplo(); guarda(); } });

/* ── utilidades del estado ── */
const ideaDe = id => S.ideas.find(i => i.id === id);
const numIdea = id => S.ideas.findIndex(i => i.id === id) + 1;
const tuitVacio = (id, usuario, idea) => ({id, usuario, idea, estado: 'cargando', motivo: '', autor: '', texto: '', fecha: '', likes: null, rts: null, resp: null, vistas: null, fotos: [], avatarData: '', fotoData: '', citado: null,
  modo: 'tarjeta', captura: '', propia: '', incluir: true, titulo: '', comentario: '', notas: '', frase: '', val: null, ejemplo: false});
const usable = tw => tw && (tw.estado === 'ok' || !!tw.propia);
const enDiapos = tw => usable(tw) && tw.incluir;
const limpiaQ = q => String(q || '').replace(/\s+/g, ' ').trim().slice(0, 240);
const fraseOk = tw => !!(tw.frase && tw.texto && esFiel(tw.texto, tw.frase));

/* ══ pantalla 0 ══ */
function pintaInicio() {
  const n = S.ideas.length, nt = Object.values(S.tuits).filter(usable).length;
  $('inicioProj').innerHTML = n ? `${esc(t('Tienes una presentación guardada en este navegador: {0} ideas y {1} tuits.', n, nt))} <button class="btn btn-ghost btn-sm" id="btnCont" type="button">${esc(t('Continuar'))}</button>` : '';
}
$('btnStart').onclick = () => go(1);
$('btnEjemplo').onclick = () => { aplicaEjemplo(); guarda(); go(3); toast(t('Ejemplo de demostración con tuits ficticios, sin usar la IA')); };
document.addEventListener('click', e => { if (e.target.id === 'btnCont') go(S.ideas.length ? 2 : 1); });

/* ══ pantalla 1: guion ══ */
function pintaGuion() { $('guion').value = S.guion; $('tituloPres').value = S.titulo; $('cursoPres').value = S.curso; $('estadoGuion').textContent = ''; $('guionInfo').textContent = S.guion ? t('{0} palabras', nf(wc(S.guion))) : ''; }
$('guion').addEventListener('input', e => { S.guion = e.target.value; S.esEjemplo = false; $('guionInfo').textContent = t('{0} palabras', nf(wc(S.guion))); guarda(); });
$('tituloPres').addEventListener('input', e => { S.titulo = e.target.value; guarda(); });
$('cursoPres').addEventListener('input', e => { S.curso = e.target.value; guarda(); });
$('fGuion').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  $('guionInfo').innerHTML = '<span class="spin"></span> ' + esc(t('Leyendo {0}…', f.name));
  try {
    const r = await extrae(f); if (r.tipo !== 'texto' || !r.texto.trim()) throw new Error(t('No se encontró texto en «{0}».', f.name));
    S.guion = r.texto.trim(); S.esEjemplo = false; if (!S.titulo) S.titulo = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    guarda(); pintaGuion(); toast(t('Guion leído de «{0}»', f.name));
  } catch (err) { $('guionInfo').textContent = err.message; toast(err.message, 7000); }
};
/* sin IA: una idea por párrafo (o por línea, si el guion no tiene párrafos) y búsquedas con las palabras más largas */
const VACIAS = new Set('para como pero porque cuando donde entre sobre desde hasta este esta estos estas aquel cada todo todos toda todas otro otra otros otras muy mucho más menos también tiene tienen puede pueden hacer hace sido será están estar ellos ellas nuestra nuestro which there their about would could should these those other being from with that this have will your into than then them what when where while also just more most very such only over some does uma umas para pelo pela pelos pelas como mais muito também quando onde entre sobre desde até este esta isso isto aquele cada todo todos outra outro outras outros'.split(' '));
function palabrasClave(txt, n = 3) { const c = {}; for (const w of norm(txt).split(' ')) if (w.length >= 5 && !VACIAS.has(w) && !/^\d+$/.test(w)) c[w] = (c[w] || 0) + w.length; return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]); }
function separaSinIA(txt) {
  let pars = txt.split(/\n\s*\n/).map(p => p.trim()).filter(p => wc(p) >= 6);
  if (pars.length < 2) pars = txt.split('\n').map(p => p.trim()).filter(p => wc(p) >= 6);
  return pars.slice(0, 15).map(p => {
    const limpio = p.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, ''), kw = palabrasClave(limpio), tit = limpio.split(/(?<=[.!?:])\s/)[0];
    return {titulo: tit.split(/\s+/).slice(0, 9).join(' ').replace(/[.:;,]$/, '') + (wc(tit) > 9 ? '…' : ''), texto: limpio.length > 320 ? limpio.slice(0, 317) + '…' : limpio, cita: limpio.slice(0, 200),
      consultas: kw.length ? [kw.slice(0, 2).join(' ') + ` lang:${LANG_X()}`, kw.join(' OR ') + ` lang:${LANG_X()} min_faves:20`] : []};
  });
}
$('btnIdeasManual').onclick = () => {
  if (wc(S.guion) < 12) return toast(t('Escribe o pega primero el guion'));
  if (S.ideas.length && !confirm(t('Se sustituirán las ideas actuales y sus tuits. ¿Seguir?'))) return;
  S.ideas = procesaIdeas({ideas: separaSinIA(S.guion)}, S.guion); S.tuits = {}; S.esEjemplo = false; TARJ.clear(); guarda(); go(2);
  toast(t('{0} ideas, una por párrafo. Revísalas y edítalas.', S.ideas.length));
};

/* aviso previo al envío: se enseña lo que sale (ya enmascarado) y se pide confirmación una vez por sesión */
let envioRes = null;
function pideEnvio(textoEnviado, masks) {
  if (ENVIO_OK) return Promise.resolve(true);
  $('envioInfo').innerHTML = `<p class="sub" style="margin-top:0">${esc(t('Se enviarán unos {0} caracteres a {1}. Se han enmascarado {2} dato(s) personales.', nf(textoEnviado.length), PROV[getProv()].n, masks))}</p><p class="help">${esc(t('Muestra del envío:'))}</p>`;
  $('envioTxt').textContent = textoEnviado.slice(0, 3000) + (textoEnviado.length > 3000 ? '\n…' : '');
  $('envioOk').checked = false; $('envioSi').disabled = true; $('mEnvio').classList.add('on');
  return new Promise(r => { envioRes = r; });
}
function cierraEnvio(v) { $('mEnvio').classList.remove('on'); if (envioRes) { const r = envioRes; envioRes = null; if (v) ENVIO_OK = true; r(v); } }
_cierres.mEnvio = () => cierraEnvio(false);
$('envioOk').onchange = () => { $('envioSi').disabled = !$('envioOk').checked; };
$('envioSi').onclick = () => cierraEnvio(true); $('envioNo').onclick = () => cierraEnvio(false);

/* ── la IA separa el guion en ideas; el código comprueba que cada idea cita el guion ── */
const PROMPT_IDEAS = txt => `Este es el guion de una clase. Sepáralo en sus ideas principales (de 3 a 10), en el orden del guion, y para cada idea propone búsquedas para encontrar en X (Twitter) tuits reales que la refuercen.
Devuelve SOLO este JSON:
{"titulo":"título breve de la presentación","ideas":[{"titulo":"la idea en pocas palabras (máximo 8)","texto":"la idea explicada en una o dos frases","cita":"fragmento LITERAL del guion (de 8 a 30 palabras) en el que se basa la idea, copiado sin cambiar nada","consultas":["búsqueda 1","búsqueda 2","búsqueda 3"]}]}
Reglas para las búsquedas de X (búsqueda avanzada):
- De 2 a 3 por idea, de la más concreta a la más amplia; cada una debe dar resultados por sí sola.
- Usa las palabras con las que la gente tuitea sobre el tema, no lenguaje académico. Frases exactas entre comillas solo si son expresiones habituales.
- Puedes usar OR, -palabra, lang:xx (el idioma en que se tuitea sobre el tema), min_faves:N (entre 10 y 200) y -filter:replies.
- No uses from: con cuentas concretas salvo instituciones u organismos oficiales muy conocidos.
- No pongas fechas salvo que el guion hable de un momento concreto.
Usa solo lo que dice el guion: no añadas datos, cifras ni nombres que no estén en él.
${INSTR_IDIOMA()} Excepción: escribe las búsquedas de X en el idioma en que se tuitea sobre el tema (normalmente, el del guion).

GUION:
${txt}`;
/* guarda datos (no frases traducidas). Cada idea: {id, titulo, texto, cita, citaOk, consultas:[{q}], tuits:[], cand:[]} */
function procesaIdeas(raw, guion) {
  const vistas = new Set();
  return (Array.isArray(raw.ideas) ? raw.ideas : []).slice(0, 15).map(x => {
    const cita = String(x.cita || '').trim(), qs = (Array.isArray(x.consultas) ? x.consultas : []).map(limpiaQ).filter(q => q && !vistas.has(q) && vistas.add(q)).slice(0, 4);
    return {id: uid('i'), titulo: String(x.titulo || '').trim().slice(0, 140), texto: String(x.texto || '').trim().slice(0, 600), cita, citaOk: esFiel(guion, cita), consultas: qs.map(q => ({q})), tuits: [], cand: [], estadoBusca: null,
      nuevos: numerosNuevos(`${x.titulo || ''} ${x.texto || ''}`, guion)};
  }).filter(i => i.titulo || i.texto);
}
let busy = false;
$('btnIdeasIA').onclick = async () => {
  if (busy) return;
  if (wc(S.guion) < 40) return toast(t('Escribe al menos unas 40 palabras de guion'));
  if (!pideClave()) return;
  if (S.ideas.length && !confirm(t('Se sustituirán las ideas actuales y sus tuits. ¿Seguir?'))) return;
  const {t: tx, n} = scrub(S.guion);   // «t» de scrub es el texto enmascarado; no es la función de traducción
  if (!(await pideEnvio(tx, n))) return;
  busy = true; $('btnIdeasIA').disabled = true; $('estadoGuion').innerHTML = '<span class="spin"></span> ' + esc(t('Separando el guion en ideas…'));
  try {
    const raw = await llmJSON([{role: 'system', content: 'Eres un asistente docente riguroso. Respondes SOLO con JSON válido.'}, {role: 'user', content: PROMPT_IDEAS(tx)}], {max: 4000});
    const ideas = procesaIdeas(raw, S.guion); if (!ideas.length) throw new Error(t('La IA no devolvió ninguna idea. Inténtalo de nuevo o sepáralo sin IA.'));
    S.ideas = ideas; S.tuits = {}; S.esEjemplo = false; TARJ.clear();
    if (!S.titulo && raw.titulo) S.titulo = String(raw.titulo).slice(0, 140);
    await guardaYa(); go(2);
    const sin = ideas.filter(i => !i.citaOk).length;
    toast(sin ? t('{0} ideas. {1} sin cita comprobada en tu guion: revísalas.', ideas.length, sin) : t('{0} ideas, todas basadas en un fragmento literal de tu guion.', ideas.length), 6000);
  } catch (e) { $('estadoGuion').textContent = e.message; toast(e.message, 8000); }
  finally { busy = false; $('btnIdeasIA').disabled = false; }
};

/* ══ pantalla 2: ideas, búsquedas en X y tuits de cada idea ══ */
const MOTIVO = {no: 'No existe, es privado o se ha borrado.', red: 'No hay conexión con los servicios de tuits. Comprueba tu red o pega tu propia captura en el paso 3.', error: 'No se pudieron leer sus datos. Puedes reintentarlo o pegar tu propia captura en el paso 3.'};
function htmlCita(i) {
  if (!i.cita) return `<p class="fa-cita aviso">⚠ ${esc(t('Sin fragmento del guion: idea añadida a mano.'))}</p>`;
  return i.citaOk ? `<p class="fa-cita ok">✓ ${esc(t('Basada en tu guion:'))} «${esc(i.cita.length > 220 ? i.cita.slice(0, 217) + '…' : i.cita)}»</p>`
    : `<p class="fa-cita aviso">⚠ ${esc(t('La IA citó un texto que no está en tu guion: comprueba esta idea.'))} <small>«${esc(i.cita.slice(0, 160))}»</small></p>`;
}
function htmlMini(tw) {
  const cab = `<b>${esc(tw.autor || '')}</b> <span class="muted">@${esc(tw.usuario || '?')}</span>`;
  let cuerpo;
  if (tw.estado === 'cargando') cuerpo = `<span class="spin"></span> ${esc(t('Comprobando…'))}`;
  else if (tw.estado === 'error') cuerpo = `<span class="fa-chip error">✕ ${esc(t('No disponible'))}</span> ${esc(t(MOTIVO[tw.motivo] || MOTIVO.error))}`;
  else cuerpo = `<span class="fa-chip ok">✓ ${esc(tw.ejemplo ? t('Ficticio') : t('Existe'))}</span> ${esc((tw.texto || '').slice(0, 150))}${(tw.texto || '').length > 150 ? '…' : ''}`;
  return `<li class="fa-tmini" data-tid="${esc(tw.id)}"><div>${cab}<br>${cuerpo}</div><button class="btn btn-ghost btn-sm" type="button" data-act="tdel" aria-label="${esc(t('Quitar'))}">${ico('trash')}</button></li>`;
}
function htmlCand(c) {
  if (!c.ok) return `<li class="fa-cand mal"><span class="fa-chip error">✕ ${esc(t('No existe'))}</span> <code>${esc(urlTuit(c))}</code><br><small>${esc(c.motivo === 'red' ? t('No se pudo comprobar (sin conexión con los servicios de tuits).') : t('La IA propuso un enlace que no lleva a ningún tuit: probablemente lo inventó.'))}</small></li>`;
  const fr = c.frase ? (c.fraseOk ? `<span class="fa-chip ok">✓ ${esc(t('la frase que cita la IA está en el tuit'))}</span>` : `<span class="fa-chip aviso">⚠ ${esc(t('la IA describió un texto que no está en este tuit'))}</span>`) : '';
  return `<li class="fa-cand" data-cid="${esc(c.id)}"><div><span class="fa-chip ok">✓ ${esc(t('Existe'))}</span> <b>${esc(c.autor)}</b> <span class="muted">@${esc(c.usuario)}</span> ${fr}<br>${esc(c.texto.slice(0, 220))}${c.texto.length > 220 ? '…' : ''}${c.porque ? `<br><small class="muted">${esc(t('La IA:'))} ${esc(c.porque)}</small>` : ''}</div>
    <div class="fa-cand-acc"><a class="btn btn-ghost btn-sm" href="${esc(urlTuit(c))}" target="_blank" rel="noopener">${esc(t('Ver en X'))}</a><button class="btn btn-primary btn-sm" type="button" data-act="cadd">${esc(t('Añadir'))}</button><button class="btn btn-ghost btn-sm" type="button" data-act="cdel">${esc(t('Descartar'))}</button></div></li>`;
}
function htmlIdea(i, k) {
  const tws = i.tuits.map(id => S.tuits[id]).filter(Boolean);
  return `<div class="card fa-ic" data-id="${i.id}">
  <div class="fa-ic-cab"><span class="fa-num">${k + 1}</span><input type="text" class="fa-tit" data-f="titulo" value="${esc(i.titulo)}" aria-label="${esc(t('Título de la idea'))}" maxlength="140">
    <div class="fa-acc"><button class="btn btn-ghost btn-sm" type="button" data-act="up" aria-label="${esc(t('Subir'))}" ${k ? '' : 'disabled'}>${ico('up')}</button><button class="btn btn-ghost btn-sm" type="button" data-act="down" aria-label="${esc(t('Bajar'))}" ${k < S.ideas.length - 1 ? '' : 'disabled'}>${ico('down')}</button><button class="btn btn-ghost btn-sm" type="button" data-act="idel" aria-label="${esc(t('Eliminar la idea'))}">${ico('trash')}</button></div></div>
  <textarea data-f="texto" rows="2" aria-label="${esc(t('La idea'))}">${esc(i.texto)}</textarea>
  ${htmlCita(i)}${(i.nuevos || []).length ? `<p class="fa-cita aviso">⚠ ${esc(t('Cifras que no están en tu guion: {0}.', i.nuevos.join(', ')))}</p>` : ''}
  <h4 class="fa-h4">${ico('target')} ${esc(t('Búsquedas en X'))}</h4>
  <ul class="fa-qs">${i.consultas.map((c, j) => `<li><code class="fa-q">${esc(c.q)}</code><span class="fa-q-acc"><a class="btn btn-ghost btn-sm" href="${esc(urlBusquedaX(c.q, 'top'))}" target="_blank" rel="noopener">${ico('ext')} ${esc(t('Destacados'))}</a><a class="btn btn-ghost btn-sm" href="${esc(urlBusquedaX(c.q, 'live'))}" target="_blank" rel="noopener">${esc(t('Recientes'))}</a><button class="btn btn-ghost btn-sm" type="button" data-act="qdel" data-j="${j}" aria-label="${esc(t('Quitar la búsqueda'))}">×</button></span></li>`).join('') || `<li class="muted">${esc(t('Sin búsquedas: añade una.'))}</li>`}</ul>
  <div class="fa-fila"><input type="text" data-f="qnueva" placeholder="${esc(t('Otra búsqueda, p. ej.: "frase exacta" lang:es min_faves:50'))}" aria-label="${esc(t('Nueva búsqueda'))}"><button class="btn btn-ghost btn-sm" type="button" data-act="qadd">${ico('plus')} ${esc(t('Añadir'))}</button></div>
  <h4 class="fa-h4">${ico('chat')} ${esc(t('Tuits de esta idea'))} <span class="fa-chip">${tws.filter(usable).length}</span></h4>
  <textarea data-f="pega" rows="2" placeholder="${esc(t('Pega aquí uno o varios enlaces de tuits (x.com/…/status/…)'))}" aria-label="${esc(t('Enlaces de tuits'))}"></textarea>
  <div class="actions" style="margin-top:8px"><button class="btn btn-primary btn-sm" type="button" data-act="tadd">${ico('plus')} ${esc(t('Añadir tuits'))}</button><button class="btn btn-ghost btn-sm" type="button" data-act="busca">${ico('sparkles')} ${esc(t('Buscar con IA en la web'))}</button></div>
  ${i.estadoBusca ? `<p class="help" role="status">${i.estadoBusca === 'busy' ? `<span class="spin"></span> ${esc(t('Buscando en la web y comprobando cada enlace…'))}` : esc(i.estadoBusca === 'nada' ? t('La búsqueda en la web no encontró tuits. Prueba las búsquedas en X.') : t('{0} enlaces propuestos por la IA: {1} existen y {2} no.', ...i.estadoBusca))}</p>` : ''}
  ${i.cand.length ? `<ul class="fa-cands">${i.cand.map(htmlCand).join('')}</ul>` : ''}
  <ul class="fa-tlist">${tws.map(htmlMini).join('')}</ul></div>`;
}
function pintaIdeas() {
  $('ideas').innerHTML = S.ideas.length ? S.ideas.map(htmlIdea).join('') : `<div class="card"><p class="empty">${esc(t('Aún no hay ideas. Separa tu guion en el paso anterior o añade una idea a mano.'))}</p></div>`;
}
const repintaIdea = id => { const el = document.querySelector(`.fa-ic[data-id="${id}"]`), k = S.ideas.findIndex(i => i.id === id); if (el && k >= 0) el.outerHTML = htmlIdea(S.ideas[k], k); };
$('btnIdeaNueva').onclick = () => { S.ideas.push({id: uid('i'), titulo: t('Nueva idea'), texto: '', cita: '', citaOk: false, consultas: [], tuits: [], cand: [], nuevos: []}); guarda(); pintaIdeas(); };
$('ideas').addEventListener('input', e => {
  const card = e.target.closest('.fa-ic'), f = e.target.dataset.f; if (!card || !f || !['titulo', 'texto'].includes(f)) return;
  const i = ideaDe(card.dataset.id); if (i) { i[f] = e.target.value; S.esEjemplo = false; guarda(); }
});
$('ideas').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.f === 'qnueva') { e.preventDefault(); e.target.closest('.fa-ic').querySelector('[data-act="qadd"]').click(); } });
$('ideas').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const card = b.closest('.fa-ic'), i = ideaDe(card.dataset.id); if (!i) return;
  const k = S.ideas.indexOf(i), act = b.dataset.act;
  if (act === 'up' || act === 'down') { const j = act === 'up' ? k - 1 : k + 1; [S.ideas[k], S.ideas[j]] = [S.ideas[j], S.ideas[k]]; guarda(); return pintaIdeas(); }
  if (act === 'idel') { if (!confirm(t('¿Eliminar la idea «{0}» y sus tuits?', i.titulo))) return; i.tuits.forEach(id => delete S.tuits[id]); S.ideas.splice(k, 1); guarda(); return pintaIdeas(); }
  if (act === 'qdel') { i.consultas.splice(+b.dataset.j, 1); guarda(); return repintaIdea(i.id); }
  if (act === 'qadd') { const q = limpiaQ(card.querySelector('[data-f="qnueva"]').value); if (!q) return; i.consultas.push({q}); guarda(); return repintaIdea(i.id); }
  if (act === 'tadd') { const n = await añadeTuits(i.id, card.querySelector('[data-f="pega"]').value); if (!n) toast(t('No se encontró ningún enlace de tuit nuevo. Copia el enlace con Compartir → Copiar enlace.')); return; }
  if (act === 'tdel') { const tid = b.closest('[data-tid]').dataset.tid; quitaTuit(tid); guarda(); return repintaIdea(i.id); }
  if (act === 'busca') return buscaWeb(i.id);
  if (act === 'cadd' || act === 'cdel') {
    const cid = b.closest('[data-cid]').dataset.cid, c = i.cand.find(x => x.id === cid); i.cand = i.cand.filter(x => x.id !== cid);
    if (act === 'cadd' && c) { const tw = {...tuitVacio(c.id, c.usuario, i.id), ...c.datos, estado: 'ok', frase: c.fraseOk ? c.frase : ''}; S.tuits[c.id] = tw; i.tuits.push(c.id); bajaImagenes(tw).then(() => { guarda(); }); }
    guarda(); return repintaIdea(i.id);
  }
});
function quitaTuit(tid) { const tw = S.tuits[tid]; if (!tw) return; const i = ideaDe(tw.idea); if (i) i.tuits = i.tuits.filter(x => x !== tid); delete S.tuits[tid]; TARJ.delete(tid); }
/* añade los tuits de un texto pegado: se comprueban uno a uno (existen o no) y se descargan avatar y primera foto */
async function añadeTuits(ideaId, texto) {
  const i = ideaDe(ideaId); if (!i) return 0;
  const nuevos = enlacesTuit(texto).filter(x => { if (!S.tuits[x.id]) return true; toast(t('Ese tuit ya está en la idea {0}.', numIdea(S.tuits[x.id].idea))); return false; });
  if (!nuevos.length) return 0;
  for (const x of nuevos) { S.tuits[x.id] = tuitVacio(x.id, x.usuario, ideaId); i.tuits.push(x.id); }
  S.esEjemplo = false; guarda(); repintaIdea(ideaId);
  await Promise.all(nuevos.map(x => cargaTuit(x.id)));
  await guardaYa(); if (step === 2) repintaIdea(ideaId);
  const mal = nuevos.filter(x => S.tuits[x.id]?.estado === 'error').length;
  toast(mal ? t('{0} tuits añadidos; {1} no se pudieron comprobar.', nuevos.length - mal, mal) : t('{0} tuits añadidos y comprobados.', nuevos.length));
  return nuevos.length;
}
async function cargaTuit(tid) {
  const tw = S.tuits[tid]; if (!tw) return;
  tw.estado = 'cargando'; const r = await obtenTuit(tid, tw.usuario);
  if (!S.tuits[tid]) return;   // se quitó mientras se cargaba
  if (!r.ok) { tw.estado = 'error'; tw.motivo = r.motivo; return; }
  const {ok, ...datos} = r; Object.assign(tw, datos, {estado: 'ok', motivo: ''});
  await bajaImagenes(tw); TARJ.delete(tid);
}
async function bajaImagenes(tw) {
  const [av, fo] = await Promise.all([bajaImagen((tw.avatarUrl || '').replace('_normal.', '_200x200.'), 200), bajaImagen((tw.fotos || [])[0], 1200)]);
  tw.avatarData = av; tw.fotoData = fo;
}

/* ── búsqueda de tuits en la web con la herramienta de búsqueda del proveedor de IA ──
   Lo que vuelve es solo una propuesta: cada enlace se abre por código y se descartan los que no existen. */
async function llmWeb(sistema, prompt) {
  const pv = getProv(), key = getKey(pv), mod = getMod(pv); if (!key) throw new Error(t('Falta tu clave de IA. Pulsa el botón «IA», arriba.'));
  const urls = [];
  if (pv === 'openai') {
    let tipo = 'web_search';
    for (let k = 0; k < 2; k++) {
      const r = await conReintentos(() => fetch('https://api.openai.com/v1/responses', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + key}, body: JSON.stringify({model: mod, instructions: sistema, input: prompt, tools: [{type: tipo}]})}), pv);
      const tx = await r.text();
      if (!r.ok) { if (r.status === 400 && tipo === 'web_search' && /web_search|tool/i.test(tx)) { tipo = 'web_search_preview'; continue; } if (r.status === 400 && /tool|web_search/i.test(tx)) throw new Error(t('El modelo «{0}» no puede buscar en la web. Elige otro en el botón «IA».', mod)); throw httpErr(r.status, tx, pv, mod); }
      const j = JSON.parse(tx); let texto = '';
      for (const o of j.output || []) for (const c of o.content || []) if (c.type === 'output_text') { texto += c.text || ''; (c.annotations || []).forEach(a => a.url && urls.push(a.url)); }
      return {texto: texto || j.output_text || '', urls};
    }
  }
  if (pv === 'gemini') {
    const body = {contents: [{role: 'user', parts: [{text: prompt}]}], systemInstruction: {parts: [{text: sistema}]}, tools: [{google_search: {}}], generationConfig: {temperature: 0.2, maxOutputTokens: 4000}};
    const r = await conReintentos(() => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mod)}:generateContent`, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(body)}), pv);
    const tx = await r.text(); if (!r.ok) { if (r.status === 400 && /google_search|tool|grounding/i.test(tx)) throw new Error(t('El modelo «{0}» no puede buscar en la web. Elige otro en el botón «IA».', mod)); throw httpErr(r.status, tx, pv, mod); }
    const j = JSON.parse(tx), cand = j.candidates?.[0] || {};
    (cand.groundingMetadata?.groundingChunks || []).forEach(g => g.web?.uri && urls.push(g.web.uri));
    return {texto: (cand.content?.parts || []).map(p => p.text || '').join(''), urls};
  }
  /* Claude: herramienta de búsqueda del servidor, limitada a x.com y twitter.com. La versión con filtrado dinámico solo existe en los modelos recientes. */
  let tipo = /claude-(opus-(4-[6-9]|5)|sonnet-(4-6|5)|fable)/.test(mod) ? 'web_search_20260209' : 'web_search_20250305';
  const msgs = [{role: 'user', content: prompt}]; let texto = '';
  for (let k = 0; k < 4; k++) {
    const r = await conReintentos(() => fetch('https://api.anthropic.com/v1/messages', {method: 'POST', headers: {'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'},
      body: JSON.stringify({model: mod, max_tokens: 8000, system: sistema, messages: msgs, tools: [{type: tipo, name: 'web_search', max_uses: 5, allowed_domains: ['x.com', 'twitter.com']}]})}), pv);
    const tx = await r.text();
    if (!r.ok) { if (r.status === 400 && tipo === 'web_search_20260209' && /web_search|tool/i.test(tx)) { tipo = 'web_search_20250305'; continue; } if (r.status === 400 && /web_search|tool/i.test(tx)) throw new Error(t('El modelo «{0}» no puede buscar en la web. Elige otro en el botón «IA».', mod)); throw httpErr(r.status, tx, pv, mod); }
    const j = JSON.parse(tx);
    for (const b of j.content || []) {
      if (b.type === 'text') { texto += b.text || ''; (b.citations || []).forEach(c => c.url && urls.push(c.url)); }
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach(x => x.url && urls.push(x.url));
    }
    if (j.stop_reason !== 'pause_turn') break;
    msgs.push({role: 'assistant', content: j.content});   // el servidor reanuda la búsqueda donde la dejó
  }
  return {texto, urls};
}
const PROMPT_BUSCA = i => `Busca en la web tuits (publicaciones de X/Twitter) reales y públicos que refuercen esta idea de una clase.
IDEA: ${i.titulo}. ${i.texto}
Pistas de búsqueda: ${i.consultas.map(c => c.q).join(' | ') || i.titulo}
Devuelve SOLO este JSON, sin texto alrededor:
{"tuits":[{"url":"enlace completo al tuit (x.com/usuario/status/número)","frase":"fragmento literal del tuit tal como aparece en el resultado","porque":"por qué refuerza la idea, en una frase"}]}
Como máximo 6. Incluye solo enlaces de tuits que hayas visto en los resultados; nunca construyas ni completes un enlace. Si no encuentras ninguno, devuelve {"tuits":[]}.
${INSTR_IDIOMA()}`;
async function buscaWeb(ideaId) {
  const i = ideaDe(ideaId); if (!i || i.estadoBusca === 'busy') return;
  if (!pideClave()) return;
  const prompt = PROMPT_BUSCA(i); if (!(await pideEnvio(prompt, 0))) return;
  i.estadoBusca = 'busy'; i.cand = []; repintaIdea(ideaId);
  try {
    const r = await llmWeb('Eres un asistente de documentación riguroso. Solo devuelves tuits que has visto en los resultados de búsqueda.', prompt);
    const j = parseJ(r.texto) || {}, prop = Array.isArray(j.tuits) ? j.tuits : [], info = {};
    prop.forEach(p => enlacesTuit(p.url).forEach(x => { info[x.id] = {frase: String(p.frase || ''), porque: String(p.porque || '')}; }));
    const todos = enlacesTuit([prop.map(p => p.url).join(' '), r.texto, r.urls.join(' ')].join(' ')).filter(x => !S.tuits[x.id]).slice(0, 8);
    if (!todos.length) { i.estadoBusca = 'nada'; await guardaYa(); return repintaIdea(ideaId); }
    i.cand = await Promise.all(todos.map(async x => {
      const d = await obtenTuit(x.id, x.usuario), inf = info[x.id] || {};
      if (!d.ok) return {id: x.id, usuario: x.usuario, ok: false, motivo: d.motivo};
      const {ok, ...datos} = d;
      return {id: x.id, usuario: d.usuario, ok: true, autor: d.autor, texto: d.texto, frase: inf.frase || '', fraseOk: !!inf.frase && esFiel(d.texto, inf.frase), porque: inf.porque || '', datos};
    }));
    const ex = i.cand.filter(c => c.ok).length; i.estadoBusca = [i.cand.length, ex, i.cand.length - ex];
    await guardaYa();
  } catch (e) { i.estadoBusca = null; toast(e.message, 9000); }
  if (step === 2) repintaIdea(ideaId);
}

/* ══ pantalla 3: tuits ══ */
const ENCAJE = {alto: ['Encaje alto', 'ok'], medio: ['Encaje medio', 'aviso'], bajo: ['Encaje bajo', 'error'], no: ['No refuerza la idea', 'error']};
function htmlVal(tw) {
  const v = tw.val; if (!v) return `<p class="help" style="margin:4px 0">${esc(t('Sin valorar todavía.'))}</p>`;
  const e = ENCAJE[v.encaje];
  return `<p class="fa-val">${e ? `<span class="fa-chip ${e[1]}">${esc(t(e[0]))}</span> ` : ''}${esc(v.porque || '')}${(v.nuevos || []).length ? ` <span class="fa-chip aviso">⚠ ${esc(t('Cifras que no están en el tuit: {0}.', v.nuevos.join(', ')))}</span>` : ''}</p>`;
}
function htmlFrase(tw) {
  if (!tw.frase) return '';
  return fraseOk(tw) ? `<span class="fa-chip ok">✓ ${esc(t('Está en el tuit'))}</span>` : `<span class="fa-chip aviso">⚠ ${esc(t('No está en el tuit: no se resaltará'))}</span>`;
}
function htmlTuit(tw, k, n) {
  const err = tw.estado === 'error', sel = S.ideas.map(i => `<option value="${i.id}"${i.id === tw.idea ? ' selected' : ''}>${esc(t('Idea {0}', numIdea(i.id)))} · ${esc(i.titulo.slice(0, 40))}</option>`).join('');
  const modos = [['tarjeta', 'Tarjeta', !err], ['captura', 'Captura', !!tw.captura], ['propia', 'Mi captura', !!tw.propia]];
  return `<div class="card fa-tw${tw.incluir ? '' : ' fuera'}" data-tid="${esc(tw.id)}">
  <div class="fa-tw-grid"><div class="fa-tw-img"><img data-img="${esc(tw.id)}" alt="${esc(t('Tuit de {0}', '@' + (tw.usuario || '')))}" hidden><div class="fa-tw-ph" data-ph="${esc(tw.id)}">${err ? esc(t(MOTIVO[tw.motivo] || MOTIVO.error)) : '<span class="spin"></span>'}</div></div>
  <div class="fa-tw-body">
    <div class="fa-tw-cab"><div><b>${esc(tw.autor || '')}</b> <span class="muted">@${esc(tw.usuario || '?')}</span>${tw.ejemplo ? ` <span class="fa-chip aviso">${esc(t('Ficticio'))}</span>` : ` · <a href="${esc(urlTuit(tw))}" target="_blank" rel="noopener">${esc(t('Ver en X'))}</a>`}</div>
      <label class="fa-chk"><input type="checkbox" data-f="incluir"${tw.incluir ? ' checked' : ''}${usable(tw) ? '' : ' disabled'}> <span>${esc(t('Incluir en la presentación'))}</span></label></div>
    ${htmlVal(tw)}
    <div class="fa-seg" role="group" aria-label="${esc(t('Imagen del tuit'))}">${modos.map(([m, nom, ok]) => `<button type="button" data-act="modo" data-m="${m}" aria-pressed="${tw.modo === m}"${ok ? '' : ' disabled'}>${esc(t(nom))}</button>`).join('')}</div>
    <div class="actions" style="margin-top:8px">${tw.ejemplo || err ? '' : `<button class="btn btn-ghost btn-sm" type="button" data-act="captura">${ico('eye')} ${esc(tw.captura ? t('Repetir la captura (gasta 1)') : t('Captura real (gasta 1)'))}</button>`}<button class="btn btn-ghost btn-sm" type="button" data-act="propia">${ico('upload')} ${esc(t('Subir mi captura'))}</button>${err ? `<button class="btn btn-ghost btn-sm" type="button" data-act="reintenta">${ico('refresh')} ${esc(t('Reintentar'))}</button>` : ''}
      <button class="btn btn-ghost btn-sm" type="button" data-act="tup" aria-label="${esc(t('Subir'))}"${k ? '' : ' disabled'}>${ico('up')}</button><button class="btn btn-ghost btn-sm" type="button" data-act="tdown" aria-label="${esc(t('Bajar'))}"${k < n - 1 ? '' : ' disabled'}>${ico('down')}</button></div>
    <div class="grid2"><div class="field"><label>${esc(t('Idea'))}<select data-f="idea">${sel}</select></label></div>
      <div class="field"><label>${esc(t('Frase clave'))} <span data-frase="${esc(tw.id)}">${htmlFrase(tw)}</span><input type="text" data-f="frase" value="${esc(tw.frase)}" placeholder="${esc(t('Copia aquí la frase del tuit que quieres resaltar'))}"></label></div>
      <div class="field"><label>${esc(t('Título de la diapositiva'))}<input type="text" data-f="titulo" value="${esc(tw.titulo)}" placeholder="${esc(ideaDe(tw.idea)?.titulo || '')}" maxlength="160"></label></div>
      <div class="field"><label>${esc(t('Comentario en la diapositiva (opcional)'))}<input type="text" data-f="comentario" value="${esc(tw.comentario)}" maxlength="240"></label></div></div>
    <div class="field"><label>${esc(t('Notas del orador'))}<textarea data-f="notas" rows="2">${esc(tw.notas)}</textarea></label></div>
  </div></div></div>`;
}
function pintaTuits() {
  $('temaTarj').value = S.op.temaTarj; $('resalta').checked = S.op.resalta; pintaCap();
  const grupos = S.ideas.map(i => ({i, tws: i.tuits.map(id => S.tuits[id]).filter(Boolean)}));
  if (!grupos.some(g => g.tws.length)) { $('listaTuits').innerHTML = `<div class="card"><p class="empty">${esc(t('Aún no hay tuits. Pega sus enlaces en cada idea, en el paso anterior.'))}</p></div>`; return; }
  $('listaTuits').innerHTML = grupos.map(g => `<h2 class="fa-grupo"><span class="fa-num">${numIdea(g.i.id)}</span> ${esc(g.i.titulo)}</h2>${g.tws.length ? g.tws.map((tw, k) => htmlTuit(tw, k, g.tws.length)).join('') : `<p class="muted fa-vacio">${esc(t('Sin tuits en esta idea.'))}</p>`}`).join('');
  refrescaImgs();
}
const repintaTuit = tid => { const el = document.querySelector(`.fa-tw[data-tid="${tid}"]`), tw = S.tuits[tid]; if (!el || !tw) return; const i = ideaDe(tw.idea), k = i ? i.tuits.indexOf(tid) : 0; el.outerHTML = htmlTuit(tw, k, i ? i.tuits.length : 1); refrescaImgs(tid); };
/* imagen de cada tuit según su modo; las tarjetas se dibujan una vez y se guardan en memoria mientras no cambie nada de lo que muestran */
const TARJ = new Map();
const pieTarj = tw => tw.ejemplo ? t('Tuit ficticio de ejemplo') : urlTuit(tw).replace('https://', '');
async function imgDe(tid) {
  const tw = S.tuits[tid]; if (!tw) return null;
  const modo = tw.modo === 'captura' && tw.captura ? 'captura' : tw.modo === 'propia' && tw.propia ? 'propia' : tw.estado === 'ok' ? 'tarjeta' : tw.propia ? 'propia' : null;
  if (!modo) return null;
  const alt = t('Tuit de {0} (@{1}): {2}', tw.autor || '', tw.usuario || '', (tw.texto || '').slice(0, 300));
  if (modo !== 'tarjeta') { const data = tw[modo], c = TARJ.get(tid + ':' + modo); if (c && c.data === data) return c; const im = await cargaImg(data); const o = {data, w: im.naturalWidth, h: im.naturalHeight, alt}; TARJ.set(tid + ':' + modo, o); return o; }
  const frase = S.op.resalta && fraseOk(tw) ? tw.frase : '', clave = JSON.stringify([S.op.temaTarj, frase, tw.texto, tw.autor, tw.fecha, tw.likes, LANG, tw.avatarData.length, tw.fotoData.length]);
  const c = TARJ.get(tid); if (c && c.k === clave) return c;
  const data = await dibujaTarjeta(tw, {tema: S.op.temaTarj, frase, pie: pieTarj(tw)}), im = await cargaImg(data);
  const o = {k: clave, data, w: im.naturalWidth, h: im.naturalHeight, alt}; TARJ.set(tid, o); return o;
}
async function refrescaImgs(solo) {
  for (const img of $$(solo ? `img[data-img="${CSS.escape(solo)}"]` : 'img[data-img]')) {
    const tid = img.dataset.img, o = await imgDe(tid).catch(() => null), ph = document.querySelector(`[data-ph="${CSS.escape(tid)}"]`);
    if (o) { img.src = o.data; img.hidden = false; if (ph) ph.hidden = true; } else { img.hidden = true; if (ph && S.tuits[tid]?.estado !== 'error') ph.textContent = t('Sin imagen: sube tu captura.'); }
  }
}
$('temaTarj').onchange = e => { S.op.temaTarj = e.target.value; guarda(); refrescaImgs(); };
$('resalta').onchange = e => { S.op.resalta = e.target.checked; guarda(); refrescaImgs(); };
let _ft;
$('listaTuits').addEventListener('input', e => {
  const card = e.target.closest('.fa-tw'), f = e.target.dataset.f; if (!card || !['frase', 'titulo', 'comentario', 'notas'].includes(f)) return;
  const tw = S.tuits[card.dataset.tid]; if (!tw) return; tw[f] = e.target.value; if (f === 'titulo') tw.tituloEditado = true; guarda();
  if (f === 'frase') { card.querySelector('[data-frase]').innerHTML = htmlFrase(tw); clearTimeout(_ft); _ft = setTimeout(() => refrescaImgs(tw.id), 450); }
});
$('listaTuits').addEventListener('change', e => {
  const card = e.target.closest('.fa-tw'), f = e.target.dataset.f; if (!card) return; const tw = S.tuits[card.dataset.tid]; if (!tw) return;
  if (f === 'incluir') { tw.incluir = e.target.checked; card.classList.toggle('fuera', !tw.incluir); guarda(); }
  if (f === 'idea') { const de = ideaDe(tw.idea), a = ideaDe(e.target.value); if (de) de.tuits = de.tuits.filter(x => x !== tw.id); if (a) { a.tuits.push(tw.id); tw.idea = a.id; } guarda(); pintaTuits(); }
});
let ACTIVO = null;   // tuit en el que se pegará una captura con Ctrl+V
$('listaTuits').addEventListener('click', async e => {
  const card = e.target.closest('.fa-tw'); if (card) ACTIVO = card.dataset.tid;
  const b = e.target.closest('[data-act]'); if (!b || !card) return; const tw = S.tuits[card.dataset.tid]; if (!tw) return;
  const act = b.dataset.act;
  if (act === 'modo') { tw.modo = b.dataset.m; guarda(); return repintaTuit(tw.id); }
  if (act === 'propia') { ACTIVO = tw.id; return $('fPropia').click(); }
  if (act === 'reintenta') { b.disabled = true; await cargaTuit(tw.id); await guardaYa(); toast(tw.estado === 'ok' ? t('Tuit comprobado.') : t(MOTIVO[tw.motivo] || MOTIVO.error)); return repintaTuit(tw.id); }
  if (act === 'captura') { b.disabled = true; await capturaUno(tw.id); return; }
  if (act === 'tup' || act === 'tdown') { const i = ideaDe(tw.idea), k = i.tuits.indexOf(tw.id), j = act === 'tup' ? k - 1 : k + 1; [i.tuits[k], i.tuits[j]] = [i.tuits[j], i.tuits[k]]; guarda(); return pintaTuits(); }
});
async function ponPropia(tid, file) {
  const tw = S.tuits[tid]; if (!tw || !file || !/^image\//.test(file.type)) return toast(t('Eso no es una imagen.'));
  tw.propia = await ajustaImg(await blobADataURL(file), 1600, 'image/png'); tw.modo = 'propia'; if (tw.estado !== 'ok') tw.incluir = true;
  await guardaYa(); repintaTuit(tid); toast(t('Captura añadida al tuit de @{0}.', tw.usuario || '?'));
}
$('fPropia').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f && ACTIVO) ponPropia(ACTIVO, f); };
document.addEventListener('paste', e => {
  if (step !== 3 || !ACTIVO) return; const it = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith('image/')); if (!it) return;
  e.preventDefault(); ponPropia(ACTIVO, it.getAsFile());
});
/* ── capturas reales con la API de capturas ── */
function pintaCap() {
  const p = getCapProv(), C = CAPT[p];
  $('capProv').innerHTML = Object.entries(CAPT).map(([k, c]) => `<option value="${k}"${k === p ? ' selected' : ''}>${esc(c.n)} · ${esc(c.clave ? t('con clave gratuita') : t('sin clave'))}</option>`).join('');
  $('capKey').value = getCapKey(p); $('capKey').placeholder = C.clave ? t('Obligatoria') : t('Opcional (plan de pago)'); $('capLim').value = getCapLim(p);
  const u = usoCaptura(p), lim = getCapLim(p);
  $('capUso').innerHTML = `${esc(t(C.per === 'dia' ? 'Usadas hoy en este navegador: {0} de {1}.' : 'Usadas este mes en este navegador: {0} de {1}.', u, lim))} <a href="${esc(C.web)}" target="_blank" rel="noopener">${esc(t('Condiciones de {0}', C.n))}</a>`;
}
$('capProv').onchange = e => { localStorage.setItem(APP + '_cap_prov', e.target.value); pintaCap(); };
$('capKey').oninput = e => { localStorage.setItem(APP + '_cap_key_' + getCapProv(), e.target.value.trim()); };
$('capLim').onchange = e => { const v = Math.max(1, Math.round(+e.target.value || CAPT[getCapProv()].lim)); localStorage.setItem(APP + '_cap_lim_' + getCapProv(), v); pintaCap(); };
$('capEye').onclick = () => { const k = $('capKey'); k.type = k.type === 'password' ? 'text' : 'password'; };
async function capturaUno(tid, silencio = false) {
  const tw = S.tuits[tid], p = getCapProv(); if (!tw) return false;
  if (!silencio && usoCaptura(p) >= getCapLim(p) && !confirm(t('Ya has usado {0} capturas y tu cuota es de {1}. ¿Intentarlo de todos modos?', usoCaptura(p), getCapLim(p)))) { repintaTuit(tid); return false; }
  const ph = document.querySelector(`[data-ph="${CSS.escape(tid)}"]`); if (ph) { ph.hidden = false; ph.innerHTML = '<span class="spin"></span> ' + esc(t('Capturando…')); }
  try { tw.captura = await capturaTuit(tid, S.op.temaTarj); tw.modo = 'captura'; await guardaYa(); return true; }
  catch (e) { toast(e.message, 8000); if (silencio) throw e; return false; }
  finally { pintaCap(); repintaTuit(tid); }
}
$('btnCapTodos').onclick = async () => {
  const lista = Object.values(S.tuits).filter(tw => enDiapos(tw) && tw.estado === 'ok' && !tw.ejemplo && !tw.captura), p = getCapProv();
  if (!lista.length) return toast(t('No hay tuits incluidos pendientes de captura.'));
  if (!confirm(t('Vas a usar {0} capturas de tu cuota de {1} ({2} de {3} usadas). ¿Seguir?', lista.length, CAPT[p].n, usoCaptura(p), getCapLim(p)))) return;
  let ok = 0; for (const tw of lista) { try { if (await capturaUno(tw.id, true)) ok++; } catch { break; } }
  toast(t('{0} de {1} capturas hechas.', ok, lista.length), 6000);
};
/* ── la IA valora el encaje de cada tuit; el código comprueba la frase clave y las cifras ── */
const PROMPT_VAL = (ideas, tuits) => `Eres profesor o profesora y preparas una clase. Para cada tuit, valora si refuerza la idea de la clase a la que está asignado.
Devuelve SOLO este JSON:
{"valoraciones":[{"id":"id del tuit, copiado tal cual","encaje":"alto|medio|bajo|no","porque":"una frase","frase":"fragmento LITERAL del tuit (de 5 a 25 palabras) que mejor apoya la idea, copiado sin cambiar nada","titulo":"título breve para la diapositiva (máximo 9 palabras)","nota":"nota para el docente (2 o 3 frases): cómo usar el tuit en clase"}]}
Criterios: "alto" si apoya la idea de forma clara y directa; "medio" si la apoya en parte o necesita contexto; "bajo" si apenas tiene relación; "no" si la contradice o no tiene que ver (dilo en "porque": un tuit que contradice la idea puede servir como contraejemplo).
No inventes nada sobre el autor ni sobre el contexto del tuit, ni añadas datos o cifras que no estén en el tuit o en la idea.
${INSTR_IDIOMA()}

IDEAS:
${JSON.stringify(ideas)}

TUITS:
${JSON.stringify(tuits)}`;
function aplicaVal(tw, v) {
  if (!v || typeof v !== 'object') return;
  const encaje = ENCAJE[v.encaje] ? v.encaje : null, frase = String(v.frase || '').trim(), idea = ideaDe(tw.idea);
  tw.val = {encaje, porque: String(v.porque || '').trim(), frase, fraseOk: !!frase && esFiel(tw.texto, frase),
    nuevos: numerosNuevos(`${v.porque || ''} ${v.nota || ''} ${v.titulo || ''}`, `${tw.texto} ${idea?.texto || ''} ${idea?.titulo || ''} ${S.guion}`)};
  if (tw.val.fraseOk && !fraseOk(tw)) tw.frase = frase;
  if (!tw.tituloEditado && v.titulo) tw.titulo = String(v.titulo).trim().slice(0, 160);
  if (!tw.notas && v.nota) tw.notas = String(v.nota).trim();
}
$('btnValora').onclick = async () => {
  if (busy) return;
  const lista = Object.values(S.tuits).filter(tw => tw.estado === 'ok' && tw.texto);
  if (!lista.length) return toast(t('No hay tuits comprobados que valorar.'));
  if (!pideClave()) return;
  const ideas = S.ideas.map(i => ({id: i.id, titulo: i.titulo, idea: i.texto})), lotes = chunk(lista, 20);
  const muestra = PROMPT_VAL(ideas, lotes[0].map(tw => ({id: tw.id, idea_id: tw.idea, autor: tw.autor, texto: tw.texto})));
  const {t: tx, n} = scrub(muestra); if (!(await pideEnvio(tx, n))) return;
  busy = true; $('btnValora').disabled = true; let hechos = 0, sinFrase = 0;
  try {
    for (const [k, lote] of lotes.entries()) {
      $('estadoVal').innerHTML = '<span class="spin"></span> ' + esc(t('Valorando los tuits ({0} de {1})…', k * 20 + 1, lista.length));
      const {t: p} = scrub(PROMPT_VAL(ideas, lote.map(tw => ({id: tw.id, idea_id: tw.idea, autor: tw.autor, texto: tw.texto}))));
      const raw = await llmJSON([{role: 'system', content: 'Eres un asistente docente riguroso. Respondes SOLO con JSON válido.'}, {role: 'user', content: p}], {max: 5000});
      for (const v of Array.isArray(raw.valoraciones) ? raw.valoraciones : []) {
        const tw = lote.find(x => String(x.id) === String(v.id)); if (!tw) continue;   // se busca por id, no por orden
        aplicaVal(tw, v); hechos++; if (!tw.val.fraseOk) sinFrase++;
      }
      await guardaYa();
    }
    $('estadoVal').textContent = t('{0} de {1} tuits valorados. {2} sin frase clave comprobada.', hechos, lista.length, sinFrase);
  } catch (e) { $('estadoVal').textContent = e.message; toast(e.message, 8000); }
  finally { busy = false; $('btnValora').disabled = false; TARJ.forEach((v, k) => { if (!k.includes(':')) TARJ.delete(k); }); if (step === 3) pintaTuits(); }
};

/* ══ pantalla 4: diapositivas (la misma lista sirve para la pantalla, el PDF y el PowerPoint) ══ */
const fechaCorta = f => { const d = f ? new Date(f) : null; return d && !isNaN(d) ? d.toLocaleDateString(locale(), {day: 'numeric', month: 'short', year: 'numeric'}) : ''; };
async function diapositivas(todas = false) {
  const o = [], tit = S.titulo || t('Presentación');
  o.push({key: 'portada', tipo: 'portada', titulo: tit, texto: S.curso, etiqueta: t('Tuits comprobados con {0} · {1}', APP_NAME, new Date().toLocaleDateString(locale())), notas: ''});
  const fuentes = [];
  for (const [k, i] of S.ideas.entries()) {
    const tws = i.tuits.map(id => S.tuits[id]).filter(enDiapos);
    if (S.op.diapoIdea) o.push({key: 'idea:' + i.id, tipo: 'idea', etiqueta: t('Idea {0}', k + 1), titulo: i.titulo, texto: i.texto, notas: i.citaOk ? t('Del guion: «{0}»', i.cita) : ''});
    for (const tw of tws) {
      const img = await imgDe(tw.id).catch(() => null);
      o.push({key: 'tuit:' + tw.id, tipo: 'tuit', etiqueta: `${t('Idea {0}', k + 1)} · ${i.titulo}`, titulo: tw.titulo || i.titulo, texto: tw.comentario, enlace: tw.ejemplo ? '' : urlTuit(tw), notas: tw.notas, img});
      fuentes.push({texto: `${tw.autor || ''} (@${tw.usuario || '?'})${tw.fecha ? ', ' + fechaCorta(tw.fecha) : ''}${tw.ejemplo ? ' · ' + t('tuit ficticio de ejemplo') : ''}${tw.ejemplo ? '' : ':'}`, url: tw.ejemplo ? '' : urlTuit(tw)});
    }
  }
  if (S.op.fuentes && fuentes.length) chunk(fuentes, 9).forEach((f, k, a) => o.push({key: 'fuentes:' + k, tipo: 'fuentes', titulo: t('Fuentes') + (a.length > 1 ? ` (${k + 1}/${a.length})` : ''), items: f, notas: ''}));
  return todas ? o : o.filter(d => !S.ocultas[d.key]);
}
function htmlDiapo(d, tema = S.op.temaPres) {
  const cl = `fa-sl fa-sl-${d.tipo} fa-t-${tema === 'oscuro' ? 'oscuro' : 'claro'}`;
  if (d.tipo === 'portada') return `<div class="${cl}"><span class="fa-sl-bar"></span><h1>${esc(d.titulo)}</h1><p class="fa-sl-sub">${esc(d.texto || '')}</p><p class="fa-sl-pie">${esc(d.etiqueta || '')}</p></div>`;
  if (d.tipo === 'idea') return `<div class="${cl}"><p class="fa-sl-et">${esc(d.etiqueta)}</p><h1>${esc(d.titulo)}</h1><span class="fa-sl-bar"></span><p class="fa-sl-tx">${esc(d.texto || '')}</p></div>`;
  if (d.tipo === 'tuit') return `<div class="${cl}"><div class="fa-sl-izq"><p class="fa-sl-et">${esc(d.etiqueta)}</p><h2>${esc(d.titulo)}</h2>${d.texto ? `<p class="fa-sl-com">${esc(d.texto)}</p>` : ''}${d.enlace ? `<a class="fa-sl-url" href="${esc(d.enlace)}" target="_blank" rel="noopener">${esc(d.enlace.replace('https://', ''))}</a>` : ''}</div><div class="fa-sl-der">${d.img ? `<img src="${d.img.data}" alt="${esc(d.img.alt || '')}">` : ''}</div></div>`;
  return `<div class="${cl}"><h2>${esc(d.titulo)}</h2><ul>${(d.items || []).map(it => `<li>${esc(it.texto)} ${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.url)}</a>` : ''}</li>`).join('')}</ul></div>`;
}
let _pd = 0;
async function pintaDiapos() {
  $('temaPres').value = S.op.temaPres; $('diapoIdea').checked = S.op.diapoIdea; $('diapoFuentes').checked = S.op.fuentes;
  const turno = ++_pd; $('miniaturas').innerHTML = `<p class="help"><span class="spin"></span> ${esc(t('Preparando las diapositivas…'))}</p>`;
  const ds = await diapositivas(true); if (turno !== _pd) return;
  const vis = ds.filter(d => !S.ocultas[d.key]), ntw = vis.filter(d => d.tipo === 'tuit').length;
  $('resDiapos').textContent = t('{0} diapositivas, {1} con tuits.', vis.length, ntw);
  $('miniaturas').innerHTML = ds.map((d, k) => `<figure class="fa-mini${S.ocultas[d.key] ? ' oculta' : ''}" data-key="${esc(d.key)}">${htmlDiapo(d)}<figcaption><span>${k + 1}</span><label class="fa-chk"><input type="checkbox" data-f="ver"${S.ocultas[d.key] ? '' : ' checked'}> ${esc(t('Mostrar'))}</label></figcaption></figure>`).join('');
}
$('miniaturas').addEventListener('change', e => { const f = e.target.closest('[data-key]'); if (!f) return; if (e.target.checked) delete S.ocultas[f.dataset.key]; else S.ocultas[f.dataset.key] = true; f.classList.toggle('oculta', !e.target.checked); guarda(); });
$('temaPres').onchange = e => { S.op.temaPres = e.target.value; guarda(); pintaDiapos(); };
$('diapoIdea').onchange = e => { S.op.diapoIdea = e.target.checked; guarda(); pintaDiapos(); };
$('diapoFuentes').onchange = e => { S.op.fuentes = e.target.checked; guarda(); pintaDiapos(); };

/* ══ pantalla 5: presentar y descargar ══ */
function pintaFinal() {}
const nombreFichero = ext => (slug(S.titulo || 'presentacion') || 'presentacion') + '.' + ext;
let PRES = {ds: [], k: 0};
function muestraPres() {
  const d = PRES.ds[PRES.k]; if (!d) return;
  $('presEsc').innerHTML = htmlDiapo(d); $('presNum').textContent = `${PRES.k + 1} / ${PRES.ds.length}`;
  $('presNotas').textContent = d.notas || t('Sin notas en esta diapositiva.');
}
async function presenta() {
  PRES = {ds: await diapositivas(), k: 0}; if (PRES.ds.length < 2) toast(t('La presentación solo tiene la portada: añade tuits.'));
  $('pres').classList.add('on'); document.body.classList.add('fa-presentando'); muestraPres();
  try { await $('pres').requestFullscreen?.(); } catch {}
}
function salPres() { $('pres').classList.remove('on'); document.body.classList.remove('fa-presentando'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
const pasa = n => { PRES.k = Math.max(0, Math.min(PRES.ds.length - 1, PRES.k + n)); muestraPres(); };
$('btnPresentar').onclick = presenta;
$('presSig').onclick = () => pasa(1); $('presAnt').onclick = () => pasa(-1); $('presSalir').onclick = salPres;
$('presNotasBtn').onclick = () => { $('presNotas').hidden = !$('presNotas').hidden; };
$('presEsc').onclick = e => { if (!e.target.closest('a')) pasa(1); };
document.addEventListener('keydown', e => {
  if (!$('pres').classList.contains('on')) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); pasa(1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); pasa(-1); }
  else if (e.key === 'Home') { PRES.k = 0; muestraPres(); } else if (e.key === 'End') { PRES.k = PRES.ds.length - 1; muestraPres(); }
  else if (e.key.toLowerCase() === 'n') $('presNotas').hidden = !$('presNotas').hidden;
  else if (e.key === 'Escape') salPres();
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && $('pres').classList.contains('on')) salPres(); });
$('btnPptx').onclick = async () => {
  const b = $('btnPptx'); b.disabled = true;
  try { const ds = await diapositivas(); dl(nombreFichero('pptx'), await pptxDe(ds, {tema: S.op.temaPres, titulo: S.titulo, autor: APP_NAME})); toast(t('PowerPoint descargado: {0} diapositivas.', ds.length)); }
  catch (e) { toast(e.message, 8000); } finally { b.disabled = false; }
};
$('btnPdf').onclick = async () => {
  $('imprime').innerHTML = (await diapositivas()).map(d => htmlDiapo(d)).join('');
  document.body.classList.add('fa-imprimiendo'); await sleep(150); window.print();
};
window.addEventListener('afterprint', () => { document.body.classList.remove('fa-imprimiendo'); $('imprime').innerHTML = ''; });
$('btnCsv').onclick = () => {
  const filas = []; S.ideas.forEach((i, k) => i.tuits.map(id => S.tuits[id]).filter(Boolean).forEach(tw => filas.push([k + 1, i.titulo, tw.autor, '@' + (tw.usuario || ''), tw.fecha ? tw.fecha.slice(0, 10) : '', tw.ejemplo ? t('tuit ficticio de ejemplo') : urlTuit(tw), tw.texto, tw.val?.encaje ? t(ENCAJE[tw.val.encaje][0]) : '', tw.frase, tw.frase ? (fraseOk(tw) ? t('sí') : t('no')) : '', enDiapos(tw) ? t('sí') : t('no')])));
  if (!filas.length) return toast(t('Aún no hay tuits'));
  dl(nombreFichero('csv'), csvDe([t('idea'), t('titulo_idea'), t('autor'), t('usuario'), t('fecha'), t('enlace'), t('texto'), t('encaje'), t('frase_clave'), t('frase_verificada'), t('incluido')], filas), 'text/csv;charset=utf-8');
};
/* proyecto en JSON: sin claves (las claves viven en localStorage, nunca en S) */
$('btnJson').onclick = () => dl(nombreFichero('json'), JSON.stringify({formato: 'tuitia/1', app: APP_NAME, fecha: new Date().toISOString(), proyecto: S}), 'application/json');
$('fJson').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (j.formato !== 'tuitia/1' || !j.proyecto || !Array.isArray(j.proyecto.ideas)) throw new Error();
    if (S.ideas.length && !confirm(t('Se sustituirá la presentación actual. ¿Seguir?'))) return;
    S = {...nuevoS(), ...j.proyecto, op: {...OP0, ...(j.proyecto.op || {})}}; TARJ.clear(); await guardaYa(); go(S.ideas.length ? 3 : 1); toast(t('Proyecto abierto.'));
  } catch { toast(t('Ese fichero no es un proyecto de {0}.', APP_NAME), 6000); }
};
$('btnNuevo').onclick = async () => { if (!confirm(t('Se borrará la presentación de este navegador (descárgala antes si la quieres conservar). ¿Seguir?'))) return; S = nuevoS(); TARJ.clear(); await guardaYa(); go(1); };

/* ── arranque ── */
(async () => {
  const p = await cargaEstado(); if (p && Array.isArray(p.ideas)) S = {...nuevoS(), ...p, op: {...OP0, ...(p.op || {})}};
  Object.values(S.tuits).forEach(tw => { if (tw.estado === 'cargando') tw.estado = 'error', tw.motivo = 'error'; });   // una carga interrumpida al cerrar la pestaña
  iniciaUI(); if (S.esEjemplo) aplicaEjemplo(); go(0);
})();
