# Deep Learning Tutorial — Transformer interactivo

Micrositio visual para estudiar y exponer el flujo matemático de un Transformer desde cero.

## Qué incluye

- 16 misiones desde embeddings hasta decoder y generación.
- Ejemplo numérico continuo con `tamal → estaba → masacotudo`.
- Producto punto celda por celda en `QKᵀ`.
- Escalado por `√dk`, softmax y mezcla ponderada de `V`.
- Multi-head attention, `Wᴼ`, residual, LayerNorm y FFN.
- Máscara causal interactiva.
- Comparación encoder-only, decoder-only y encoder–decoder.
- Modo estudio y modo exposición 16:9.
- Lectura por voz usando Web Speech API.
- Checkpoints de comprensión.
- Navegación por teclado.

## Controles para exponer

- `←` / `→`: misión anterior / siguiente.
- `F`: pantalla completa.
- `R`: repetir la animación de la escena.
- `Espacio`: reproducir / pausar la clase automática.
- `P`: alternar modo oscuro y modo proyector claro.

También puedes abrir directamente el modo exposición con:

`?mode=present`

Y el modo claro para proyectores con:

`?mode=present&projector=1`

## Ejecutar localmente

No requiere instalación ni dependencias.

Puedes abrir `index.html` directamente en el navegador. Para evitar restricciones del navegador con algunas funciones, también puedes servir la carpeta localmente:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`.

## Estructura

- `index.html`: estructura de la experiencia.
- `styles.css`: sistema visual, responsive y modo exposición.
- `app.js`: contenido, cálculos, escenas, animaciones e interacción.
- `vercel.json`: configuración mínima de despliegue estático.

## Despliegue

El proyecto es estático y puede desplegarse directamente en Vercel sin build command.
