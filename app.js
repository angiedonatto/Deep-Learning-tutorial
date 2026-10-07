
(function(){
  'use strict';

  var $ = function(s, scope){ return (scope || document).querySelector(s); };
  var $$ = function(s, scope){ return Array.prototype.slice.call((scope || document).querySelectorAll(s)); };
  var TOKENS = ['tamal','estaba','masacotudo'];
  var Q = [[1,0,1,0],[0,1,0,1],[1,1,1,1]];
  var K = [[1,1,1,1],[1,1,0,0],[1,-1,1,-1]];
  var V = [[2,0],[0,2],[1,1]];
  var S = [[2,1,2],[2,1,-2],[4,2,0]];
  var SCALED = [[1,.5,1],[1,.5,-1],[2,1,0]];
  var A = [[.3837,.2327,.3837],[.5741,.3482,.0777],[.6652,.2447,.09]];
  var CAUSAL = [[1,0,0],[.6225,.3775,0],[.6652,.2447,.09]];

  function fmt(n,d){
    d = d == null ? 4 : d;
    var s = Number(n).toFixed(d);
    return s.replace(/\.?0+$/,'');
  }
  function vec(a){ return '(' + a.map(function(n){return fmt(n);}).join(', ') + ')'; }
  function esc(t){ return String(t).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var lessons = [
    {
      name:'La misión', group:'Empezar', scene:'intro',
      title:'¿Qué problema resuelve realmente la atención?', shape:'idea general',
      human:'No vamos a memorizar una fórmula primero. Vamos a seguir a una sola palabra: “masacotudo”. Al principio es apenas un token. Al final de un bloque será un vector que ya incorporó información de “tamal” y “estaba”. La atención es el mecanismo que le permite mirar otras posiciones y decidir cuánto tomar de cada una.',
      analogy:'Imagina que masacotudo entra a una sala y pregunta: “¿de quién están hablando?”. Puede mirar a tamal, a estaba y a sí mismo. La matemática decidirá cuánto mirar a cada uno.',
      simple:'Piensa en tres personas. Una de ellas no sabe bien qué papel cumple hasta escuchar a las otras dos. Atención es el sistema que decide a quién escuchar más y luego mezcla lo escuchado.',
      why:'Porque una palabra aislada no basta: necesitamos una representación dependiente del contexto.',
      without:'Cada posición tendría mucha menos capacidad de incorporar directamente información de otras posiciones.',
      mistake:'Decir que atención ya es comprensión humana. Matemáticamente empieza como comparaciones de vectores y promedios ponderados.',
      steps:['Frase: tamal estaba masacotudo.','T = 3 porque trabajaremos con tres posiciones.','Seguiremos la posición 3: masacotudo.','Meta: producir un nuevo vector para masacotudo usando contexto.','Ruta: números → Q/K/V → scores → escala → softmax → Values → bloque.'],
      state:'Todavía es texto. No hay álgebra: solo la palabra “masacotudo” en la posición 3.',
      anchor:'Atención = una posición mira otras posiciones y mezcla información según cuánto le importan.',
      quiz:{q:'¿Qué queremos obtener al final de la atención para masacotudo?',a:['Un vector contextual nuevo','La misma palabra escrita otra vez','Una única probabilidad'],ok:0}
    },
    {
      name:'Embedding', group:'Entrada', scene:'embedding',
      title:'Embedding: convertir una palabra en algo que sí se pueda calcular', shape:'X: T × dmodel',
      human:'Una matriz no sabe multiplicar letras. Por eso cada token recibe un vector. No pienses en ese vector como una definición de diccionario: es un paquete de coordenadas aprendidas. En nuestro dibujo usamos dmodel = 4 para poder verlo a mano.',
      analogy:'Cada palabra cambia su nombre por una ficha con cuatro perillas numéricas. El Transformer mueve perillas, no letras.',
      simple:'La computadora cambia cada palabra por una fila de números. Si hay tres palabras y cada fila tiene cuatro números, tenemos una tabla de 3 filas por 4 columnas.',
      why:'Para representar tokens con números sobre los que puedan actuar matrices aprendidas.',
      without:'No existiría una entrada numérica X.',
      mistake:'Inventar un significado humano fijo para cada coordenada del embedding.',
      steps:['T = 3 posiciones.','dmodel = 4 en el ejemplo visual.','Cada token recibe 4 números.','Una posición ocupa una fila.','Las características ocupan columnas.','Forma de X = 3 × 4.'],
      state:'Masacotudo dejó de ser solo texto: ahora es una fila x₃ con cuatro coordenadas.',
      anchor:'Fila = posición; columnas = coordenadas del embedding.',
      quiz:{q:'Si T=3 y dmodel=4, ¿qué forma tiene X?',a:['3×4','4×3','12×12'],ok:0}
    },
    {
      name:'Posición', group:'Entrada', scene:'position',
      title:'Posición: decir no solo QUÉ soy, sino DÓNDE estoy', shape:'x + PE(p)',
      human:'La atención pura no trae incorporada una regla que diga primero, segundo o tercero. Por eso sumamos una señal posicional al embedding. En la guía usamos senos y cosenos: posiciones distintas producen números distintos aunque la palabra sea la misma.',
      analogy:'Tu nombre dice quién eres; el número de tu silla dice dónde estás. Necesitamos ambas cosas.',
      simple:'A los cuatro números de la palabra les sumamos otros cuatro números que dependen de su posición. No agregamos columnas: sumamos coordenada con coordenada.',
      why:'Para que el modelo pueda distinguir el orden de los tokens.',
      without:'La atención sería ciega al orden salvo por cualquier señal externa de posición.',
      mistake:'Decir que la posición se concatena. En este esquema se suma y la dimensión sigue siendo dmodel.',
      steps:['Para d=4: PE(p)=(sin p, cos p, sin(p/100), cos(p/100)).','Para p=2: sin(2)≈0.9093.','cos(2)≈−0.4161.','sin(0.02)≈0.0200.','cos(0.02)≈0.9998.','PE(2)≈(0.9093,−0.4161,0.0200,0.9998).','Si x₃=(1,0,2,1), sumamos coordenada a coordenada.','x₃+PE(2)=(1.9093,−0.4161,2.0200,1.9998).'],
      state:'Masacotudo ahora carga contenido + posición en el mismo vector.',
      anchor:'Embedding responde QUÉ; posición responde DÓNDE.',
      quiz:{q:'¿Qué ocurre con la dimensión al sumar PE al embedding?',a:['Se mantiene en dmodel','Se duplica','Se reduce a la mitad'],ok:0}
    },
    {
      name:'Q · K · V', group:'Atención', scene:'qkv',
      title:'Query, Key y Value: tres papeles para una misma palabra', shape:'Q=XWQ · K=XWK · V=XWV',
      human:'Cada posición produce tres versiones de sí misma. Query es lo que busca; Key es cómo puede ser encontrada; Value es la información que entregará si termina siendo atendida. Q y K deciden la relación. V espera y luego transporta contenido.',
      analogy:'Biblioteca: Q es la pregunta del lector; K es la ficha de cada libro; V son las páginas que finalmente lees.',
      simple:'De cada palabra hacemos tres fichas. Una pregunta, otra sirve para comparar y otra contiene lo que se va a copiar.',
      why:'Separar el mecanismo de búsqueda del contenido transportado y permitir relaciones dirigidas.',
      without:'La misma representación tendría que cumplir simultáneamente consulta, índice y contenido.',
      mistake:'Pensar que Q, K y V son tres grupos distintos de palabras. Cada posición tiene qᵢ, kᵢ y vᵢ.',
      steps:['qᵢ = xᵢWQ.','kᵢ = xᵢWK.','vᵢ = xᵢWV.','WQ, WK y WV son matrices aprendidas diferentes.','Apilamos todas las qᵢ → Q.','Apilamos todas las kᵢ → K.','Apilamos todas las vᵢ → V.','Regla: Q compara con K; después los pesos mezclan V.'],
      state:'Masacotudo ahora tiene q₃, k₃ y v₃: pregunta, llave y contenido.',
      anchor:'Q busca · K se deja encontrar · V es lo que viaja.',
      quiz:{q:'¿Cuál contiene la información que finalmente se mezcla?',a:['V','Q','K'],ok:0}
    },
    {
      name:'Formas', group:'Atención', scene:'shapes',
      title:'Antes de multiplicar: entender las formas y por qué aparece Kᵀ', shape:'(T×dk)(dk×T)=T×T',
      human:'Las formas no son decoración: te dicen si una cuenta es posible. Q tiene una fila por token. K también. Para comparar cada fila de Q con cada fila de K, giramos K. Las dimensiones internas coinciden y el resultado tiene una celda por cada par de posiciones.',
      analogy:'Q son tres personas con fichas de cuatro datos. Kᵀ organiza tres mostradores para que cada persona pueda comparar sus cuatro datos con cada mostrador.',
      simple:'3×4 por 3×4 no encaja. Giramos la segunda tabla: queda 4×3. Ahora 3×4 por 4×3 sí encaja y da 3×3.',
      why:'Para producir todas las comparaciones entre posiciones de una sola vez.',
      without:'No podríamos escribir QKᵀ con las formas del ejemplo.',
      mistake:'Transponer Q por costumbre. En la fórmula estándar es QKᵀ.',
      steps:['Q tiene forma 3×4.','K tiene forma 3×4.','Kᵀ tiene forma 4×3.','Multiplicación: (3×4)(4×3).','Las dimensiones internas 4 y 4 coinciden.','Sobreviven las externas: 3×3.','S=QKᵀ contiene 9 scores.'],
      state:'Sabemos dónde estarán las tres comparaciones de masacotudo: en la fila 3 de S.',
      anchor:'QKᵀ produce T×T: fila pregunta, columna responde.',
      quiz:{q:'¿Qué representa Sᵢⱼ?',a:['Compatibilidad entre qᵢ y kⱼ','El Value final','Una posición'],ok:0}
    },
    {
      name:'Scores', group:'Atención', scene:'scores',
      title:'Producto punto: calcular una celda número por número', shape:'S = QKᵀ',
      human:'Para llenar Sᵢⱼ tomas la fila i de Q y la fila j de K. Multiplicas coordenadas correspondientes y sumas. Eso es producto punto. No es coseno: aquí no dividimos por las normas.',
      analogy:'Dos tarjetas con cuatro casillas. Multiplicas casilla 1 con casilla 1, casilla 2 con 2 y así. Después sumas los cuatro miniresultados.',
      simple:'Un score es cuatro multiplicaciones pequeñas y una suma.',
      why:'Convertir la compatibilidad entre dos vectores en un único número.',
      without:'No habría señal para decidir qué Keys encajan mejor con cada Query.',
      mistake:'Usar coseno o multiplicar Q por V. Los scores estándar salen de QKᵀ.',
      steps:['q₃=(1,1,1,1).','k₁=(1,1,1,1).','q₃·k₁=1×1+1×1+1×1+1×1=4.','k₂=(1,1,0,0).','q₃·k₂=1+1+0+0=2.','k₃=(1,−1,1,−1).','q₃·k₃=1−1+1−1=0.','Fila 3 de S=(4,2,0).','S=[[2,1,2],[2,1,−2],[4,2,0]].'],
      state:'q₃ puntuó las tres Keys: 4 para tamal, 2 para estaba y 0 para sí mismo.',
      anchor:'Producto punto = multiplicar coordenada con coordenada y sumar.',
      quiz:{q:'¿Cuánto vale q₃·k₂?',a:['2','4','0'],ok:0}
    },
    {
      name:'Escala', group:'Atención', scene:'scaling',
      title:'Dividir por √dₖ: evitar que softmax se vuelva demasiado extremo', shape:'S / √dk',
      human:'Cuando dk crece, un producto punto suma muchas cosas y tiende a crecer en magnitud. Si scores enormes entran directo a softmax, una posición puede quedarse casi con 1 y las demás casi 0. Dividir por √dk reduce la escala antes del softmax.',
      analogy:'Es un control de volumen antes de un amplificador. No cambia cuál canción era más fuerte; evita saturación.',
      simple:'Nuestros scores 4,2,0 se dividen por √4=2. Quedan 2,1,0.',
      why:'Mantener softmax en una zona donde sus gradientes sean útiles.',
      without:'Con dk grande, softmax puede saturarse y el entrenamiento volverse menos estable.',
      mistake:'Decir que el escalado hace que la fila sume 1. Eso lo hace softmax.',
      steps:['Fila de scores: (4,2,0).','dk=4.','√dk=2.','4/2=2.','2/2=1.','0/2=0.','Fila escalada=(2,1,0).'],
      state:'Masacotudo aún no tiene porcentajes: tiene scores escalados (2,1,0).',
      anchor:'√dₖ controla la escala; softmax convertirá a pesos.',
      quiz:{q:'Si dk=4, ¿por cuánto dividimos?',a:['2','4','16'],ok:0}
    },
    {
      name:'Softmax', group:'Atención', scene:'softmax',
      title:'Softmax: convertir scores en una distribución de atención', shape:'A = softmax(S/√dk)',
      human:'Softmax toma todos los scores de una fila. Exponencia cada uno para volverlos positivos, suma esas exponenciales y divide cada una por el total. Así los pesos quedan entre 0 y 1 y la fila suma 1.',
      analogy:'Tienes exactamente 100 fichas de atención para repartir. Los scores altos reciben más fichas, pero todos compiten por el mismo total.',
      simple:'2,1,0 pasa a e²,e¹,e⁰; luego cada valor se divide por la suma.',
      why:'Transformar compatibilidades arbitrarias en pesos positivos que suman 1.',
      without:'Los scores no serían una distribución normalizada para mezclar Values.',
      mistake:'Hacer softmax por columnas. En este ejemplo se normaliza cada fila.',
      steps:['Entrada fila 3: (2,1,0).','e²≈7.3891.','e¹≈2.7183.','e⁰=1.','Denominador=11.1074.','7.3891/11.1074≈0.6652.','2.7183/11.1074≈0.2447.','1/11.1074≈0.0900.','A₃≈(0.6652,0.2447,0.0900).','Chequeo: suma≈1.'],
      state:'Masacotudo reparte su mirada: 66.52% a tamal, 24.47% a estaba y 9% a sí mismo.',
      anchor:'Softmax convierte compatibilidad en fracción de atención.',
      quiz:{q:'¿Qué debe sumar cada fila de A?',a:['1','dk','T²'],ok:0}
    },
    {
      name:'Values', group:'Atención', scene:'values',
      title:'A·V: ahora sí viaja la información', shape:'Z = AV',
      human:'Hasta softmax solo decidimos a quién mirar. Ahora usamos esos pesos para mezclar Values. Cada Value se multiplica por su peso y luego sumamos. El resultado z₃ es la nueva representación contextual dentro de esta cabeza.',
      analogy:'Tres personas hablan. Ajustas el volumen de cada micrófono y luego mezclas las señales.',
      simple:'Multiplica V₁ por 0.6652, V₂ por 0.2447 y V₃ por 0.09. Después suma coordenada por coordenada.',
      why:'Transportar y combinar el contenido de las posiciones relevantes.',
      without:'Sabríamos a quién mirar, pero no incorporaríamos su contenido.',
      mistake:'Mezclar K en este paso. Los pesos multiplican V.',
      steps:['A₃=(0.6652,0.2447,0.0900).','v₁=(2,0), v₂=(0,2), v₃=(1,1).','z₃=0.6652v₁+0.2447v₂+0.0900v₃.','Coord.1: 0.6652×2+0.2447×0+0.0900×1.','=1.3304+0+0.0900≈1.4205.','Coord.2: 0.6652×0+0.2447×2+0.0900×1.','=0+0.4894+0.0900≈0.5795.','z₃≈(1.4205,0.5795).'],
      state:'Masacotudo ya es z₃=(1.4205,0.5795): mezcla ponderada del contexto.',
      anchor:'Q y K encuentran; softmax decide; V transporta.',
      quiz:{q:'¿Por qué z₃ contiene mucha información de tamal?',a:['Porque el peso sobre V₁ es grande','Porque K₁ se copia','Porque V se vuelve Q'],ok:0}
    },
    {
      name:'La fórmula', group:'Atención', scene:'formula',
      title:'Juntar todo: leer la fórmula sin que parezca jeroglífico', shape:'softmax(QKᵀ/√dk)V',
      human:'La fórmula completa ya no contiene ninguna operación nueva. Es la historia recorrida comprimida en una línea: Q busca en K, se escala, softmax reparte atención y esos pesos mezclan V.',
      analogy:'Es como comprimir una receta de seis pasos en el nombre del plato.',
      simple:'Lee de izquierda a derecha: compara → baja escala → convierte a pesos → trae Values.',
      why:'Escribir de forma compacta scaled dot-product attention.',
      without:'Tendríamos pasos sueltos sin una notación compacta.',
      mistake:'Leer la fórmula como si todo ocurriera a la vez. Hay una secuencia clara.',
      steps:['S=QKᵀ.','Ŝ=S/√dk.','A=softmax(Ŝ) por filas.','Z=AV.','Attention(Q,K,V)=softmax(QKᵀ/√dk)V.','A tiene forma T×T.','Z tiene forma T×dv.'],
      state:'Masacotudo ya atravesó una atención completa.',
      anchor:'Buscar → escalar → repartir → traer.',
      quiz:{q:'¿Qué ocurre inmediatamente antes de multiplicar por V?',a:['Softmax','LayerNorm','FFN'],ok:0}
    },
    {
      name:'Multi-head', group:'Bloque', scene:'heads',
      title:'Multi-head: varias maneras de mirar al mismo tiempo', shape:'h cabezas → concat → WO',
      human:'Una cabeza tiene una sola forma de proyectar Q, K y V. Multi-head crea varias versiones independientes del problema. Cada cabeza puede aprender relaciones distintas. Luego concatenamos y Wᴼ aprende cómo combinarlas.',
      analogy:'Varios detectives leen el mismo testimonio con preguntas distintas y después comparan notas.',
      simple:'Repetimos atención varias veces con matrices distintas; juntamos resultados; Wᴼ los mezcla.',
      why:'Dar al modelo varios patrones de relación simultáneos.',
      without:'Una cabeza tendría que representar todas las relaciones en una sola distribución.',
      mistake:'Creer que cada cabeza recibe palabras diferentes. Todas ven la misma secuencia.',
      steps:['Cabeza 1: pesos (0.7,0.2,0.1).','Con V produce Z¹=(0.8,0.3).','Cabeza 2: pesos (0.3,0.4,0.3).','Produce Z²=(0.6,0.7).','Concatenamos=(0.8,0.3,0.6,0.7).','Aplicamos Wᴼ.','Wᴼ mezcla cabezas y devuelve dmodel.'],
      state:'Masacotudo puede tener varias lecturas paralelas del contexto.',
      anchor:'Multi-head = varias miradas + mezcla final Wᴼ.',
      quiz:{q:'¿Qué hace Wᴼ?',a:['Mezcla cabezas y devuelve dmodel','Crea tokens','Aplica la máscara'],ok:0}
    },
    {
      name:'Residual', group:'Bloque', scene:'residual',
      title:'Wᴼ + residual: conservar la entrada y añadir una corrección', shape:'x + MultiHead(x)',
      human:'Después de Wᴼ aparece una idea muy simple: no reemplazamos x; hacemos x + corrección. El camino residual permite que la información original y los gradientes tengan una ruta directa.',
      analogy:'Editas un documento sobre una copia del original: aprendes qué corregir en lugar de reescribir todo.',
      simple:'La atención propone un cambio. El residual suma ese cambio al vector original.',
      why:'Conservar información y facilitar optimización profunda.',
      without:'Cada bloque tendría que reconstruir toda la representación desde cero.',
      mistake:'Sumar tensores de distinta forma. Wᴼ devuelve dmodel precisamente para que la suma tenga sentido.',
      steps:['z₃=(1.4205,0.5795).','Con Wᴼ del ejercicio: a=(1.4205,0.5795,1.4205,0.5795).','x₃=(1,0,2,1).','x₃+a=(2.4205,0.5795,3.4205,1.5795).','Ese vector pasa a LayerNorm en el ejemplo post-LN.'],
      state:'Masacotudo conserva su vector original y añade la corrección de atención.',
      anchor:'Residual = original + corrección.',
      quiz:{q:'¿Por qué Wᴼ devuelve dmodel?',a:['Para poder sumar con x','Para que softmax sume 1','Para crear PE'],ok:0}
    },
    {
      name:'LayerNorm', group:'Bloque', scene:'layernorm',
      title:'LayerNorm: normalizar una posición sin mezclarla con otras', shape:'(x−μ)/√(σ²+ε)',
      human:'LayerNorm toma las coordenadas de una sola posición. Calcula su media, mide dispersión y reescala. En el cálculo manual omitimos gamma, beta y epsilon para ver la mecánica.',
      analogy:'Cuatro voces con volúmenes distintos: centras el volumen del grupo y lo pones en una escala comparable.',
      simple:'Saca el promedio de los cuatro números; réstalo a cada uno; divide por la desviación estándar.',
      why:'Controlar escalas internas y estabilizar el entrenamiento.',
      without:'Las magnitudes pueden variar mucho entre capas y dificultar la optimización.',
      mistake:'Usar todos los tokens para la media. LayerNorm trabaja sobre las características de cada posición.',
      steps:['r=(2.4205,0.5795,3.4205,1.5795).','μ=2.0000.','r−μ=(0.4205,−1.4205,1.4205,−0.4205).','σ²≈1.0973.','σ≈1.0475.','Dividimos cada coordenada centrada por 1.0475.','x′₃≈(0.4014,−1.3560,1.3560,−0.4014).'],
      state:'Masacotudo está contextualizado y sus coordenadas están centradas y reescaladas.',
      anchor:'LayerNorm: dentro de una fila, restar media y dividir por desviación.',
      quiz:{q:'¿Qué usa LayerNorm para calcular μ aquí?',a:['Las 4 coordenadas de una posición','Todo el batch','Solo V'],ok:0}
    },
    {
      name:'FFN', group:'Bloque', scene:'ffn',
      title:'Feed-Forward: después de hablar con otros, cada token piensa solo', shape:'dmodel → dff → dmodel',
      human:'La atención fue la parte social. El FFN cambia de lógica: cada fila se procesa por separado con la misma pequeña red neuronal. Expande, aplica una no linealidad y vuelve a comprimir.',
      analogy:'Primero hubo reunión; después cada persona vuelve a su escritorio a procesar lo escuchado.',
      simple:'4 números → 8 números → ReLU apaga negativos → 4 números otra vez.',
      why:'Agregar capacidad no lineal de transformación por posición.',
      without:'El bloque tendría mucha menos capacidad para transformar representaciones.',
      mistake:'Dibujar comunicación entre palabras dentro del FFN. Aquí las filas no se mezclan.',
      steps:['x′₃=(0.4014,−1.3560,1.3560,−0.4014).','x′₃W₁=(0.4014,−1.3560,1.3560,−0.4014,1.7575,−1.7575,1.7575,−1.7575).','ReLU(x)=max(0,x).','Queda (0.4014,0,1.3560,0,1.7575,0,1.7575,0).','Multiplicamos por W₂.','f=(2.1589,1.7575,3.1135,1.7575).','Segundo residual=(2.5603,0.4014,4.4696,1.3560).','Segunda LN: μ≈2.1968, σ≈1.5189.','y₃≈(0.2393,−1.1821,1.4963,−0.5536).'],
      state:'Masacotudo terminó un bloque: atención → residual/LN → FFN → residual/LN.',
      anchor:'Atención comunica; FFN transforma cada posición.',
      quiz:{q:'¿Dónde se mezclan directamente posiciones distintas?',a:['En atención','En FFN','En LayerNorm'],ok:0}
    },
    {
      name:'Masking', group:'Decoder', scene:'mask',
      title:'Máscara causal: aprender a escribir sin mirar la respuesta', shape:'softmax(S/√dk + M)',
      human:'Durante entrenamiento tenemos la frase completa, pero cada posición del decoder debe actuar como si el futuro todavía no existiera. La máscara pone −∞ en scores hacia posiciones futuras. Softmax convierte exp(−∞) en cero.',
      analogy:'Es un examen con una cartulina que tapa las respuestas futuras.',
      simple:'Lo que está a la derecha se marca como prohibido. Prohibido = −∞. Después softmax le da peso 0.',
      why:'Evitar fuga de información y respetar la causalidad de generación.',
      without:'El modelo podría leer el token futuro correcto durante entrenamiento.',
      mistake:'Aplicar la máscara después de softmax. Debe ir antes.',
      steps:['Mᵢⱼ=0 si j≤i.','Mᵢⱼ=−∞ si j>i.','Calculamos S/√dk + M.','Futuro queda −∞.','exp(−∞)=0.','Fila 1=(1,0,0).','Fila 2=(0.6225,0.3775,0).','Fila 3=(0.6652,0.2447,0.0900).','La matriz es triangular inferior.'],
      state:'Masacotudo puede usar pasado y presente; ninguna posición anterior puede leerlo antes de tiempo.',
      anchor:'Futuro → −∞ antes de softmax → peso 0.',
      quiz:{q:'¿Dónde se aplica la máscara causal?',a:['A los scores antes de softmax','A V después de mezclar','Al embedding después del FFN'],ok:0}
    },
    {
      name:'Transformer', group:'Mapa final', scene:'architecture',
      title:'El mapa completo: encoder, decoder y generación token a token', shape:'N bloques + vocabulario',
      human:'Ahora podemos alejarnos del microscopio. Un encoder deja ver toda la entrada. Un decoder-only usa atención causal para predecir el siguiente token. Un encoder–decoder añade cross-attention: Q viene del decoder y K,V vienen del encoder.',
      analogy:'Encoder: leer todo. Decoder: escribir sin mirar lo que aún no existe. Encoder–decoder: una persona lee y otra escribe consultando sus notas.',
      simple:'Un modelo grande repite muchas veces los bloques que ya entendimos y al final convierte un vector en probabilidades sobre el vocabulario.',
      why:'Organizar atención y FFN en arquitecturas útiles para leer, generar o transformar secuencias.',
      without:'Tendríamos atención aislada, no un modelo profundo.',
      mistake:'Tratar encoder y decoder como sinónimos.',
      steps:['Tokens → embeddings + posición.','Bloque: atención → residual/norm → FFN → residual/norm.','Encoder-only: atención bidireccional.','Decoder-only: atención causal.','Encoder–decoder: causal + cross-attention.','Después de N bloques salen representaciones finales.','Proyección a vocabulario produce logits.','Softmax produce probabilidades.','Se genera un token.','El token se agrega al contexto y se repite.'],
      state:'Masacotudo recorrió la historia completa: texto → números → atención → bloque → representación → predicción.',
      anchor:'Un Transformer grande repite la misma historia básica muchas veces y a mayor escala.',
      quiz:{q:'En cross-attention, ¿de dónde suelen venir K y V?',a:['Del encoder','Del vocabulario','De la máscara'],ok:0}
    }
  ];

  var state = {
    lesson:0, micro:0, showAll:false, stars:0, solved:{},
    playing:false, timer:null, mode:localStorage.getItem('transformer-mode') || 'study',
    speaking:false
  };

  var els = {
    missionList:$('#missionList'), starCounter:$('#starCounter b'),
    progressFill:$('#progressFill'), progressText:$('#progressText'),
    chapterLabel:$('#chapterLabel'), lessonTitle:$('#lessonTitle'),
    shapeBadge:$('#shapeBadge'), humanText:$('#humanText'),
    analogyText:$('#analogyText'), scene:$('#scene'), anchorText:$('#anchorText'),
    microCounter:$('#microCounter'), microSteps:$('#microSteps'),
    microPrev:$('#microPrev'), microNext:$('#microNext'), microAll:$('#microAll'),
    whyText:$('#whyText'), withoutText:$('#withoutText'), mistakeText:$('#mistakeText'),
    tokenState:$('#tokenState'), journeyBar:$('#journeyBar'),
    quizQuestion:$('#quizQuestion'), quizOptions:$('#quizOptions'),
    quizFeedback:$('#quizFeedback'), prevBtn:$('#prevBtn'), nextBtn:$('#nextBtn'),
    playBtn:$('#playBtn'), speedSelect:$('#speedSelect'), modeBtn:$('#modeBtn'),
    modeLabel:$('#modeLabel'), fullscreenBtn:$('#fullscreenBtn'), replayBtn:$('#replayBtn'),
    simplifyBtn:$('#simplifyBtn'), whyBtn:$('#whyBtn'), speakBtn:$('#speakBtn'),
    focusModal:$('#focusModal'), focusClose:$('#focusClose'), focusKicker:$('#focusKicker'),
    focusTitle:$('#focusTitle'), focusText:$('#focusText'), focusExtra:$('#focusExtra'),
    toast:$('#toast')
  };

  function svgDefs(){
    return '<defs><marker id="arr" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9Z" fill="context-stroke"></path></marker></defs>';
  }
  function tokenFigure(x,y,label,sub,color,active){
    return '<g transform="translate('+x+' '+y+')" class="'+(active?'floaty':'')+'"><circle cx="0" cy="0" r="52" fill="var(--panel)" stroke="'+color+'" stroke-width="'+(active?4:2)+'"></circle><circle cx="-17" cy="-8" r="4" fill="var(--text)"></circle><circle cx="17" cy="-8" r="4" fill="var(--text)"></circle><path d="M-18 13 Q0 28 18 13" fill="none" stroke="var(--text)" stroke-width="3" stroke-linecap="round"></path><text x="0" y="78" text-anchor="middle" class="scene-label">'+label+'</text><text x="0" y="97" text-anchor="middle" class="scene-note">'+sub+'</text></g>';
  }
  function sceneIntro(){
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="42" text-anchor="middle" class="scene-title">LA PREGUNTA DE TODA ESTA AVENTURA</text><text x="500" y="78" text-anchor="middle" class="scene-big">¿Cómo consigue “masacotudo” entender su contexto?</text>'+tokenFigure(190,230,'tamal','posición 0','var(--q)',false)+tokenFigure(500,230,'estaba','posición 1','var(--k)',false)+tokenFigure(810,230,'masacotudo','posición 2','var(--v)',true)+'<path class="soft-arrow beam" d="M775 205 C680 115 595 135 540 195" fill="none" stroke="var(--attn)" stroke-width="7" marker-end="url(#arr)"></path><path class="soft-arrow beam" d="M775 250 C620 350 360 350 232 255" fill="none" stroke="var(--attn)" stroke-width="12" marker-end="url(#arr)"></path><text x="500" y="405" text-anchor="middle" class="scene-label">La atención permite que una posición lea directamente otras posiciones.</text><text x="500" y="435" text-anchor="middle" class="scene-note">Seguiremos siempre a la misma palabra para no perder el hilo.</text></svg>';
  }
  function sceneEmbedding(){
    var ys=[105,235,365], colors=['var(--q)','var(--k)','var(--v)','var(--attn)'];
    var rows=TOKENS.map(function(t,i){
      var cells=[0,1,2,3].map(function(j){return '<g transform="translate('+(330+j*125)+' 0)"><rect width="95" height="70" rx="14" fill="'+colors[j]+'" opacity=".22" stroke="'+colors[j]+'" stroke-width="2"></rect><text x="47.5" y="31" text-anchor="middle" class="scene-mono" font-size="15">x'+(j+1)+'</text><text x="47.5" y="51" text-anchor="middle" class="scene-note">coord. '+(j+1)+'</text></g>';}).join('');
      return '<g transform="translate(70 '+ys[i]+')"><rect width="180" height="70" rx="18" fill="var(--panel)" stroke="var(--line)" stroke-width="2"></rect><text x="90" y="43" text-anchor="middle" class="scene-label">'+t+'</text><path class="soft-arrow" d="M190 35 H295" fill="none" stroke="var(--muted)" stroke-width="3" marker-end="url(#arr)"></path>'+cells+'</g>';
    }).join('');
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">PALABRA → VECTOR</text>'+rows+'<text x="835" y="475" text-anchor="middle" class="scene-note">dmodel=4 → cuatro coordenadas por posición</text></svg>';
  }
  function scenePosition(){
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">CONTENIDO + UBICACIÓN</text><g transform="translate(70 110)"><rect width="250" height="120" rx="22" fill="var(--panel)" stroke="var(--v)" stroke-width="3"></rect><text x="125" y="38" text-anchor="middle" class="scene-label">Embedding de masacotudo</text><text x="125" y="75" text-anchor="middle" class="scene-mono" font-size="18">(1, 0, 2, 1)</text><text x="125" y="101" text-anchor="middle" class="scene-note">qué palabra es</text></g><text x="365" y="180" class="scene-big">+</text><g transform="translate(410 95)"><rect width="310" height="150" rx="22" fill="var(--panel)" stroke="var(--attn)" stroke-width="3"></rect><text x="155" y="32" text-anchor="middle" class="scene-label">PE(p=2)</text><path class="draw" d="M35 83 C70 35 105 130 145 80 S220 35 272 82" fill="none" stroke="var(--attn)" stroke-width="5"></path><text x="155" y="124" text-anchor="middle" class="scene-mono" font-size="12">(0.9093, −0.4161, 0.0200, 0.9998)</text></g><path class="soft-arrow" d="M565 265 V320" fill="none" stroke="var(--text)" stroke-width="3" marker-end="url(#arr)"></path><g transform="translate(260 330)"><rect width="480" height="100" rx="22" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="3"></rect><text x="240" y="34" text-anchor="middle" class="scene-label">Vector que entra al Transformer</text><text x="240" y="68" text-anchor="middle" class="scene-mono" font-size="17">(1.9093, −0.4161, 2.0200, 1.9998)</text></g></svg>';
  }
  function sceneQKV(){
    var data=[['Q','¿QUÉ BUSCO?','Query · pregunta','var(--q)',160],['K','¿QUÉ OFREZCO?','Key · llave','var(--k)',500],['V','¿QUÉ APORTO?','Value · contenido','var(--v)',840]];
    var boxes=data.map(function(o){return '<path class="soft-arrow beam" d="M500 142 C500 190 '+o[4]+' 175 '+o[4]+' 225" fill="none" stroke="'+o[3]+'" stroke-width="4" marker-end="url(#arr)"></path><g transform="translate('+(o[4]-115)+' 230)"><rect width="230" height="165" rx="24" fill="var(--panel)" stroke="'+o[3]+'" stroke-width="4"></rect><text x="115" y="54" text-anchor="middle" fill="'+o[3]+'" font-size="44" font-weight="900">'+o[0]+'</text><text x="115" y="89" text-anchor="middle" class="scene-label">'+o[1]+'</text><text x="115" y="118" text-anchor="middle" class="scene-note">'+o[2]+'</text><text x="115" y="145" text-anchor="middle" class="scene-mono" font-size="13">x₃ · W'+o[0]+'</text></g>';}).join('');
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">UNA POSICIÓN, TRES TRABAJOS</text><g transform="translate(400 70)"><rect width="200" height="72" rx="18" fill="var(--panel)" stroke="var(--line)" stroke-width="2"></rect><text x="100" y="31" text-anchor="middle" class="scene-label">x₃ · masacotudo</text><text x="100" y="52" text-anchor="middle" class="scene-note">misma entrada</text></g>'+boxes+'<text x="500" y="455" text-anchor="middle" class="scene-label">Q compara con K. V espera. V viaja después.</text></svg>';
  }
  function sceneShapes(){
    return '<div class="scene-ui fade-up"><div class="big-formula"><span class="color-q">Q</span> · <span class="color-k">Kᵀ</span> → (T×dₖ)(dₖ×T) → T×T</div><div class="flow-map" style="margin-top:24px"><div class="flow-node q-bg"><strong>Q</strong><span>3 × 4</span><span>3 preguntas</span></div><div class="flow-arrow">×</div><div class="flow-node k-bg"><strong>Kᵀ</strong><span>4 × 3</span><span>K girada</span></div><div class="flow-arrow">=</div><div class="flow-node attn-bg"><strong>S</strong><span>3 × 3</span><span>9 comparaciones</span></div></div><div class="scene-grid"><div class="visual-card q-bg"><h3>Fila i</h3><p>Posición que pregunta.</p></div><div class="visual-card k-bg"><h3>Columna j</h3><p>Key consultada.</p></div><div class="visual-card attn-bg"><h3>Sᵢⱼ</h3><p>Un número de compatibilidad.</p></div></div><div class="math-explainer" style="margin-top:18px"><strong>Chequeo de dimensiones</strong><pre>Q = 3×4\nK = 3×4\nKᵀ = 4×3\nQKᵀ = (3×4)(4×3) = 3×3</pre></div></div>';
  }
  function scoreExplain(i,j){
    var q=Q[i],k=K[j], products=q.map(function(n,p){return n*k[p];}), terms=q.map(function(n,p){return n+'×'+k[p];});
    return '<span class="mini-kicker">CELDA S'+(i+1)+(j+1)+'</span><h3 style="margin:5px 0 10px">q'+(i+1)+' · k'+(j+1)+'</h3><pre>q'+(i+1)+' = '+vec(q)+'\nk'+(j+1)+' = '+vec(k)+'\n\n'+terms.join(' + ')+'\n= '+products.join(' + ')+'\n= '+S[i][j]+'</pre><p class="scene-note">Fila '+(i+1)+' pregunta; columna '+(j+1)+' aporta su Key. '+S[i][j]+' todavía es score, no porcentaje.</p>';
  }
  function sceneScores(){
    var cells='<div></div><div style="text-align:center;color:var(--k);font-weight:850">K₁</div><div style="text-align:center;color:var(--k);font-weight:850">K₂</div><div style="text-align:center;color:var(--k);font-weight:850">K₃</div>';
    S.forEach(function(row,i){
      cells+='<div style="color:var(--q);font-weight:850">Q'+(i+1)+'</div>';
      row.forEach(function(n,j){cells+='<button class="matrix-cell '+(i===2&&j===0?'selected':'')+'" data-score="'+i+','+j+'" type="button">'+n+'</button>';});
    });
    return '<div class="scene-ui fade-up"><div class="big-formula"><span class="color-q">Q</span> · <span class="color-k">Kᵀ</span> = <span class="color-attn">S</span></div><p class="scene-note" style="text-align:center;margin:12px 0 16px">Pulsa una celda. La reconstruimos desde su fila Q y su fila K.</p><div style="display:grid;grid-template-columns:minmax(320px,.8fr) minmax(360px,1.2fr);gap:18px"><div class="math-explainer"><div style="display:grid;grid-template-columns:64px repeat(3,58px);gap:7px;justify-content:center;align-items:center">'+cells+'</div></div><div id="scoreExplain" class="math-explainer">'+scoreExplain(2,0)+'</div></div></div>';
  }
  function sceneScaling(){
    function row(n,p,c){return '<div class="bar-row"><span>'+n+'</span><div class="bar-track"><div class="bar-fill" style="width:'+p+'%;background:'+c+'">'+(p>15?p.toFixed(1)+'%':'')+'</div></div><code>'+(p/100).toFixed(3)+'</code></div>';}
    return '<div class="scene-ui fade-up"><div class="scale-compare"><div class="scale-box"><h3>Sin dividir por √dₖ</h3><p class="scene-note">Scores grandes → softmax más extremo.</p><div class="number-row"><span class="number-chip">4</span><span class="number-chip">2</span><span class="number-chip">0</span></div>'+row('tamal',86.7,'var(--q)')+row('estaba',11.7,'var(--k)')+row('masacotudo',1.6,'var(--v)')+'</div><div class="scale-box attn-bg"><h3>Con √dₖ = √4 = 2</h3><p class="scene-note">Mismo orden; diferencias menos extremas.</p><div class="number-row"><span class="number-chip">2</span><span class="number-chip">1</span><span class="number-chip">0</span></div>'+row('tamal',66.52,'var(--q)')+row('estaba',24.47,'var(--k)')+row('masacotudo',9,'var(--v)')+'</div></div><div class="math-explainer" style="margin-top:16px"><strong>Intuición estadística</strong><pre>Var(q·k) ≈ dₖ\nDesviación típica ≈ √dₖ\nDividir por √dₖ controla la escala antes de softmax.</pre></div></div>';
  }
  function softmaxWorkbench(row){
    var input=SCALED[row], exps=input.map(Math.exp), den=exps.reduce(function(a,b){return a+b;},0), probs=exps.map(function(x){return x/den;});
    var bars=TOKENS.map(function(t,i){var p=probs[i]*100;return '<div class="bar-row"><strong>'+t+'</strong><div class="bar-track"><div class="bar-fill" style="width:'+Math.max(2,p)+'%;background:'+['var(--q)','var(--k)','var(--v)'][i]+'">'+(p>15?p.toFixed(1)+'%':'')+'</div></div><code>'+fmt(probs[i],4)+'</code></div>';}).join('');
    return '<div class="panel-grid" style="grid-template-columns:1fr 1fr"><div class="math-explainer"><span class="mini-kicker">1 · EXPONENCIAR</span><pre>fila = '+vec(input)+'\n\n'+input.map(function(n,i){return 'e^('+fmt(n)+') = '+fmt(exps[i],4);}).join('\n')+'\n\ndenominador = '+fmt(den,4)+'</pre></div><div class="math-explainer attn-bg"><span class="mini-kicker">2 · DIVIDIR POR EL TOTAL</span><pre>'+exps.map(function(n,i){return fmt(n,4)+' / '+fmt(den,4)+' = '+fmt(probs[i],4);}).join('\n')+'\n\nsuma ≈ '+fmt(probs.reduce(function(a,b){return a+b;},0),4)+'</pre></div></div><div style="margin-top:16px">'+bars+'</div>';
  }
  function sceneSoftmax(){
    return '<div class="scene-ui fade-up"><div class="toggle-row"><button class="toggle-btn" data-soft="0">Fila 1 · tamal</button><button class="toggle-btn" data-soft="1">Fila 2 · estaba</button><button class="toggle-btn active" data-soft="2">Fila 3 · masacotudo</button></div><div id="softmaxWorkbench">'+softmaxWorkbench(2)+'</div></div>';
  }
  function sceneValues(){
    var data=[[170,'tamal','V₁=(2,0)','0.6652','var(--q)',14],[500,'estaba','V₂=(0,2)','0.2447','var(--k)',7],[830,'masacotudo','V₃=(1,1)','0.0900','var(--v)',4]];
    var parts=data.map(function(o){return '<g transform="translate('+(o[0]-105)+' 80)"><rect width="210" height="110" rx="20" fill="var(--panel)" stroke="'+o[4]+'" stroke-width="3"></rect><text x="105" y="31" text-anchor="middle" class="scene-label">'+o[1]+'</text><text x="105" y="61" text-anchor="middle" class="scene-mono" font-size="14">'+o[2]+'</text><text x="105" y="88" text-anchor="middle" fill="'+o[4]+'" font-size="13" font-weight="850">peso '+o[3]+'</text></g><path class="soft-arrow beam" d="M'+o[0]+' 190 C'+o[0]+' 270 500 250 500 330" fill="none" stroke="'+o[4]+'" stroke-width="'+o[5]+'" marker-end="url(#arr)"></path>';}).join('');
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">LOS PESOS ABREN TUBERÍAS HACIA V</text>'+parts+'<g transform="translate(320 342)"><rect width="360" height="105" rx="22" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="3"></rect><text x="180" y="34" text-anchor="middle" class="scene-label">z₃ · contexto nuevo</text><text x="180" y="70" text-anchor="middle" class="scene-mono" font-size="21">(1.4205, 0.5795)</text></g></svg>';
  }
  function sceneFormula(){
    var nodes=[['X','entrada'],['Q,K,V','proyecciones'],['QKᵀ','scores'],['÷√dₖ','escala'],['softmax','pesos A'],['A·V','contexto Z']];
    var html=nodes.map(function(n,i){return (i?'<div class="flow-arrow">→</div>':'')+'<div class="flow-node '+(i===1?'q-bg':i===4?'attn-bg':i===5?'v-bg':'')+'"><strong>'+n[0]+'</strong><span>'+n[1]+'</span></div>';}).join('');
    return '<div class="scene-ui fade-up"><div class="big-formula">Attention(Q,K,V) = softmax(QKᵀ / √dₖ) V</div><div class="flow-map" style="margin-top:30px">'+html+'</div><div class="scene-grid"><div class="visual-card q-bg"><h3>Buscar</h3><p>Q contra K: ¿a quién miro?</p></div><div class="visual-card attn-bg"><h3>Decidir</h3><p>Softmax reparte el total de atención.</p></div><div class="visual-card v-bg"><h3>Traer</h3><p>Los pesos mezclan V.</p></div></div></div>';
  }
  function sceneHeads(){
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">DOS DETECTIVES, LA MISMA FRASE</text><g transform="translate(70 80)"><rect width="360" height="220" rx="24" fill="var(--panel)" stroke="var(--q)" stroke-width="4"></rect><text x="180" y="36" text-anchor="middle" class="scene-label">Cabeza 1</text><text x="180" y="63" text-anchor="middle" class="scene-note">pesos (0.7, 0.2, 0.1)</text><path d="M70 105 H310" stroke="var(--q)" stroke-width="15"></path><path d="M70 145 H140" stroke="var(--k)" stroke-width="15"></path><path d="M70 185 H105" stroke="var(--v)" stroke-width="15"></path><text x="180" y="210" text-anchor="middle" class="scene-mono">Z¹=(0.8,0.3)</text></g><g transform="translate(570 80)"><rect width="360" height="220" rx="24" fill="var(--panel)" stroke="var(--v)" stroke-width="4"></rect><text x="180" y="36" text-anchor="middle" class="scene-label">Cabeza 2</text><text x="180" y="63" text-anchor="middle" class="scene-note">pesos (0.3, 0.4, 0.3)</text><path d="M70 105 H170" stroke="var(--q)" stroke-width="15"></path><path d="M70 145 H210" stroke="var(--k)" stroke-width="15"></path><path d="M70 185 H170" stroke="var(--v)" stroke-width="15"></path><text x="180" y="210" text-anchor="middle" class="scene-mono">Z²=(0.6,0.7)</text></g><path class="soft-arrow" d="M250 305 C300 370 410 365 455 390" fill="none" stroke="var(--q)" stroke-width="4" marker-end="url(#arr)"></path><path class="soft-arrow" d="M750 305 C700 370 590 365 545 390" fill="none" stroke="var(--v)" stroke-width="4" marker-end="url(#arr)"></path><g transform="translate(365 390)"><rect width="270" height="75" rx="18" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="3"></rect><text x="135" y="28" text-anchor="middle" class="scene-label">Concatenar</text><text x="135" y="52" text-anchor="middle" class="scene-mono">(0.8,0.3,0.6,0.7) → Wᴼ</text></g></svg>';
  }
  function sceneResidual(){
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">ORIGINAL + CORRECCIÓN</text><g transform="translate(70 185)"><rect width="150" height="80" rx="18" fill="var(--panel)" stroke="var(--line)" stroke-width="2"></rect><text x="75" y="33" text-anchor="middle" class="scene-label">x₃</text><text x="75" y="57" text-anchor="middle" class="scene-note">original</text></g><path class="soft-arrow" d="M220 225 H350" fill="none" stroke="var(--q)" stroke-width="4" marker-end="url(#arr)"></path><g transform="translate(360 155)"><rect width="220" height="140" rx="22" fill="var(--panel)" stroke="var(--q)" stroke-width="3"></rect><text x="110" y="44" text-anchor="middle" class="scene-label">Multi-Head Attention</text><text x="110" y="78" text-anchor="middle" class="scene-note">concat → Wᴼ</text><text x="110" y="112" text-anchor="middle" class="scene-mono">corrección a</text></g><path class="soft-arrow" d="M580 225 H680" fill="none" stroke="var(--q)" stroke-width="4" marker-end="url(#arr)"></path><circle cx="720" cy="225" r="30" fill="var(--panel)" stroke="var(--attn)" stroke-width="3"></circle><text x="720" y="234" text-anchor="middle" class="scene-big">+</text><path class="soft-arrow beam" d="M145 265 C145 385 720 390 720 257" fill="none" stroke="var(--v)" stroke-width="7" marker-end="url(#arr)"></path><text x="420" y="405" text-anchor="middle" fill="var(--v)" font-size="14" font-weight="850">ATAJO RESIDUAL: x₃ pasa intacto alrededor</text><path class="soft-arrow" d="M750 225 H850" fill="none" stroke="var(--attn)" stroke-width="4" marker-end="url(#arr)"></path><g transform="translate(855 185)"><rect width="100" height="80" rx="18" fill="var(--accent-soft)" stroke="var(--accent)"></rect><text x="50" y="33" text-anchor="middle" class="scene-label">x₃ + a</text><text x="50" y="56" text-anchor="middle" class="scene-note">→ LN</text></g></svg>';
  }
  function sceneLayerNorm(){
    var before=[2.4205,.5795,3.4205,1.5795], after=[.4014,-1.356,1.356,-.4014];
    function bars(arr,color){
      return arr.map(function(n,i){var h=Math.max(12,Math.abs(n)*50), y2=n>=0?220-h:220+h;return '<g transform="translate('+(85+i*100)+' 0)"><line x1="0" y1="220" x2="0" y2="'+y2+'" stroke="'+(n>=0?color:'var(--mask)')+'" stroke-width="42" stroke-linecap="round"></line><text x="0" y="'+(n>=0?220-h-18:220+h+28)+'" text-anchor="middle" class="scene-mono" font-size="12">'+fmt(n)+'</text><text x="0" y="290" text-anchor="middle" class="scene-note">x'+(i+1)+'</text></g>';}).join('');
    }
    return '<svg viewBox="0 0 1000 500"><text x="500" y="38" text-anchor="middle" class="scene-title">CENTRAR Y REESCALAR CADA FILA</text><g transform="translate(70 80)"><rect width="400" height="340" rx="24" fill="var(--panel)" stroke="var(--line)" stroke-width="2"></rect><text x="200" y="35" text-anchor="middle" class="scene-label">Antes</text><line x1="25" y1="220" x2="375" y2="220" stroke="var(--muted)"></line>'+bars(before,'var(--attn)')+'<text x="200" y="320" text-anchor="middle" class="scene-note">μ=2.0000 · σ≈1.0475</text></g><text x="500" y="255" text-anchor="middle" class="scene-big">→</text><g transform="translate(530 80)"><rect width="400" height="340" rx="24" fill="var(--panel)" stroke="var(--attn)" stroke-width="3"></rect><text x="200" y="35" text-anchor="middle" class="scene-label">Después</text><line x1="25" y1="220" x2="375" y2="220" stroke="var(--muted)"></line>'+bars(after,'var(--v)')+'<text x="200" y="320" text-anchor="middle" class="scene-note">media≈0 · escala controlada</text></g><text x="500" y="466" text-anchor="middle" class="scene-label">LayerNorm usa las coordenadas de una posición.</text></svg>';
  }
  function sceneFFN(){
    var nodes=[0,1,2,3,4,5,6,7].map(function(i){var off=i%2===1;return '<g transform="translate('+(62+(i%4)*88)+' '+(110+Math.floor(i/4)*75)+')"><circle r="23" fill="'+(off?'#251b24':'var(--k)')+'" opacity="'+(off?'.75':'.55')+'" stroke="'+(off?'var(--mask)':'var(--k)')+'" stroke-width="2"></circle><text x="0" y="5" text-anchor="middle" class="scene-mono" font-size="11">'+(off?'0':'+')+'</text></g>';}).join('');
    return '<svg viewBox="0 0 1000 500">'+svgDefs()+'<text x="500" y="38" text-anchor="middle" class="scene-title">ATENCIÓN = REUNIÓN · FFN = TRABAJO INDIVIDUAL</text><g transform="translate(60 180)"><rect width="150" height="95" rx="19" fill="var(--panel)" stroke="var(--line)" stroke-width="2"></rect><text x="75" y="37" text-anchor="middle" class="scene-label">x′₃</text><text x="75" y="64" text-anchor="middle" class="scene-note">4 números</text></g><path class="soft-arrow" d="M210 227 H295" fill="none" stroke="var(--text)" stroke-width="3" marker-end="url(#arr)"></path><g transform="translate(305 105)"><rect width="390" height="245" rx="24" fill="var(--panel)" stroke="var(--k)" stroke-width="3"></rect><text x="195" y="37" text-anchor="middle" class="scene-label">W₁: 4 → 8</text><text x="195" y="62" text-anchor="middle" class="scene-note">ReLU apaga negativos</text>'+nodes+'<text x="195" y="232" text-anchor="middle" class="scene-note">negativo → 0 · positivo → pasa</text></g><path class="soft-arrow" d="M695 227 H785" fill="none" stroke="var(--text)" stroke-width="3" marker-end="url(#arr)"></path><g transform="translate(795 180)"><rect width="150" height="95" rx="19" fill="var(--accent-soft)" stroke="var(--accent)"></rect><text x="75" y="37" text-anchor="middle" class="scene-label">W₂</text><text x="75" y="64" text-anchor="middle" class="scene-note">8 → 4</text></g><text x="500" y="420" text-anchor="middle" class="scene-label">La misma FFN se aplica fila por fila.</text></svg>';
  }
  function maskWorkbench(masked){
    var data=masked?CAUSAL:A, left='', right='';
    for(var i=0;i<3;i++){for(var j=0;j<3;j++){var forbidden=masked&&j>i;left+='<div class="matrix-cell '+(forbidden?'masked':'allowed')+'">'+(forbidden?'−∞':'0')+'</div>';right+='<div class="matrix-cell '+(forbidden?'masked':'')+'">'+(data[i][j]===0?'0':fmt(data[i][j],4))+'</div>';}}
    return '<div class="mask-demo"><div class="math-explainer"><span class="mini-kicker">'+(masked?'MÁSCARA M':'SIN MÁSCARA')+'</span><div class="triangle" style="margin-top:14px">'+left+'</div><p class="scene-note">'+(masked?'Encima de la diagonal: futuro prohibido.':'Nadie está prohibido: se puede mirar a la derecha.')+'</p></div><div class="mask-bridge">→</div><div class="math-explainer '+(masked?'attn-bg':'mask-bg')+'"><span class="mini-kicker">DESPUÉS DE SOFTMAX</span><div class="triangle" style="margin-top:14px">'+right+'</div><p class="scene-note">'+(masked?'El futuro queda con peso 0.':'Fila 1 y 2 pueden usar tokens futuros.')+'</p></div></div><div class="decoder-stream"><span class="decoder-token">el</span><span class="decoder-token">tamal</span><span class="decoder-token">estaba</span><span class="decoder-token '+(masked?'new':'')+'">'+(masked?'? → masacotudo':'masacotudo visible')+'</span></div>';
  }
  function sceneMask(){
    return '<div class="scene-ui fade-up"><div class="toggle-row"><button id="maskOff" class="toggle-btn active" type="button">Sin máscara: hace trampa</button><button id="maskOn" class="toggle-btn" type="button">Con máscara causal</button></div><div id="maskWorkbench">'+maskWorkbench(false)+'</div></div>';
  }
  function architectureHtml(which){
    if(which==='generate'){
      return '<div class="math-explainer"><span class="mini-kicker">GENERACIÓN AUTORREGRESIVA</span><div class="decoder-stream"><span class="decoder-token">el</span><span class="decoder-token">tamal</span><span class="decoder-token">estaba</span><span class="decoder-token new sequence-flow">?</span></div><div class="prob-grid"><div class="bar-row"><strong>masacotudo</strong><div class="bar-track"><div class="bar-fill" style="width:62%;background:var(--attn)">62%</div></div><code>.62</code></div><div class="bar-row"><strong>frío</strong><div class="bar-track"><div class="bar-fill" style="width:16%;background:var(--q)">16%</div></div><code>.16</code></div><div class="bar-row"><strong>rico</strong><div class="bar-track"><div class="bar-fill" style="width:12%;background:var(--v)"></div></div><code>.12</code></div></div><p class="scene-note" style="text-align:center">Se elige un token → se agrega al contexto → se predice el siguiente.</p></div>';
    }
    if(which==='encoder'){
      return '<div class="arch-grid"><div class="arch-card q-bg"><h3>Encoder-only</h3><p>Cada posición puede mirar a izquierda y derecha.</p><div class="arch-stack"><div class="arch-block">Embedding + posición</div><div class="arch-block">Self-attention bidireccional</div><div class="arch-block">Residual + Norm</div><div class="arch-block">FFN</div><div class="arch-block">× N capas</div></div></div><div class="arch-card" style="grid-column:span 2"><h3>Bidireccional</h3><div class="reaction-row"><div class="reaction-card"><strong>tamal</strong><p>pasado</p></div><div>↔</div><div class="reaction-card"><strong>estaba</strong><p>actual</p></div><div>↔</div><div class="reaction-card"><strong>masacotudo</strong><p>futuro permitido</p></div></div></div></div>';
    }
    if(which==='encdec'){
      return '<div class="arch-grid"><div class="arch-card q-bg"><h3>Encoder</h3><p>Lee toda la entrada.</p><div class="arch-stack"><div class="arch-block">Self-attention</div><div class="arch-block">FFN</div><div class="arch-block">salidas H</div></div></div><div class="arch-card attn-bg"><h3>Cross-attention</h3><p>Q viene del decoder. K y V vienen del encoder.</p><div class="big-formula" style="font-size:13px;margin-top:16px"><span class="color-q">Q: decoder</span><br><span class="color-k">K: encoder</span><br><span class="color-v">V: encoder</span></div></div><div class="arch-card v-bg"><h3>Decoder</h3><p>Escribe causalmente mientras consulta el encoder.</p><div class="arch-stack"><div class="arch-block">Masked self-attention</div><div class="arch-block">Cross-attention</div><div class="arch-block">FFN</div></div></div></div>';
    }
    var map=[['Token','texto'],['Embedding','números'],['Posición','orden'],['Q/K/V','papeles'],['QKᵀ','scores'],['÷√dk','escala'],['Softmax','pesos'],['A·V','contexto'],['Multi-head','miradas'],['Wᴼ','mezcla'],['Residual/LN','estabiliza'],['FFN','procesa'],['×N','profundidad'],['Logits','vocabulario'],['Softmax','probabilidades']].map(function(x){return '<div class="full-map-node"><strong>'+x[0]+'</strong><span>'+x[1]+'</span></div>';}).join('');
    return '<div class="arch-grid"><div class="arch-card attn-bg"><h3>Decoder-only</h3><p>Predice el siguiente token sin mirar el futuro.</p><div class="arch-stack"><div class="arch-block">Embedding + posición</div><div class="arch-block">Masked self-attention</div><div class="arch-block">Residual + Norm</div><div class="arch-block">FFN</div><div class="arch-block">× N capas</div><div class="arch-block">Logits → softmax</div></div></div><div class="arch-card" style="grid-column:span 2"><h3>Mapa completo</h3><div class="full-map">'+map+'</div></div></div>';
  }
  function sceneArchitecture(){
    return '<div class="scene-ui fade-up"><div class="toggle-row"><button class="toggle-btn active" data-arch="decoder">Decoder-only</button><button class="toggle-btn" data-arch="encoder">Encoder-only</button><button class="toggle-btn" data-arch="encdec">Encoder–decoder</button><button class="toggle-btn" data-arch="generate">Ver generación</button></div><div id="archWorkbench">'+architectureHtml('decoder')+'</div></div>';
  }

  var sceneFns={intro:sceneIntro,embedding:sceneEmbedding,position:scenePosition,qkv:sceneQKV,shapes:sceneShapes,scores:sceneScores,scaling:sceneScaling,softmax:sceneSoftmax,values:sceneValues,formula:sceneFormula,heads:sceneHeads,residual:sceneResidual,layernorm:sceneLayerNorm,ffn:sceneFFN,mask:sceneMask,architecture:sceneArchitecture};

  function buildNav(){
    els.missionList.innerHTML=lessons.map(function(l,i){return '<button class="mission-btn" type="button" data-mission="'+i+'"><span class="mission-num">'+String(i+1).padStart(2,'0')+'</span><span class="mission-text"><strong>'+l.name+'</strong><span>'+l.group+'</span></span></button>';}).join('');
    $$('[data-mission]',els.missionList).forEach(function(b){b.addEventListener('click',function(){goTo(Number(b.dataset.mission));});});
  }
  function renderMicro(){
    var l=lessons[state.lesson], visible=state.showAll?l.steps.length:state.micro+1;
    els.microCounter.textContent=(state.showAll?l.steps.length:state.micro+1)+' / '+l.steps.length;
    els.microSteps.innerHTML=l.steps.slice(0,visible).map(function(s,i){return '<div class="micro-step '+(i===visible-1?'current':'')+'"><div class="micro-num">'+(i+1)+'</div><div class="micro-text">'+esc(s)+'</div></div>';}).join('');
    els.microPrev.disabled=state.micro<=0||state.showAll;
    els.microNext.disabled=state.micro>=l.steps.length-1||state.showAll;
    els.microAll.textContent=state.showAll?'Volver paso a paso':'Ver toda la cuenta';
  }
  function renderJourney(){
    els.journeyBar.innerHTML=lessons.map(function(l,i){return '<span class="journey-node '+(i<state.lesson?'done':i===state.lesson?'current':'')+'" title="'+l.name+'"></span>';}).join('');
  }
  function renderQuiz(){
    var q=lessons[state.lesson].quiz;
    els.quizQuestion.textContent=q.q;els.quizFeedback.textContent='';
    els.quizOptions.innerHTML=q.a.map(function(a,i){return '<button class="quiz-option" data-answer="'+i+'" type="button">'+a+'</button>';}).join('');
    $$('[data-answer]',els.quizOptions).forEach(function(b){
      b.addEventListener('click',function(){
        var idx=Number(b.dataset.answer);$$('[data-answer]',els.quizOptions).forEach(function(x){x.disabled=true;});
        if(idx===q.ok){b.classList.add('correct');els.quizFeedback.textContent='Correcto. Ya puedes explicar esta parte con tus propias palabras.';if(!state.solved[state.lesson]){state.solved[state.lesson]=true;state.stars++;els.starCounter.textContent=state.stars;}}
        else{b.classList.add('wrong');var good=$('[data-answer="'+q.ok+'"]',els.quizOptions);if(good)good.classList.add('correct');els.quizFeedback.textContent='La correcta es: '+q.a[q.ok]+'. Vuelve a la frase ancla y mira el visual otra vez.';}
      });
    });
  }
  function initScene(key){
    if(key==='scores'){
      $$('[data-score]',els.scene).forEach(function(b){b.addEventListener('click',function(){ $$('[data-score]',els.scene).forEach(function(x){x.classList.remove('selected');}); b.classList.add('selected'); var p=b.dataset.score.split(',').map(Number); $('#scoreExplain').innerHTML=scoreExplain(p[0],p[1]); });});
    }
    if(key==='softmax'){
      $$('[data-soft]',els.scene).forEach(function(b){b.addEventListener('click',function(){ $$('[data-soft]',els.scene).forEach(function(x){x.classList.remove('active');});b.classList.add('active');$('#softmaxWorkbench').innerHTML=softmaxWorkbench(Number(b.dataset.soft));});});
    }
    if(key==='mask'){
      var off=$('#maskOff'),on=$('#maskOn'),wb=$('#maskWorkbench');
      off.addEventListener('click',function(){off.classList.add('active');on.classList.remove('active');wb.innerHTML=maskWorkbench(false);});
      on.addEventListener('click',function(){on.classList.add('active');off.classList.remove('active');wb.innerHTML=maskWorkbench(true);});
    }
    if(key==='architecture'){
      $$('[data-arch]',els.scene).forEach(function(b){b.addEventListener('click',function(){ $$('[data-arch]',els.scene).forEach(function(x){x.classList.remove('active');});b.classList.add('active');$('#archWorkbench').innerHTML=architectureHtml(b.dataset.arch);});});
    }
  }
  function renderLesson(animate){
    var l=lessons[state.lesson];
    els.chapterLabel.textContent='MISIÓN '+String(state.lesson+1).padStart(2,'0')+' · '+l.group;
    els.lessonTitle.textContent=l.title;els.shapeBadge.textContent=l.shape;els.humanText.textContent=l.human;els.analogyText.textContent=l.analogy;els.anchorText.textContent=l.anchor;els.whyText.textContent=l.why;els.withoutText.textContent=l.without;els.mistakeText.textContent=l.mistake;els.tokenState.textContent=l.state;
    els.progressFill.style.width=((state.lesson+1)/lessons.length*100)+'%';els.progressText.textContent=(state.lesson+1)+' / '+lessons.length;
    els.prevBtn.disabled=state.lesson===0;els.nextBtn.disabled=state.lesson===lessons.length-1;
    $$('.mission-btn',els.missionList).forEach(function(b,i){b.classList.toggle('active',i===state.lesson);});
    els.scene.innerHTML=sceneFns[l.scene]();initScene(l.scene);renderMicro();renderJourney();renderQuiz();
    if(animate!==false){['#lessonTitle','#humanText','#scene','#tokenState'].forEach(function(s){var e=$(s);e.classList.remove('fade-up');void e.offsetWidth;e.classList.add('fade-up');});}
    history.replaceState(null,'','#/'+(state.lesson+1));
  }
  function stopSpeech(){if('speechSynthesis' in window)window.speechSynthesis.cancel();state.speaking=false;}
  function goTo(i){stopPlay();stopSpeech();state.lesson=Math.max(0,Math.min(lessons.length-1,i));state.micro=0;state.showAll=false;renderLesson(true);}
  function next(){if(state.lesson<lessons.length-1)goTo(state.lesson+1);}
  function prev(){if(state.lesson>0)goTo(state.lesson-1);}
  function openFocus(kind){
    var l=lessons[state.lesson];els.focusModal.classList.add('open');els.focusModal.setAttribute('aria-hidden','false');
    if(kind==='simple'){els.focusKicker.textContent='MODO ULTRA SIMPLE';els.focusTitle.textContent='Olvida la fórmula durante un minuto';els.focusText.textContent=l.simple;els.focusExtra.innerHTML='<strong>Luego vuelve a esta frase:</strong><br>'+l.anchor;}
    else{els.focusKicker.textContent='EL PORQUÉ';els.focusTitle.textContent='¿Para qué existe esta pieza?';els.focusText.textContent=l.why;els.focusExtra.innerHTML='<strong>Si la quitamos:</strong><br>'+l.without+'<br><br><strong>Trampa común:</strong><br>'+l.mistake;}
  }
  function closeFocus(){els.focusModal.classList.remove('open');els.focusModal.setAttribute('aria-hidden','true');}
  function setMode(m){state.mode=m;document.body.classList.toggle('presentation',m==='presentation');els.modeLabel.textContent=m==='presentation'?'Modo estudio':'Modo exposición';localStorage.setItem('transformer-mode',m);}
  function toggleMode(){setMode(state.mode==='presentation'?'study':'presentation');}
  function fullscreen(){if(!document.fullscreenElement){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();}else if(document.exitFullscreen)document.exitFullscreen();}
  function replay(){var l=lessons[state.lesson];els.scene.innerHTML='';requestAnimationFrame(function(){els.scene.innerHTML=sceneFns[l.scene]();initScene(l.scene);});}
  function speak(){
    if(!('speechSynthesis' in window)){showToast('Este navegador no tiene lectura de voz.');return;}
    if(state.speaking){stopSpeech();showToast('Lectura detenida.');return;}
    var l=lessons[state.lesson],u=new SpeechSynthesisUtterance(l.title+'. '+l.human+' Imagen mental: '+l.analogy+' Recuerda: '+l.anchor);u.lang='es-CO';u.rate=.92;u.onend=function(){state.speaking=false;};u.onerror=function(){state.speaking=false;};state.speaking=true;speechSynthesis.speak(u);
  }
  function showToast(t){els.toast.textContent=t;els.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(function(){els.toast.classList.remove('show');},2200);}
  function playDelay(){return Math.round(9000/Number(els.speedSelect.value||1));}
  function startPlay(){if(state.playing)return;state.playing=true;els.playBtn.textContent='⏸ Pausar clase';var tick=function(){if(!state.playing)return;if(state.lesson>=lessons.length-1){stopPlay();return;}state.lesson++;state.micro=0;state.showAll=false;renderLesson(true);state.timer=setTimeout(tick,playDelay());};state.timer=setTimeout(tick,playDelay());}
  function stopPlay(){state.playing=false;clearTimeout(state.timer);state.timer=null;if(els.playBtn)els.playBtn.textContent='▶ Reproducir clase';}
  function togglePlay(){state.playing?stopPlay():startPlay();}
  function parseHash(){var m=location.hash.match(/#\/(\d+)/);if(m)state.lesson=Math.max(0,Math.min(lessons.length-1,Number(m[1])-1));var p=new URLSearchParams(location.search);if(p.get('mode')==='present')state.mode='presentation';if(p.get('projector')==='1')document.body.classList.add('projector');}
  function bind(){
    els.prevBtn.addEventListener('click',prev);els.nextBtn.addEventListener('click',next);els.playBtn.addEventListener('click',togglePlay);
    els.microPrev.addEventListener('click',function(){if(state.micro>0){state.micro--;state.showAll=false;renderMicro();}});
    els.microNext.addEventListener('click',function(){var max=lessons[state.lesson].steps.length-1;if(state.micro<max){state.micro++;state.showAll=false;renderMicro();}});
    els.microAll.addEventListener('click',function(){state.showAll=!state.showAll;if(state.showAll)state.micro=lessons[state.lesson].steps.length-1;renderMicro();});
    els.replayBtn.addEventListener('click',replay);els.modeBtn.addEventListener('click',toggleMode);els.fullscreenBtn.addEventListener('click',fullscreen);els.simplifyBtn.addEventListener('click',function(){openFocus('simple');});els.whyBtn.addEventListener('click',function(){openFocus('why');});els.focusClose.addEventListener('click',closeFocus);els.focusModal.addEventListener('click',function(e){if(e.target===els.focusModal)closeFocus();});els.speakBtn.addEventListener('click',speak);
    els.speedSelect.addEventListener('change',function(){if(state.playing){stopPlay();startPlay();}});
    window.addEventListener('hashchange',function(){var m=location.hash.match(/#\/(\d+)/);if(m){var n=Math.max(0,Math.min(lessons.length-1,Number(m[1])-1));if(n!==state.lesson){state.lesson=n;state.micro=0;state.showAll=false;renderLesson(false);}}});
    document.addEventListener('keydown',function(e){var tag=(e.target.tagName||'').toLowerCase();if(['input','textarea','select'].indexOf(tag)>=0)return;if(e.key==='ArrowRight'){e.preventDefault();next();}else if(e.key==='ArrowLeft'){e.preventDefault();prev();}else if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen();}else if(e.key.toLowerCase()==='r'){e.preventDefault();replay();}else if(e.key===' '){e.preventDefault();togglePlay();}else if(e.key==='Escape'){closeFocus();stopSpeech();}else if(e.key.toLowerCase()==='p'){document.body.classList.toggle('projector');showToast(document.body.classList.contains('projector')?'Modo proyector claro activado.':'Modo oscuro restaurado.');}});
  }
  parseHash();buildNav();bind();setMode(state.mode);renderLesson(false);
})();