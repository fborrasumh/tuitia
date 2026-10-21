/* ══ PowerPoint (.pptx) escrito en el propio navegador, sin librerías ni red (Office Open XML + zipBytes de 70-report).
   Recibe la lista de diapositivas ya normalizada (la misma que pinta la presentación en pantalla y el PDF):
     {tipo:'portada'|'idea'|'tuit'|'fuentes', etiqueta, titulo, texto, img:{data,w,h,alt}, enlace, notas, items:[{texto,url}]}
   Los títulos y textos quedan como texto editable; cada tuit va como imagen; las notas del ponente, en las notas de PowerPoint. ══ */
const EMU = 914400, SW = 12192000, SH = 6858000;
const COL_PRES = {claro: {fondo: 'FFFFFF', tinta: '0F2237', gris: '5D7691', acento: 'E4572E', portada: '0F2237', portadaTx: 'FFFFFF', portadaGris: 'C3D3E2'},
  oscuro: {fondo: '0F2237', tinta: 'FFFFFF', gris: 'C3D3E2', acento: 'FF8A5C', portada: '0B1828', portadaTx: 'FFFFFF', portadaGris: 'C3D3E2'}};
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const XH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const relsXml = rs => XH + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rs.map(r => `<Relationship Id="${r.id}" Type="${R_NS}/${r.t}" Target="${_x(r.to)}"${r.ext ? ' TargetMode="External"' : ''}/>`).join('')}</Relationships>`;
const GRP = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const CLRMAP = '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
const _xf = (x, y, w, h) => `<a:xfrm><a:off x="${Math.round(x)}" y="${Math.round(y)}"/><a:ext cx="${Math.round(w)}" cy="${Math.round(h)}"/></a:xfrm>`;
const _lng = () => locale();
/* un párrafo con uno o varios fragmentos: [{tx, b, i, sz, col, link}] */
function _par(runs, {alin = 'l', esp = 0} = {}) {
  return `<a:p><a:pPr algn="${alin}">${esp ? `<a:spcBef><a:spcPts val="${esp}"/></a:spcBef>` : ''}</a:pPr>${runs.filter(r => r.tx !== '').map(r => `<a:r><a:rPr lang="${_lng()}" sz="${r.sz || 2000}"${r.b ? ' b="1"' : ''}${r.i ? ' i="1"' : ''} dirty="0"><a:solidFill><a:srgbClr val="${r.col}"/></a:solidFill><a:latin typeface="Arial"/><a:cs typeface="Arial"/>${r.link ? `<a:hlinkClick r:id="${r.link}"/>` : ''}</a:rPr><a:t>${_x(r.tx)}</a:t></a:r>`).join('')}<a:endParaRPr lang="${_lng()}" sz="${runs[0]?.sz || 2000}" dirty="0"/></a:p>`;
}
function _caja(id, nombre, x, y, w, h, pars, {ancla = 't', ajusta = true} = {}) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${_x(nombre)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${_xf(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="${ancla}">${ajusta ? '<a:normAutofit/>' : '<a:noAutofit/>'}</a:bodyPr><a:lstStyle/>${pars.join('')}</p:txBody></p:sp>`;
}
const _rect = (id, x, y, w, h, col) => `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Barra"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${_xf(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${col}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`;
const _pic = (id, rid, x, y, w, h, alt) => `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Tuit" descr="${_x(alt || '')}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${_xf(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
/* encaja una imagen w×h en la caja (x,y,W,H) sin deformarla, centrada */
function encaja(w, h, x, y, W, H) { const k = Math.min(W / w, H / h); return [x + (W - w * k) / 2, y + (H - h * k) / 2, w * k, h * k]; }
const _b64 = d => { const s = atob(d.split(',')[1]), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };

function _slideXml(d, C, rels, media) {
  const fondo = d.tipo === 'portada' ? C.portada : C.fondo; let sp = '', id = 2;
  const link = url => { const rid = 'rId' + (rels.length + 1); rels.push({id: rid, t: 'hyperlink', to: url, ext: true}); return rid; };
  const M = 0.6 * EMU;
  if (d.tipo === 'portada') {
    sp += _rect(id++, M, 2.2 * EMU, 1.1 * EMU, 0.09 * EMU, C.acento);
    sp += _caja(id++, 'Título', M, 2.45 * EMU, SW - 2 * M, 1.9 * EMU, [_par([{tx: d.titulo, b: 1, sz: 4400, col: C.portadaTx}])], {ancla: 't'});
    sp += _caja(id++, 'Subtítulo', M, 4.45 * EMU, SW - 2 * M, 0.9 * EMU, [_par([{tx: d.texto || '', sz: 2200, col: C.portadaGris}])]);
    sp += _caja(id++, 'Pie', M, SH - 0.85 * EMU, SW - 2 * M, 0.4 * EMU, [_par([{tx: d.etiqueta || '', sz: 1200, col: C.portadaGris}])]);
  } else if (d.tipo === 'idea') {
    sp += _caja(id++, 'Etiqueta', M, 1.6 * EMU, SW - 2 * M, 0.5 * EMU, [_par([{tx: (d.etiqueta || '').toUpperCase(), b: 1, sz: 1600, col: C.acento}])]);
    sp += _caja(id++, 'Título', M, 2.15 * EMU, SW - 2 * M, 1.6 * EMU, [_par([{tx: d.titulo, b: 1, sz: 4000, col: C.tinta}])]);
    sp += _rect(id++, M, 3.85 * EMU, 0.9 * EMU, 0.07 * EMU, C.acento);
    sp += _caja(id++, 'Texto', M, 4.1 * EMU, SW - 2 * M, 2 * EMU, [_par([{tx: d.texto || '', sz: 2200, col: C.gris}])]);
  } else if (d.tipo === 'tuit') {
    const izq = 4.3 * EMU;
    sp += _caja(id++, 'Etiqueta', M, 0.7 * EMU, izq - M, 0.45 * EMU, [_par([{tx: (d.etiqueta || '').toUpperCase(), b: 1, sz: 1300, col: C.acento}])]);
    sp += _caja(id++, 'Título', M, 1.2 * EMU, izq - M - 0.2 * EMU, 2.6 * EMU, [_par([{tx: d.titulo, b: 1, sz: 2800, col: C.tinta}])]);
    if (d.texto) sp += _caja(id++, 'Comentario', M, 3.9 * EMU, izq - M - 0.2 * EMU, 2 * EMU, [_par([{tx: d.texto, sz: 1700, col: C.gris, i: 1}])]);
    if (d.enlace) sp += _caja(id++, 'Enlace', M, SH - 0.75 * EMU, izq - M, 0.35 * EMU, [_par([{tx: d.enlace.replace(/^https:\/\//, ''), sz: 1100, col: C.gris, link: link(d.enlace)}])], {ajusta: false});
    if (d.img?.data) {
      const n = media.length + 1, ext = /^data:image\/png/.test(d.img.data) ? 'png' : 'jpeg', rid = 'rId' + (rels.length + 1);
      media.push({n: `image${n}.${ext}`, data: d.img.data}); rels.push({id: rid, t: 'image', to: `../media/image${n}.${ext}`});
      const [x, y, w, h] = encaja(d.img.w || 1000, d.img.h || 800, izq + 0.2 * EMU, 0.45 * EMU, SW - izq - 0.2 * EMU - 0.5 * EMU, SH - 0.9 * EMU);
      sp += _pic(id++, rid, x, y, w, h, d.img.alt);
    }
  } else if (d.tipo === 'fuentes') {
    sp += _caja(id++, 'Título', M, 0.6 * EMU, SW - 2 * M, 0.8 * EMU, [_par([{tx: d.titulo, b: 1, sz: 3200, col: C.tinta}])]);
    sp += _caja(id++, 'Lista', M, 1.6 * EMU, SW - 2 * M, SH - 2.2 * EMU, (d.items || []).map(it => _par([{tx: it.texto + ' ', sz: 1400, col: C.tinta}, {tx: it.url, sz: 1400, col: C.acento, link: link(it.url)}], {esp: 600})));
  }
  return XH + `<p:sld ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${fondo}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${GRP}${sp}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
