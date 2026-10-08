(()=>{'use strict';
const M=window.Model, scenes=[],chapters=[];let chapter;
function section(name){chapter={name,index:chapters.length,start:scenes.length};chapters.push(chapter)}
function shot(type,step,text,extra={}){scenes.push({type,step,text,chapter:chapter.index,duration:Math.max(4.4,text.split(/\s+/).length/2.35+1.1),...extra})}
section('Una palabra necesita contexto');
shot('sentence',0,'El tamal estaba… masacotudo. ¿Qué nos cuenta esa última palabra?',{duration:7});
shot('sentence',1,'Si la miras sola, falta información. ¿Qué estaba masacotudo?',{duration:6});
shot('sentence',2,'El tamal. El significado depende de cómo se relacionan las palabras.',{duration:7});
shot('sentence',3,'Atención construye esas relaciones con números. Vamos a seguir a masacotudo por dentro.',{duration:7});
section('Del texto al vector');
shot('embedding',0,'Para calcular, omitimos el artículo «el»: usamos tamal, estaba y masacotudo. Aquí simplificamos: cada palabra es un token.');
shot('embedding',1,'Cada token recibe un embedding: cuatro números aprendibles. No tienen etiquetas fijas como sabor o tamaño.');
shot('position',0,'La atención también necesita el orden. A cada embedding le sumamos una señal de posición.');
shot('position',1,'Contamos desde cero. Masacotudo está en la posición dos. Esta es su señal sinusoidal.');
for(let j=0;j<4;j++)shot('position',j+2,[
'Primera coordenada: cero coma cero nueve cero siete, más cero coma nueve cero nueve tres. Resultado: uno.',
'Segunda: cero coma cuatro uno seis uno, más menos cero coma cuatro uno seis uno. Se cancelan: cero.',
'Tercera: uno coma noventa y ocho, más cero coma cero dos. Resultado: dos.',
'Cuarta: cero coma cero cero cero dos, más cero coma nueve nueve nueve ocho. Resultado: uno.'
][j]);
shot('position',6,'Así obtenemos la entrada: uno, cero, dos, uno. Elegimos números didácticos para poder seguir todas las cuentas.');
shot('input',0,'Las tres entradas forman X. Cada fila es una posición; cada columna, una coordenada. Seguiremos la tercera fila.');
section('Buscar, comparar y aportar');
shot('roles',0,'De esa misma entrada salen tres versiones. Query busca; Key permite comparar; Value aporta información.');
shot('roles',1,'Imagina una biblioteca: Q es tu consulta, K es la ficha del libro y V es el contenido que te llevas.');
shot('projection',0,'Para construir Q, multiplicamos X por una matriz de pesos llamada W de Q. Mira la segunda columna.');
for(let j=0;j<4;j++)shot('projection',j+1,[
'Primera pareja: uno de la entrada, por cero de esta columna. Aporta cero.',
'Segunda pareja: cero por uno. También aporta cero.',
'Tercera pareja: dos por un medio. Aquí aparece el uno.',
'Cuarta pareja: uno por cero. Sumamos cero, cero, uno y cero: la segunda coordenada de Q es uno.'
][j]);
shot('roles',2,'Repetimos con las demás columnas. Para masacotudo obtenemos Q igual a uno, uno, uno, uno.');
shot('roles',3,'Con matrices distintas obtenemos K y V. Q y K comparan; V es el contenido que luego se mezcla.');
section('Calcular la atención');
shot('search',0,'La Query de masacotudo visita las Keys de las tres posiciones. Empecemos por tamal.');
for(let key=0;key<3;key++){
shot('dot',0,[
'Ponemos su Query junto a la Key de tamal. Cada número se empareja con el de su misma columna.',
'Ahora mantenemos la misma Query y cambiamos la Key por la de estaba.',
'Finalmente, masacotudo también puede consultar su propia Key.'
][key],{key});
for(let j=0;j<4;j++)shot('dot',j+1,(key===0?[
'Primera pareja: uno por uno es uno. El producto baja a la suma.',
'Segunda pareja: uno por uno es uno. Ya tenemos uno más uno.',
'Tercera pareja: uno por uno es uno. Lo añadimos también.',
'Cuarta pareja: uno por uno es uno. Las cuatro coordenadas ya participaron.'
]:key===1?[
'Primera pareja: uno por uno, uno.',
'Segunda pareja: uno por uno, otro uno.',
'Tercera pareja: uno por cero, cero.',
'Cuarta pareja: uno por cero, cero.'
]:[
'Uno por uno da uno.',
'Uno por menos uno da menos uno. Conserva el signo.',
'Otro uno por uno da uno.',
'Uno por menos uno da menos uno.'
])[j],{key});
shot('dot',5,[
'Uno más uno más uno más uno: cuatro. Es compatibilidad, no un porcentaje.',
'Uno más uno más cero más cero: dos. Esta pareja obtuvo un score menor.',
'Uno menos uno más uno menos uno: cero. Ya tenemos la fila cuatro, dos, cero.'
][key],{key});}
shot('scores',0,'Al repetir con cada Query obtenemos esta matriz. La fila pregunta; la columna identifica la Key consultada.');
shot('scale',0,'Antes de repartir atención, dividimos por la raíz de d k. Query y Key tienen cuatro coordenadas: raíz de cuatro es dos.');
for(let j=0;j<3;j++)shot('scale',j+1,['Cuatro dividido por dos: dos.','Dos dividido por dos: uno.','Cero dividido por dos: cero. Ahora tenemos dos, uno, cero.'][j]);
shot('softmax',0,'Softmax convertirá estos scores en pesos positivos que suman uno. Primero calculamos sus exponenciales.');
for(let j=0;j<3;j++)shot('softmax',j+1,['E al cuadrado es aproximadamente siete coma tres ocho nueve uno.','E a la uno es dos coma siete uno ocho tres.','E a la cero es uno. Ninguna exponencial resulta negativa.'][j]);
shot('softmax',4,'Sumamos las tres exponenciales: once coma uno cero siete cuatro. Este será el denominador para todas.');
for(let j=0;j<3;j++)shot('softmax',j+5,[
'Siete coma tres ocho nueve uno dividido por el total da cero coma seis seis cinco dos.',
'Dos coma siete uno ocho tres dividido por el mismo total da cero coma dos cuatro cuatro siete.',
'Uno dividido por el total da aproximadamente cero coma cero nueve.'
][j]);
shot('weights',0,'Mira el reparto: sesenta y seis coma cincuenta y dos por ciento para tamal, veinticuatro coma cuarenta y siete para estaba y nueve para sí mismo.');
shot('weights',1,'Toda la barra representa cien por ciento. Todavía no trajimos información: solo decidimos cuánto de cada posición vamos a recibir.');
section('Tapar el futuro');
shot('mask',0,'Si estamos generando texto, cada posición solo puede usar su presente y su pasado. La máscara causal tapa el futuro.');
shot('mask',1,'Para la primera posición, estas dos casillas son futuro. Para la segunda, solo la última. Para la tercera, ninguna.');
shot('mask',2,'Sumamos menos infinito a esos scores, antes del softmax. Su exponencial se vuelve cero. Las conexiones futuras desaparecen.');
shot('mask',3,'Los pesos permitidos vuelven a sumar uno. La primera fila solo puede mirarse a sí misma.');
shot('mask',4,'La tercera fila no cambia: no tenía futuro visible. Nuestro cálculo para masacotudo sigue siendo válido. Continuemos con sus pesos.');
section('Mezclar información');
shot('values',0,'Estos son los Values: dos, cero; cero, dos; y uno, uno. Los pesos controlan cuánto aporta cada uno.');
for(let j=0;j<3;j++)shot('values',j+1,[
'Tamal aporta su Value multiplicado por cero coma seis seis cinco dos. Observa cuánto entra por su conexión.',
'Estaba aporta su Value multiplicado por cero coma dos cuatro cuatro siete.',
'Masacotudo aporta su Value multiplicado por cero coma cero nueve. Su contribución es más pequeña.'
][j]);
for(let coord=0;coord<2;coord++)for(let j=0;j<4;j++)shot('mix',j,[
['Primera coordenada: cero coma seis seis cinco dos por dos, aproximadamente uno coma tres tres cero cinco.',
'La contribución de estaba a esta coordenada es cero.',
'Masacotudo añade aproximadamente cero coma cero nueve cero cero.',
'Sumamos las tres contribuciones. La primera coordenada contextual es uno coma cuatro dos cero cinco.'],
['Segunda coordenada: el Value de tamal tiene cero aquí. Su contribución es cero.',
'Estaba aporta aproximadamente cero coma cuatro ocho nueve cinco.',
'Masacotudo añade otra vez cero coma cero nueve cero cero.',
'El total de la segunda coordenada es cero coma cinco siete nueve cinco.']
][coord][j],{coord});
shot('contextual',0,'Este es z tres: uno coma cuatro dos cero cinco, cero coma cinco siete nueve cinco. Es información de tres posiciones, mezclada en un vector.');
shot('heads',0,'Un Transformer suele repetir esta búsqueda con varias cabezas. Todas ven la misma secuencia, con pesos distintos.');
shot('heads',1,'Sus resultados se concatenan y se proyectan. Nuestro ejemplo usa una sola cabeza, para poder calcularlo completo a mano.');
section('Conservar y normalizar');
shot('projectout',0,'Tenemos dos coordenadas y necesitamos cuatro para sumar la entrada original. W de salida adapta ese ancho.');
shot('projectout',1,'Nuestros pesos copian la primera coordenada a las posiciones uno y tres; la segunda, a las posiciones dos y cuatro.');
for(let j=0;j<4;j++)shot('residual',j,[
'El atajo trae la entrada original. Primera coordenada: uno más uno coma cuatro dos cero cinco.',
'Segunda: cero más cero coma cinco siete nueve cinco.',
'Tercera: dos más uno coma cuatro dos cero cinco.',
'Cuarta: uno más cero coma cinco siete nueve cinco. Conservamos lo anterior y sumamos una corrección.'
][j]);
shot('norm',0,'Ahora LayerNorm trabaja dentro de esta posición. Sumamos sus cuatro coordenadas: ocho. Dividimos por cuatro: la media es dos.');
shot('norm',1,'Restamos esa media a cada coordenada. Mira cómo se desplazan hasta quedar centradas alrededor de cero.');
shot('norm',2,'Elevamos las diferencias al cuadrado. Sumamos esos cuadrados y dividimos por cuatro: obtenemos la varianza.');
shot('norm',3,'La varianza es uno coma cero nueve siete tres. Su raíz, con un epsilon pequeño, es aproximadamente uno coma cero cuatro siete cinco.');
shot('norm',4,'Dividimos cada diferencia por esa escala. Con gamma uno y beta cero, estos son los cuatro valores normalizados.');
section('Procesar cada posición');
shot('ffn',0,'La atención comunicó posiciones. La red feed forward procesa cada posición por separado, con los mismos pesos.');
shot('ffn',1,'W uno expande de cuatro a ocho coordenadas. Por ejemplo, esta coordenada suma la primera y la tercera entrada.');
shot('ffn',2,'Cero coma cuatro cero uno cuatro más uno coma tres cinco seis cero da uno coma siete cinco siete cinco.');
shot('ffn',3,'ReLU conserva los positivos y convierte los negativos en cero. Mira cuáles se apagan.');
shot('ffn',4,'W dos vuelve a cuatro coordenadas. La primera suma estas dos activaciones: dos coma uno cinco ocho nueve.');
shot('ffn',5,'Estas son las cuatro salidas de la feed forward. Son una nueva corrección, no una palabra.');
shot('final',0,'Sumamos esta corrección a su entrada mediante otro atajo residual. El resultado sigue teniendo cuatro coordenadas.');
shot('final',1,'Aplicamos otra LayerNorm. Calculamos media, varianza y escala igual que antes.');
shot('final',2,'Llegamos a la salida del bloque: este vector. Todo se calculó con el mismo ejemplo, sin redondear los pasos intermedios.');
section('Del vector al siguiente token');
shot('language',0,'Para predecir texto falta una proyección al vocabulario. Añadimos cuatro candidatos y una matriz de salida didáctica.');
shot('language',1,'Para el punto, los pesos son tres, menos uno, uno y cero. Multiplicamos por el vector final y sumamos.');
shot('language',2,'Así obtenemos un logit por candidato. El score del punto es el mayor, pero todavía no es una probabilidad.');
shot('language',3,'Aplicamos softmax sobre los candidatos. Antes repartíamos atención entre posiciones; ahora repartimos probabilidad entre tokens.');
shot('language',4,'Elegimos el candidato con mayor probabilidad: el punto. Esta elección concreta se llama argmax.');
shot('finish',0,'Lo añadimos al texto: el tamal estaba masacotudo, punto. En un modelo real, repetiríamos el proceso para continuar.');
shot('finish',1,'Ya seguiste una entrada hasta una predicción. Puedes volver a cualquier cuenta y ver cómo nace cada número.');
let total=0;scenes.forEach((s,i)=>{s.index=i;s.start=total;total+=s.duration;s.end=total});chapters.forEach((c,i)=>{c.time=scenes[c.start].start;c.end=i+1<chapters.length?scenes[chapters[i+1].start].start:total});
window.Story={scenes,chapters,total};
})();
