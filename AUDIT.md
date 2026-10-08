# Auditoría y reconstrucción — 8 octubre 2026 UTC

## Problemas de la versión anterior

1. Dibujos casi estáticos durante explicaciones largas: añadir voz no convirtió cada operación en una acción visible.
2. Productos y sumas aparecían juntos, sin enseñar qué pareja producía cada término.
3. La misma composición de 1440 px se reducía en móvil: varios números terminaban alrededor de 6 px.
4. Subtítulos largos ocupaban demasiado espacio. Ampliar abría otra vista, interrumpiendo el seguimiento.
5. La generación final mostraba probabilidades ilustrativas sin derivarlas del bloque calculado.
6. Las pruebas de código y las capturas no demostraban por sí solas la continuidad de la reproducción.

## Cambios

- 104 explicaciones breves distribuidas en 9 capítulos, aproximadamente 13 minutos a velocidad normal; la duración real depende de la voz.
- Un producto por acción: se seleccionan las coordenadas, se mueve el producto hasta la suma y se conserva lo ya calculado.
- Entrada, atención, máscara, residual, LayerNorm y FFN mantienen el mismo conjunto de matrices.
- Una proyección explícita sobre cuatro candidatos completa el mismo cálculo hasta la selección del punto por argmax. Pesos didácticos, no un modelo entrenado.
- Composición de 640×760 para móvil, independiente de la disposición de escritorio. Subtítulos fuera del dibujo.
- Zoom con desplazamiento dentro del reproductor. Pausa, repetición de la explicación actual, avance, capítulos y pantalla completa.
- Tiempo final ajustado ante diferencias de precisión del control range.
- Separación del modelo matemático, guion, dibujo y reproductor en `film/`.

## Verificación

Chromium real con Playwright; escritorio y móvil de 390×844.

- Renderizado de los 104 momentos al 5 %, 55 % y 98 %: 312 estados, sin errores JavaScript.
- Cuatro capturas de una multiplicación durante su avance: cuatro estados visuales diferentes.
- Reproducción real a través del límite entre dos explicaciones, con actualización de subtítulo y dibujo.
- La pausa congela tanto tiempo como píxeles del dibujo.
- Repetir, siguiente explicación, capítulos, zoom, datos, pantalla completa y reinicio al terminar.
- Sin desbordamiento horizontal en móvil.
- Scores, suma de pesos, salida de atención, salida del bloque y distribución final comprobados numéricamente.

## Límites que permanecen

La narración usa Web Speech API: disponibilidad, pronunciación y naturalidad dependen del dispositivo. Las pruebas automatizadas no equivalen a escuchar todas las voces de iOS, Android y macOS. Las animaciones y subtítulos funcionan sin voz. La selección final pertenece a un ejemplo de pesos elegidos a mano y vocabulario pequeño, no a un modelo entrenado ni a una validación empírica de comprensión.

## Revisión: una historia con imágenes

La revisión del usuario mostró que mover números y diferenciar vectores por color no daba una imagen mental suficiente. La entrada principal se reconstruyó alrededor de una biblioteca ilustrada, con seis imágenes originales y 34 escenas en 8 capítulos.

- Consulta escrita → Q; ficha de catálogo → K; páginas → V.
- Atención repartida entre libros → pesos de softmax; recortes reunidos en un cuaderno → mezcla de Values.
- Cortina sobre libros futuros → máscara causal; original conservado y nueva información → conexión residual.
- Cada escena hace explícita su relación con la operación. Las etiquetas de objetos se pueden tocar y pausan la reproducción para explorarlos.
- El recorrido matemático continúa en `numeros.html`. Los enlaces desde la historia abren directamente el tipo de operación correspondiente.
- La narración identifica los límites de la analogía y el origen didáctico de los porcentajes. Ningún puntaje se calcula a partir de las ilustraciones.
- Las seis imágenes WebP conservan la composición original y pesan aproximadamente 2 MB en conjunto. Los prompts se guardan junto a ellas.

### Verificación de esta revisión

Chromium real con Playwright, escritorio de 1440×1000 y móvil de 390×844:

- Las seis ilustraciones cargan; inspección visual de portada, Q/K/V, atención, mezcla, máscara, taller y composición móvil.
- Las 34 escenas muestran su objeto y concepto; todos sus destinos existen en el guion numérico.
- El acercamiento cambia durante la reproducción. La pausa congela tanto el tiempo como la transformación de la imagen.
- Tocar un objeto abre su explicación y pausa la clase. Un enlace desde Q abre la proyección numérica.
- Porcentajes visibles en escritorio y móvil; fin de recorrido y reinicio funcionales.
- Sin errores JavaScript ni desbordamiento horizontal en la vista móvil comprobada.

Son ilustraciones con transiciones y acercamientos controlados por el reproductor, no un video renderizado ni animación de personajes. La voz sigue dependiendo del navegador. La revisión automatizada no certifica por sí misma el aprendizaje ni todas las combinaciones de dispositivo y voz.
