# TuitIA

Presentaciones de clase con los tuits que refuerzan tu guion. Aplicación web de un solo fichero (`index.html`), sin servidor.

**Usar la app:** https://fborrasumh.github.io/tuitia/

**Idiomas:** español (por defecto), inglés y portugués; selector en la barra superior (o `?lang=en` / `?lang=pt` en la URL).

## Qué hace

1. **Guion.** Pegas el guion de la clase o subes un Word, PDF o PowerPoint. La IA lo divide en ideas (de 3 a 10). Cada idea lleva un fragmento literal del guion, y el código comprueba que ese fragmento está de verdad en el guion. También puedes separarlo sin IA, con una idea por párrafo.
2. **Búsquedas en X.** Para cada idea hay 2 o 3 búsquedas avanzadas de X que se pueden editar (`"frase exacta"`, `OR`, `lang:`, `min_faves:`…). Se abren en X, en Destacados o Recientes, con la sesión de cada docente.
3. **Tuits comprobados.** Pegas los enlaces de los tuits que eliges. El código lee los datos públicos de cada uno (FxTwitter; si falla, vxTwitter y después el servicio de inserción de X) y marca los que no existen, son privados o se han borrado.
4. **Búsqueda con IA en la web (opcional).** Usa la herramienta de búsqueda de tu proveedor: `web_search` de OpenAI, Google Search en Gemini y `web_search` de Claude limitada a x.com/twitter.com. Cada enlace que propone la IA se abre por código, y los que no llevan a un tuit se marcan como inventados. Si la IA describe un texto que no está en el tuit, también se avisa. Tú decides qué añadir.
5. **Valoración con IA.** Para cada tuit, la IA da su encaje con la idea (alto, medio, bajo o no), señala una frase clave y propone título y notas del orador. El código comprueba que la frase clave está en el tuit; si no está, no se usa ni se resalta. También señala las cifras que la IA menciona y no están en el tuit ni en el guion.
6. **Imagen de cada tuit.** Hay tres opciones:
   - **Tarjeta:** se dibuja en el navegador a partir de los datos públicos. Es nítida al proyectar, no gasta cuota, tiene tema claro u oscuro y puede resaltar la frase clave.
   - **Captura real:** la hace una API de capturas sobre la versión incrustada del tuit. El fondo se recorta solo, y cada tuit se captura una sola vez y se guarda.
   - **Captura propia:** se sube o se pega con Ctrl+V.
7. **Diapositivas.** La presentación tiene una portada, una diapositiva por idea (opcional), una por tuit con su título, un comentario y el enlace al original, y una diapositiva final de fuentes. Se pueden ocultar diapositivas.
8. **Presentar y descargar.**
   - Modo presentación a pantalla completa, con teclado y notas.
   - **PowerPoint (.pptx)** generado en el navegador, sin librerías ni red: títulos editables, tuits como imagen con su enlace y notas del orador.
   - **PDF** desde la ventana de impresión.
   - **CSV** de fuentes.
   - **Proyecto JSON**, que se puede volver a abrir en la app.

Incluye un **ejemplo que funciona sin clave**, en los tres idiomas, con tuits **ficticios** marcados como tales.

## Capturas con clave gratuita

| Servicio | Clave | Límite gratuito de referencia |
|---|---|---|
| Microlink | No hace falta | unas 50 al día |
| ScreenshotOne | Gratuita | unas 100 al mes |
| ApiFlash | Gratuita | unas 100 al mes |

Los límites cambian: consulta las condiciones actuales en la web de cada servicio. La app cuenta las capturas hechas en el navegador, pide confirmación antes de un lote y avisa al llegar a la cuota que indiques. Las tarjetas dibujadas en el navegador no gastan cuota: son la opción recomendada, y la captura real queda para cuando necesites el aspecto exacto de X.

## Cómo se usa la IA

Con la clave de cada persona: OpenAI, Google Gemini o Anthropic Claude. La clave se guarda solo en el navegador, y no hace falta servidor. Separar el guion es una llamada; valorar los tuits es una llamada por cada 20 tuits; cada búsqueda en la web es una llamada con la herramienta de búsqueda del proveedor, que puede costar algo más.

## Privacidad

- **En el navegador:** el guion, las ideas, los tuits, las capturas y las claves (IndexedDB y localStorage). El proyecto exportado nunca incluye claves.
- **Hacia tu proveedor de IA:**
  - el guion, con correos, DNI/NIE y teléfonos enmascarados, solo si pides separarlo con IA;
  - las ideas y el texto de los tuits, si pides valorarlos o buscarlos.
  
  Antes del primer envío de cada sesión ves una muestra de lo que sale.
- **Hacia los servicios de tuits:** el número de cada tuit (FxTwitter, vxTwitter o X), para leer sus datos públicos, y las imágenes de perfil y fotos desde `pbs.twimg.com`.
- **Hacia la API de capturas:** solo si pides una captura real, el enlace de la versión incrustada del tuit y tu clave de ese servicio.

## Límites

- **No busca en X por ti.** La API de búsqueda de X es de pago. Las búsquedas se abren en X con tu sesión y tú eliges los tuits. La búsqueda con IA en la web encuentra pocos tuits, porque X limita lo que indexan los buscadores.
- **Servicios de terceros.** Los datos de los tuits vienen de servicios públicos que espejan X (FxTwitter, vxTwitter), no de X. Si dejan de funcionar o cambian, la app marca el tuit como no disponible. Entonces puedes reintentarlo o usar tu propia captura.
- **La tarjeta es una reproducción, no una captura de X.** Lleva el enlace al original. Las métricas (me gusta, reposts, visualizaciones) son las del momento en que se leyó el tuit.
- **Lo que no comprueba el código.** Comprueba que el tuit existe y que la frase clave está en su texto. **No** comprueba que lo que dice el tuit sea cierto, ni la identidad o la fiabilidad de su autor. La valoración de encaje es orientativa.
- **Tuits en las clases.** Son contenido de terceros: cita siempre al autor y enlaza el original (la app lo hace en cada diapositiva y en la diapositiva de fuentes), y revisa que el contenido sea adecuado para tu clase.
- **No se ha probado con claves ni servicios reales.** Las pruebas automáticas simulan OpenAI, Gemini, Claude, FxTwitter, vxTwitter y las APIs de capturas. Los parámetros de las APIs de capturas siguen su documentación pública y conviene comprobarlos con una clave real antes de un uso intensivo.
- TuitIA no está vinculada a X Corp.

## Desarrollo

```bash
python3 tools/traducciones.py   # genera src/i18n.js (traducciones en/pt)
python3 build.py                # monta index.html a partir de src/ y forja/
node --check all.js
python3 tests/smoke_test.py     # Playwright + python-pptx (+ LibreOffice si está)
```

## Autoría

Fernando Borrás Rocher (Universidad Miguel Hernández de Elche). Idea original del autor.

ORCID: Fernando Borrás Rocher [0000-0002-5519-4573](https://orcid.org/0000-0002-5519-4573)

## Cómo citar

Borrás Rocher, F. (2026). *TuitIA* (v1.0.0) [Software]. (DOI en trámite)

## Licencia

MIT. Véase [LICENSE](LICENSE).