const _notasXml = txt => XH + `<p:notes ${NS}><p:cSld><p:spTree>${GRP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Imagen de diapositiva"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notas"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${String(txt || '').split('\n').map(l => `<a:p><a:r><a:rPr lang="${_lng()}" dirty="0"/><a:t>${_x(l)}</a:t></a:r></a:p>`).join('')}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
const _tema = nombre => XH + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${nombre}"><a:themeElements><a:clrScheme name="Forja"><a:dk1><a:srgbClr val="0F2237"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="2E4B6B"/></a:dk2><a:lt2><a:srgbClr val="F3F6FA"/></a:lt2><a:accent1><a:srgbClr val="E4572E"/></a:accent1><a:accent2><a:srgbClr val="1F6FB2"/></a:accent2><a:accent3><a:srgbClr val="0E8C7A"/></a:accent3><a:accent4><a:srgbClr val="C98200"/></a:accent4><a:accent5><a:srgbClr val="6B4FD8"/></a:accent5><a:accent6><a:srgbClr val="5D7691"/></a:accent6><a:hlink><a:srgbClr val="1F6FB2"/></a:hlink><a:folHlink><a:srgbClr val="6B4FD8"/></a:folHlink></a:clrScheme><a:fontScheme name="Forja"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Forja"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

/* diapos: lista normalizada; o.tema: 'claro'|'oscuro'; o.titulo y o.autor para las propiedades del fichero → Blob .pptx */
async function pptxDe(diapos, {tema = 'claro', titulo = '', autor = ''} = {}) {
  const C = COL_PRES[tema] || COL_PRES.claro, F = {'[Content_Types].xml': '', '_rels/.rels': ''}, media = [], n = diapos.length;   // [Content_Types].xml, el primero del ZIP
  diapos.forEach((d, i) => {
    const rels = [{id: 'rId1', t: 'slideLayout', to: '../slideLayouts/slideLayout1.xml'}, {id: 'rId2', t: 'notesSlide', to: `../notesSlides/notesSlide${i + 1}.xml`}];
    F[`ppt/slides/slide${i + 1}.xml`] = _slideXml(d, C, rels, media);
    F[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = relsXml(rels);
    F[`ppt/notesSlides/notesSlide${i + 1}.xml`] = _notasXml(d.notas);
    F[`ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`] = relsXml([{id: 'rId1', t: 'notesMaster', to: '../notesMasters/notesMaster1.xml'}, {id: 'rId2', t: 'slide', to: `../slides/slide${i + 1}.xml`}]);
  });
  media.forEach(m => { F['ppt/media/' + m.n] = _b64(m.data); });
  const ov = (p, ct) => `<Override PartName="/${p}" ContentType="application/vnd.openxmlformats-officedocument.${ct}"/>`;
  F['[Content_Types].xml'] = XH + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>`
    + ov('ppt/presentation.xml', 'presentationml.presentation.main+xml') + ov('ppt/slideMasters/slideMaster1.xml', 'presentationml.slideMaster+xml') + ov('ppt/slideLayouts/slideLayout1.xml', 'presentationml.slideLayout+xml')
    + ov('ppt/notesMasters/notesMaster1.xml', 'presentationml.notesMaster+xml') + ov('ppt/theme/theme1.xml', 'theme+xml') + ov('ppt/theme/theme2.xml', 'theme+xml')
    + diapos.map((d, i) => ov(`ppt/slides/slide${i + 1}.xml`, 'presentationml.slide+xml') + ov(`ppt/notesSlides/notesSlide${i + 1}.xml`, 'presentationml.notesSlide+xml')).join('')
    + `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` + ov('docProps/app.xml', 'extended-properties+xml') + '</Types>';
  F['_rels/.rels'] = relsXml([{id: 'rId1', t: 'officeDocument', to: 'ppt/presentation.xml'}, {id: 'rId2', t: 'extended-properties', to: 'docProps/app.xml'}]).replace('</Relationships>', '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  const ahora = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  F['docProps/core.xml'] = XH + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${_x(titulo)}</dc:title><dc:creator>${_x(autor)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${ahora}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${ahora}</dcterms:modified></cp:coreProperties>`;
  F['docProps/app.xml'] = XH + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>${_x(APP_NAME)}</Application><Slides>${n}</Slides></Properties>`;
  F['ppt/presentation.xml'] = XH + `<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId3"/></p:notesMasterIdLst><p:sldIdLst>${diapos.map((d, i) => `<p:sldId id="${256 + i}" r:id="rId${10 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${SW}" cy="${SH}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="${_lng()}"/></a:defPPr></p:defaultTextStyle></p:presentation>`;
  F['ppt/_rels/presentation.xml.rels'] = relsXml([{id: 'rId1', t: 'slideMaster', to: 'slideMasters/slideMaster1.xml'}, {id: 'rId2', t: 'theme', to: 'theme/theme1.xml'}, {id: 'rId3', t: 'notesMaster', to: 'notesMasters/notesMaster1.xml'}, ...diapos.map((d, i) => ({id: 'rId' + (10 + i), t: 'slide', to: `slides/slide${i + 1}.xml`}))]);
  F['ppt/slideMasters/slideMaster1.xml'] = XH + `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GRP}</p:spTree></p:cSld>${CLRMAP}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4000"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="2000"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`;
  F['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = relsXml([{id: 'rId1', t: 'slideLayout', to: '../slideLayouts/slideLayout1.xml'}, {id: 'rId2', t: 'theme', to: '../theme/theme1.xml'}]);
  F['ppt/slideLayouts/slideLayout1.xml'] = XH + `<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="En blanco"><p:spTree>${GRP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  F['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = relsXml([{id: 'rId1', t: 'slideMaster', to: '../slideMasters/slideMaster1.xml'}]);
  F['ppt/notesMasters/notesMaster1.xml'] = XH + `<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GRP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Imagen de diapositiva"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr>${_xf(381000, 685800, 6096000, 3429000)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notas"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr>${_xf(685800, 4400550, 5486400, 3600450)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="${_lng()}"/></a:p></p:txBody></p:sp></p:spTree></p:cSld>${CLRMAP}<p:notesStyle><a:lvl1pPr marL="0" algn="l"><a:defRPr sz="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`;
  F['ppt/notesMasters/_rels/notesMaster1.xml.rels'] = relsXml([{id: 'rId1', t: 'theme', to: '../theme/theme2.xml'}]);
  F['ppt/theme/theme1.xml'] = _tema('Forja'); F['ppt/theme/theme2.xml'] = _tema('Forja notas');
  return new Blob([await zipBytes(F)], {type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
}
