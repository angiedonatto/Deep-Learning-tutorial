# Transformers, dibujados paso a paso

Una clase continua en español con 104 explicaciones breves, aproximadamente 13 minutos y 9 capítulos. Una acción matemática por momento: seleccionar, multiplicar, transportar el producto y sumar.

Abrir `index.html` directamente o servir la carpeta con `python3 -m http.server 8000`. No requiere instalación ni build. El sitio es estático y funciona sin conexión; algunas voces del navegador necesitan internet.

## Recorrido

Contexto → embedding + posición → Q/K/V → productos punto → escalado → softmax → máscara causal → mezcla de V → multi-head conceptual → Wᴼ → residual → LayerNorm → FFN → residual + LayerNorm → logits → probabilidades → siguiente token.

El ejemplo usa pesos elegidos a mano, una cabeza, dmodel=dk=4, dv=2, sesgos cero, ReLU, post-LayerNorm y epsilon=1e-5. Se mantienen decimales completos en el cálculo. `Los números del ejemplo` muestra todas las matrices. El vocabulario final es [punto, y, pero, fin], con una proyección didáctica explícita desde el mismo Y₃. No es un modelo entrenado.

## Controles

- Espacio: reproducir/pausar.
- Flechas: avanzar/retroceder 10 segundos.
- R o flecha circular: repetir la explicación actual.
- F: pantalla completa, según soporte del navegador.
- Recorrido: entrar directamente a un capítulo.
- Ampliar: activar zoom y arrastrar dentro del dibujo; doble clic restablece.
- Voz y velocidad: ajustes del reproductor. La narración depende de Web Speech API y de las voces del dispositivo.

## Código

- `film/model.js`: álgebra y valores exactos.
- `film/story.js`: guion por acciones y tiempos.
- `film/draw.js`: ilustraciones, movimiento y composición independiente para móvil.
- `film/player.js`: reproducción, narración, subtítulos y controles.
- `film/style.css`: interfaz.
- `estudio.html`, `app.js`, `styles.css`, `cinema.js`, `cinema.css`: versiones anteriores conservadas; no se cargan en la entrada principal.
- `AUDIT.md`: fallos identificados, correcciones y evidencia de verificación.

Vercel sirve los archivos directamente, sin backend ni dependencias de ejecución.
