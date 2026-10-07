# Dentro de un Transformer

Clase audiovisual interactiva en español. La portada abre una película de aproximadamente 14 minutos, con 13 capítulos, un lienzo animado, narración del navegador, subtítulos y controles de vídeo.

## Ejecutar

Abrir `index.html` directamente, o servir esta carpeta con `python3 -m http.server 8000`. No hay instalación, build, backend, fuentes remotas ni dependencias de ejecución. Los archivos funcionan sin conexión; algunas voces del sistema requieren red.

## Uso

- Reproducir/pausar: botón o espacio.
- Retroceder/avanzar 10 segundos: botones o flechas.
- Pantalla completa: botón o F (según soporte del navegador).
- Repetir capítulo: botón o R.
- Capítulos: navegación directa por tiempo; se conserva el estado de pausa.
- Ampliar dibujo: vista desplazable para leer matrices en móviles.
- Voz, subtítulos y velocidad ajustables. La voz usa Web Speech API y depende del dispositivo; no es audio humano pregrabado.
- La pestaña se pausa al pasar a segundo plano.

## Recorrido

Contexto → embeddings + posición → Q/K/V → productos punto → escala y softmax → mezcla de V → máscara causal → multi-head conceptual → proyección y residual → LayerNorm → FFN → salida del bloque → generación conceptual.

Los números se calculan en JavaScript a partir de matrices explícitas. El ejemplo usa X de 3×4, una cabeza, dk=4, dv=2, post-LayerNorm, epsilon=1e-5, gamma=1, beta=0, sesgos cero y ReLU. Se muestran cuatro decimales, pero no se redondean los cálculos intermedios. `Ver datos` expone todas las matrices, embeddings, posición y resultados. Pesos elegidos a mano para enseñanza, no parámetros de un modelo entrenado. La generación final y la segunda cabeza son ilustraciones separadas, claramente identificadas.

Resultado de atención z3 = [1.4205124847, 0.5794875153]. Resultado del bloque y3 = [0.2393147429, -1.1820710380, 1.4963231363, -0.5535668413].

## Archivos

- `index.html`, `cinema.css`, `cinema.js`: experiencia principal.
- `estudio.html`, `styles.css`, `app.js`: versión anterior, conservada como apuntes.
- `vercel.json`: despliegue estático, sin build.

El lienzo se vuelve a dibujar desde el tiempo de reproducción: pausar congela la animación y buscar un tiempo reconstruye la escena. Narración por segmento; el reproductor espera si la voz necesita más tiempo. Al buscar a mitad de segmento la voz repite ese segmento para no perder contexto.
