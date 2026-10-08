# La biblioteca del contexto

Una historia ilustrada en español para entender los Transformers. La entrada principal presenta 34 escenas breves, 8 capítulos y aproximadamente 8 minutos de narración. Seis ilustraciones originales dan un objeto y una acción a cada idea: consultas, fichas, páginas, atención repartida, un cuaderno que reúne información y una cortina que oculta el futuro.

Abrir `index.html` directamente o servir la carpeta con `python3 -m http.server 8000`. No requiere instalación ni build. El sitio es estático; las imágenes están incluidas. Algunas voces del navegador necesitan internet.

## Dos recorridos conectados

- `index.html`: historia ilustrada con acercamientos, transiciones y objetos que se pueden explorar. Cada escena muestra la relación «en la historia → en el Transformer».
- `numeros.html`: ejercicio numérico completo, con 104 explicaciones, 9 capítulos y aproximadamente 13 minutos. El enlace «Ver esta idea con números» abre directamente la operación correspondiente. «Volver a la historia» regresa a la biblioteca.

La biblioteca es una analogía, no una representación literal de cómo piensa una red. Los porcentajes mostrados provienen del ejemplo numérico; no se calculan a partir de las imágenes. Q, K y V son proyecciones de cada posición. Varias cabezas aprenden sus patrones: no tienen trabajos humanos prefijados.

## Controles

- Reproducir/pausar; retroceder 10 segundos; siguiente explicación; repetir la escena.
- Recorrido por capítulos con miniaturas de las ilustraciones.
- Tocar las etiquetas de los libros y de Q/K/V pausa la clase y muestra su función.
- Voz y velocidad: la narración usa Web Speech API y las voces disponibles en el dispositivo. No es audio pregrabado.
- Ampliar y arrastrar; doble clic para volver. Pantalla completa según soporte del navegador.
- Espacio: reproducir/pausar. Flechas: avanzar/retroceder. R: repetir. F: pantalla completa.
- Movimiento reducido: se desactivan los acercamientos progresivos y las transiciones.

## Modelo didáctico

El ejemplo usa pesos elegidos a mano, una cabeza, dmodel=dk=4, dv=2, sesgos cero, ReLU, post-LayerNorm y epsilon=1e-5. Se mantienen decimales completos en el cálculo. «Los números del ejemplo» muestra las matrices. El vocabulario final es [punto, y, pero, fin], con una proyección explícita desde el mismo Y₃. No es un modelo entrenado.

## Código y recursos

- `film/visual-story.js`: guion de la historia, objetos, relaciones y destinos numéricos.
- `film/illustrations.js`: imágenes, acercamientos y exploración de objetos.
- `film/illustrated.css`: composición ilustrada adaptable a móvil.
- `assets/illustrations/`: seis imágenes generadas con OpenAI y optimizadas como WebP; los prompts originales están en `prompts.json`.
- `film/model.js`: álgebra y valores exactos compartidos.
- `film/story.js`, `film/draw.js`: guion y animación del ejercicio numérico.
- `film/player.js`, `film/style.css`: reproductor y controles compartidos.
- `estudio.html`, `app.js`, `styles.css`, `cinema.js`, `cinema.css`: versiones anteriores conservadas.
- `AUDIT.md`: cambios y evidencia de verificación.

Vercel sirve los archivos directamente, sin backend ni dependencias de ejecución.
