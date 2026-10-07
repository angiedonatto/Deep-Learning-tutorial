
(function(){
'use strict';
var $=function(s,scope){return (scope||document).querySelector(s)};
var $$=function(s,scope){return Array.prototype.slice.call((scope||document).querySelectorAll(s))};
var fmt=function(n,d){d=d==null?4:d;return Number(n).toFixed(d).replace(/\\.?0+$/,'')};

var Q=[[1,0,1,0],[0,1,0,1],[1,1,1,1]];
var K=[[1,1,1,1],[1,1,0,0],[1,-1,1,-1]];
var V=[[2,0],[0,2],[1,1]];
var S=[[2,1,2],[2,1,-2],[4,2,0]];
var SCALED=[[1,.5,1],[1,.5,-1],[2,1,0]];
var A=[[.3837,.2327,.3837],[.5741,.3482,.0777],[.6652,.2447,.09]];
var CAUSAL=[[1,0,0],[.6225,.3775,0],[.6652,.2447,.09]];
var ZCAUSAL=[[2,0],[1.2449,.7551],[1.4205,.5795]];

function matrix(title,data,cls,emphasis){
  cls=cls||''; emphasis=emphasis||[];
  var cols=data[0].length, html='';
  data.forEach(function(row,i){
    row.forEach(function(v,j){
      var emph=emphasis.some(function(x){return x[0]===i&&x[1]===j})?' emphasis':'';
      html+='<div class="matrix-cell '+cls+emph+'">'+v+'</div>';
    });
  });
  return '<div class="matrix-wrap"><div class="matrix-title">'+title+'</div><div class="matrix-grid" style="grid-template-columns:repeat('+cols+',58px)">'+html+'</div></div>';
}
function vectorBox(label,value,style){
  return '<div class="vector-box"'+(style?' style="'+style+'"':'')+'><span class="eyebrow">'+label+'</span><strong>'+value+'</strong></div>';
}
function bars(){
  return '<div class="weight-bars">'+
    '<div class="weight-row"><span>tamal</span><div class="weight-track"><div class="weight-fill" style="width:66.52%;background:var(--blue)">66.52%</div></div><code>0.6652</code></div>'+
    '<div class="weight-row"><span>estaba</span><div class="weight-track"><div class="weight-fill" style="width:24.47%;background:var(--purple)">24.47%</div></div><code>0.2447</code></div>'+
    '<div class="weight-row"><span>masacotudo</span><div class="weight-track"><div class="weight-fill" style="width:9%;background:var(--green)"></div></div><code>0.0900</code></div>'+
  '</div>';
}

var stages=[
 {short:'Datos dados',tag:'Paso 0 · Guía 13',title:'Empezamos exactamente donde empieza el ejercicio.',
  narration:'La guía entrega Q, K y V ya proyectadas. Aquí no inventamos WQ, WK ni WV: separamos con cuidado los datos que nos dan de las cuentas que sí tenemos que hacer.',
  anchor:'Punto de partida real: Q, K y V ya proyectadas; dk=4 y dv=2.',
  easy:'Tenemos tres palabras y para cada una ya nos dieron tres fichas numéricas: Q, K y V. Desde aquí arranca la cuenta.',
  why:'Porque en examen debes distinguir los datos entregados de los resultados que tú produces.',
  math:['1=tamal, 2=estaba, 3=masacotudo.','dk=4: Query y Key tienen 4 coordenadas.','dv=2: cada Value tiene 2 coordenadas.','T=3: las matrices tienen tres filas.'],
  visual:function(){return '<div class="formula-banner">“el tamal estaba masacotudo” → usamos tamal, estaba, masacotudo</div><div class="matrix-pair" style="margin-top:24px">'+matrix('Q · qué busca',Q,'q')+matrix('K · qué ofrece',K,'k')+matrix('V · qué aporta',V,'v')+'</div><div class="callout-grid"><div class="callout-card"><strong>Fila 1</strong><p>tamal</p></div><div class="callout-card"><strong>Fila 2</strong><p>estaba</p></div><div class="callout-card"><strong>Fila 3</strong><p>masacotudo: seguiremos esta fila.</p></div></div>'}},
 {short:'Scores',tag:'Paso 1 · QKᵀ',title:'Masacotudo compara su Query contra todas las Keys.',
  narration:'Una celda de S es un producto punto. Tomamos q₃ y lo comparamos con k₁, k₂ y k₃. Multiplicamos coordenada con coordenada y luego sumamos.',
  anchor:'Fila pregunta; columna ofrece su Key.',
  easy:'Masacotudo hace tres comparaciones: con tamal, con estaba y consigo mismo.',
  why:'Necesitamos un número que mida compatibilidad antes de repartir atención.',
  math:['q₃·k₁=1·1+1·1+1·1+1·1=4.','q₃·k₂=1·1+1·1+1·0+1·0=2.','q₃·k₃=1·1+1·(−1)+1·1+1·(−1)=0.','Fila 3 de S=(4,2,0).','S=[[2,1,2],[2,1,−2],[4,2,0]].'],
  visual:function(){return '<div class="formula-banner"><b style="color:var(--blue)">Q</b> · <b style="color:var(--purple)">Kᵀ</b> = S</div><div class="score-row"><div class="score-chip"><b>q₃·k₁ · tamal</b><strong>4</strong></div><div class="score-chip"><b>q₃·k₂ · estaba</b><strong>2</strong></div><div class="score-chip"><b>q₃·k₃ · masacotudo</b><strong>0</strong></div></div><div class="matrix-pair" style="grid-template-columns:1fr 1fr">'+matrix('S=QKᵀ',S,'',[[2,0],[2,1],[2,2]])+'<div class="formula-banner" style="text-align:left">q₃=(1,1,1,1)<br><br>k₁=(1,1,1,1) → <b>4</b><br>k₂=(1,1,0,0) → <b>2</b><br>k₃=(1,−1,1,−1) → <b>0</b></div></div>'}},
 {short:'Escalar',tag:'Paso 2 · ÷√dk',title:'Bajamos el volumen antes del softmax.',
  narration:'Como dk=4, dividimos los scores por √4=2. La fila de masacotudo pasa de (4,2,0) a (2,1,0).',
  anchor:'Escalar controla magnitudes; todavía no tenemos probabilidades.',
  easy:'Dividir por 2 es bajar el volumen antes de repartir la atención.',
  why:'Evita que softmax se vuelva demasiado extremo cuando crece dk.',
  math:['dk=4.','√dk=2.','(4,2,0)/2=(2,1,0).','Matriz escalada=[[1,0.5,1],[1,0.5,−1],[2,1,0]].'],
  visual:function(){return '<div class="vector-flow">'+vectorBox('scores crudos','(4, 2, 0)')+'<span class="flow-arrow">÷ √4 = 2</span>'+vectorBox('scores escalados','(2, 1, 0)','background:var(--gold-soft);border-color:#e9ca78')+'</div><div class="matrix-pair" style="grid-template-columns:1fr 1fr">'+matrix('S',S,'')+matrix('S/√dk',SCALED.map(function(r){return r.map(function(x){return fmt(x,1)})}),'a',[[2,0],[2,1],[2,2]])+'</div>'}},
 {short:'Softmax',tag:'Paso 3 · softmax',title:'Convertimos (2,1,0) en pesos que suman 1.',
  narration:'Exponenciamos cada score, sumamos las exponenciales y dividimos cada una por ese total. Softmax se aplica por filas.',
  anchor:'Cada fila reparte una cantidad total de atención igual a 1.',
  easy:'Masacotudo tiene 100 fichas: entrega aproximadamente 67 a tamal, 24 a estaba y 9 a sí mismo.',
  why:'Así obtenemos pesos positivos y normalizados para mezclar Values.',
  math:['e²≈7.3891, e¹≈2.7183, e⁰=1.','Denominador=7.3891+2.7183+1=11.1074.','7.3891/11.1074=0.6652.','2.7183/11.1074=0.2447.','1/11.1074=0.0900.','A₃=(0.6652,0.2447,0.0900).'],
  visual:function(){return '<div class="formula-banner">softmax(2,1,0)=(0.6652,0.2447,0.0900)</div>'+bars()+'<div style="margin-top:24px">'+matrix('A · softmax por filas',A.map(function(r){return r.map(function(x){return fmt(x,4)})}),'a',[[2,0],[2,1],[2,2]])+'</div>'}},
 {short:'Mezclar V',tag:'Paso 4 · AV',title:'Ahora sí viaja la información: A mezcla los Values.',
  narration:'Los pesos ya decidieron cuánto mirar. Ahora multiplican los Values y se suman para producir el nuevo vector contextual de masacotudo.',
  anchor:'Q y K encuentran; V transporta.',
  easy:'Tres tuberías aportan cantidades diferentes a una sola mezcla final.',
  why:'Los scores no contienen el contenido que viaja; ese contenido está en V.',
  math:['z₃=0.6652(2,0)+0.2447(0,2)+0.0900(1,1).','Coord.1=1.3304+0+0.0900≈1.4205.','Coord.2=0+0.4894+0.0900≈0.5795.','z₃=(1.4205,0.5795).'],
  visual:function(){return '<div class="vector-flow">'+vectorBox('0.6652 × V₁','(2,0)','border-color:#a7d8fb')+'<span class="flow-arrow">+</span>'+vectorBox('0.2447 × V₂','(0,2)','border-color:#cfc1ff')+'<span class="flow-arrow">+</span>'+vectorBox('0.0900 × V₃','(1,1)','border-color:#a8e6cf')+'</div><div class="final-result" style="margin-top:20px"><span>salida de atención</span><strong>z₃=(1.4205, 0.5795)</strong></div>'}},
 {short:'Wᴼ',tag:'Paso 5 · Guía 14',title:'Devolvemos la cabeza estrecha a dmodel con Wᴼ.',
  narration:'z₃ tiene 2 coordenadas porque dv=2, pero x₃ tiene 4. Wᴼ devuelve la salida de atención a dmodel=4 para que el residual pueda sumarse.',
  anchor:'Wᴼ devuelve la forma necesaria para el residual.',
  easy:'La cabeza salió con 2 números; Wᴼ la ensancha a 4.',
  why:'No se pueden sumar vectores de 2 y 4 coordenadas.',
  math:['Wᴼ=[[1,0,1,0],[0,1,0,1]].','a=z₃Wᴼ.','a=(1.4205,0.5795,1.4205,0.5795).'],
  visual:function(){return '<div class="vector-flow">'+vectorBox('z₃ · dv=2','(1.4205, 0.5795)')+'<span class="flow-arrow">× Wᴼ →</span>'+vectorBox('a · dmodel=4','(1.4205, 0.5795, 1.4205, 0.5795)','background:var(--blue-soft);border-color:#9cd4fb')+'</div><div style="max-width:480px;margin:0 auto">'+matrix('Wᴼ · 2×4',[[1,0,1,0],[0,1,0,1]],'q')+'</div>'}},
 {short:'Residual 1',tag:'Paso 6 · Add',title:'No reemplazamos x₃: le sumamos la corrección.',
  narration:'El atajo residual conserva la entrada y suma lo que aprendió la atención. La red aprende una corrección en vez de reconstruir todo.',
  anchor:'Residual=original+corrección.',
  easy:'Guardamos el original y escribimos encima solo el cambio.',
  why:'Conserva información y facilita el flujo del gradiente.',
  math:['x₃=(1,0,2,1).','a=(1.4205,0.5795,1.4205,0.5795).','x₃+a=(2.4205,0.5795,3.4205,1.5795).'],
  visual:function(){return '<div class="vector-flow">'+vectorBox('entrada original','x₃=(1,0,2,1)')+'<span class="flow-arrow">+</span>'+vectorBox('corrección','a=(1.4205,0.5795,1.4205,0.5795)')+'<span class="flow-arrow">=</span>'+vectorBox('residual','(2.4205,0.5795,3.4205,1.5795)','background:var(--gold-soft);border-color:#e8c877')+'</div>'}},
 {short:'LayerNorm 1',tag:'Paso 7 · Norm',title:'Centramos y reescalamos las 4 coordenadas.',
  narration:'LayerNorm usa las coordenadas de esta posición: calcula media, varianza y desviación, centra cada valor y divide por σ.',
  anchor:'LayerNorm normaliza una fila; no mezcla palabras.',
  easy:'Solo mira los cuatro números de masacotudo, los centra alrededor de 0 y controla la escala.',
  why:'Ayuda a estabilizar una red profunda.',
  math:['r=(2.4205,0.5795,3.4205,1.5795).','μ=2.0000.','r−μ=(0.4205,−1.4205,1.4205,−0.4205).','σ²=1.0973.','σ=1.0475.','x′₃=(0.4014,−1.3560,1.3560,−0.4014).'],
  visual:function(){return '<div class="layer-bars"><div class="bar-chart"><h4>Antes de LayerNorm</h4><div class="formula-banner">(2.4205, 0.5795, 3.4205, 1.5795)</div></div><div class="bar-chart"><h4>Después de LayerNorm</h4><div class="formula-banner">(0.4014, −1.3560, 1.3560, −0.4014)</div></div></div><div class="formula-banner" style="margin-top:20px">μ=2.0000 · σ²=1.0973 · σ=1.0475</div>'}},
 {short:'FFN',tag:'Paso 8 · 4→8→4',title:'Después de comunicarse, masacotudo procesa lo aprendido en la FFN.',
  narration:'La FFN trabaja por posición. W₁ expande 4→8, ReLU apaga los negativos y W₂ comprime 8→4.',
  anchor:'Atención comunica; FFN transforma una posición.',
  easy:'Después de la reunión, masacotudo trabaja solo: amplía, filtra y vuelve al ancho original.',
  why:'Introduce una transformación no lineal potente por posición.',
  math:['x′₃W₁=(0.4014,−1.3560,1.3560,−0.4014,1.7575,−1.7575,1.7575,−1.7575).','ReLU=(0.4014,0,1.3560,0,1.7575,0,1.7575,0).','Detectores 5 y 7 se encienden.','f=(2.1589,1.7575,3.1135,1.7575).'],
  visual:function(){return '<div class="ffn-network">'+vectorBox('dmodel=4','x′₃')+'<div><div class="neuron-bank"><div class="neuron on">.4014</div><div class="neuron off">0</div><div class="neuron on">1.356</div><div class="neuron off">0</div><div class="neuron on">1.7575</div><div class="neuron off">0</div><div class="neuron on">1.7575</div><div class="neuron off">0</div></div><div class="formula-banner" style="margin-top:14px">W₁ → ReLU · 4 → 8</div></div>'+vectorBox('W₂ · vuelve a 4','(2.1589,1.7575,3.1135,1.7575)','background:var(--green-soft);border-color:#a2dfc8')+'</div>'}},
 {short:'Residual 2 + LN',tag:'Paso 9 · salida',title:'Segundo atajo, segunda normalización: llegamos a y₃.',
  narration:'La FFN también produce una corrección. Se suma a x′₃ y se normaliza otra vez. Ese y₃ es la salida final del bloque para masacotudo.',
  anchor:'Mismo tamaño, nuevo contenido contextual.',
  easy:'Sumamos lo que ya sabía con lo que procesó en la FFN y lo estabilizamos otra vez.',
  why:'Repite la estructura residual+normalización después del segundo subbloque.',
  math:['x′₃+f=(2.5603,0.4014,4.4696,1.3560).','Media=2.1968.','Desviación=1.5189.','y₃=(0.2393,−1.1821,1.4963,−0.5536).'],
  visual:function(){return '<div class="vector-flow">'+vectorBox('x′₃','(0.4014,−1.3560,1.3560,−0.4014)')+'<span class="flow-arrow">+</span>'+vectorBox('f','(2.1589,1.7575,3.1135,1.7575)')+'</div><div class="final-result"><span>salida final del bloque</span><strong>y₃=(0.2393, −1.1821, 1.4963, −0.5536)</strong></div>'}},
 {short:'Historia completa',tag:'Paso 10 · comprobar',title:'Ahora mira toda la película de una sola vez.',
  narration:'No son piezas sueltas. Es una cadena donde cada salida tiene un destino claro: scores, escala, pesos, Values, dmodel, residual, normalización, FFN y salida.',
  anchor:'Si puedes reconstruir esta cadena sin mirar, ya tienes el bloque en la cabeza.',
  easy:'Masacotudo mira, trae, suma, se estabiliza, piensa solo, vuelve a sumar y se estabiliza.',
  why:'Ver el flujo completo evita memorizar fórmulas aisladas.',
  math:['Q,K,V→QKᵀ.','÷√dk→softmax→A.','AV→z₃=(1.4205,0.5795).','z₃Wᴼ→a.','LN(x₃+a)→x′₃.','FFN(x′₃)→f.','LN(x′₃+f)→y₃=(0.2393,−1.1821,1.4963,−0.5536).'],
  visual:function(){var nodes=[['Q,K,V','datos'],['QKᵀ','scores'],['÷√dk','escala'],['softmax','pesos'],['A·V','z₃'],['Wᴼ','dmodel'],['Add+LN','x′₃'],['FFN','f'],['Add+LN','y₃']];return '<div class="pipeline-map" style="grid-template-columns:repeat(3,1fr)">'+nodes.map(function(n){return '<div class="pipe-node"><b>'+n[0]+'</b><span>'+n[1]+'</span></div>'}).join('')+'</div><div class="final-result" style="margin-top:30px"><span>de principio a fin</span><strong>(1,0,2,1) → (0.2393,−1.1821,1.4963,−0.5536)</strong></div>'}}
];

var current=0,showAll=false,maskOn=false,presentIndex=0;

function buildStepList(){
  $('#stepList').innerHTML=stages.map(function(s,i){return '<button class="step-btn '+(i===0?'active':'')+'" data-step="'+i+'" type="button"><span class="step-num">'+i+'</span><span><strong>'+s.short+'</strong><small>'+s.tag+'</small></span></button>'}).join('');
  $$('[data-step]').forEach(function(b){b.addEventListener('click',function(){setStage(Number(b.dataset.step))})});
}
function renderMath(){
  var s=stages[current];
  $('#mathSteps').innerHTML=s.math.map(function(line,i){return '<div class="math-line '+(!showAll&&i>1?'hidden-line ':'')+(i===s.math.length-1?'highlight':'')+'"><span class="n">'+(i+1)+'</span><code>'+line+'</code></div>'}).join('');
  $('#toggleMathBtn').textContent=showAll?'Ocultar y hacerlo por pasos':'Mostrar todos los renglones';
}
function setStage(i){
  current=Math.max(0,Math.min(stages.length-1,i));showAll=false;
  var s=stages[current];
  $('#stageKicker').textContent=s.tag;$('#stageTitle').textContent=s.title;$('#stageNarration').textContent=s.narration;$('#stageAnchor').textContent=s.anchor;
  $('#visualStage').innerHTML=s.visual();
  $('#storyStrip').innerHTML=stages.map(function(x,idx){return '<span class="story-token '+(idx<current?'done':idx===current?'current':'')+'">'+idx+'. '+x.short+'</span>'}).join('');
  $('#stepProgressLabel').textContent='Paso '+current+' de '+(stages.length-1);
  $('#prevStep').disabled=current===0;$('#nextStep').disabled=current===stages.length-1;
  $$('.step-btn').forEach(function(b,idx){b.classList.toggle('active',idx===current)});
  $('#stepDots').innerHTML=stages.map(function(_,idx){return '<button class="step-dot '+(idx===current?'active':'')+'" data-dot="'+idx+'" type="button"></button>'}).join('');
  $$('[data-dot]').forEach(function(b){b.addEventListener('click',function(){setStage(Number(b.dataset.dot))})});
  renderMath();
}
function openModal(kind){
  var s=stages[current];$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false');
  if(kind==='easy'){$('#modalKicker').textContent='VERSIÓN SIN SÍMBOLOS';$('#modalTitle').textContent='La misma idea, hablada como humano.';$('#modalText').textContent=s.easy;$('#modalExtra').innerHTML='<strong>Frase ancla:</strong><br>'+s.anchor}
  else{$('#modalKicker').textContent='EL PORQUÉ';$('#modalTitle').textContent='¿Por qué existe este paso?';$('#modalText').textContent=s.why;$('#modalExtra').innerHTML='<strong>Conexión con el ejercicio:</strong><br>'+s.narration}
}
function closeModal(){$('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true')}

function renderMask(){
  var M=maskOn?[[0,'−∞','−∞'],[0,0,'−∞'],[0,0,0]]:[[0,0,0],[0,0,0],[0,0,0]];
  var W=maskOn?CAUSAL:A;
  var added=maskOn?[[1,'−∞','−∞'],[1,.5,'−∞'],[2,1,0]]:SCALED;
  $('#maskMatrixArea').innerHTML='<div class="mask-compare"><div><div class="formula-banner">'+(maskOn?'S/√dk + M':'S/√dk sin máscara')+'</div><div style="margin-top:16px">'+matrix(maskOn?'M · futuro=−∞':'M · todo permitido',M,maskOn?'masked':'')+'</div></div><div class="mask-compare-arrow">→</div><div><div style="margin-bottom:16px">'+matrix('scores antes de softmax',added.map(function(r){return r.map(function(v){return typeof v==='number'?fmt(v,1):v})}),maskOn?'masked':'')+'</div>'+matrix('pesos después de softmax',W.map(function(r){return r.map(function(v){return fmt(v,4)})}),'a')+'</div></div><div class="mask-explanation">'+(maskOn?'<strong>Con máscara:</strong> fila 1 solo mira 1; fila 2 mira 1 y 2; fila 3 mira 1,2,3. La tercera fila queda igual porque no tiene futuro a su derecha.':'<strong>Sin máscara:</strong> una posición puede leer palabras futuras durante entrenamiento y eso produce fuga de información.')+'</div>'+(maskOn?'<div style="margin-top:18px">'+matrix('Z causal=A causal·V',ZCAUSAL.map(function(r){return r.map(function(v){return fmt(v,4)})}),'v')+'</div>':'');
  $('#maskToggle').textContent=maskOn?'Quitar máscara para comparar':'Aplicar máscara causal';
}
function renderPosition(){
  var p=Number($('#positionSlider').value),pe=[Math.sin(p),Math.cos(p),Math.sin(p/100),Math.cos(p/100)],x=[1,0,2,1],sum=x.map(function(v,i){return v+pe[i]});
  $('#positionValue').textContent=p;
  $('#positionMath').innerHTML='<div class="position-row"><strong>PE('+p+')</strong>=(sin '+p+', cos '+p+', sin '+fmt(p/100,2)+', cos '+fmt(p/100,2)+')</div><div class="position-row">≈ ('+pe.map(function(v){return fmt(v,4)}).join(', ')+')</div><div class="position-row">x=(1,0,2,1)</div><div class="position-row"><strong>x+PE('+p+')</strong>=('+sum.map(function(v){return fmt(v,4)}).join(', ')+')</div>'+(p===2?'<div class="position-row" style="background:var(--gold-soft);border-color:#e7c976">✓ Caso exacto de la guía: (1.9093, −0.4161, 2.0200, 1.9998).</div>':'');
  $('.hand.fast').style.transform='translateX(-50%) rotate('+((p%(Math.PI*2))/(Math.PI*2)*360)+'deg)';
  $('.hand.slow').style.transform='translateX(-50%) rotate('+(((p/100)%(Math.PI*2))/(Math.PI*2)*360)+'deg)';
}
function renderParams(){
  var total=124439808;
  var rows=[['Atención · 12 bloques',28348416,'12 × (4×768² + 4×768)'],['FFN · 12 bloques',56669184,'12 × (2×768×3072 + 3072 + 768)'],['LayerNorms · 12 bloques',36864,'12 × 3072'],['Embeddings',38597376,'50,257 × 768'],['Posiciones aprendidas',786432,'1,024 × 768'],['LayerNorm final',1536,'2 × 768']];
  $('#paramStack').innerHTML=rows.map(function(r){var pct=r[1]/total*100;return '<div class="param-row"><div class="param-row-top"><strong>'+r[0]+'</strong><code>'+r[1].toLocaleString('en-US')+'</code></div><div class="param-bar"><span style="width:'+Math.max(.4,pct)+'%"></span></div><p>'+r[2]+' · '+pct.toFixed(2)+'% del total</p></div>'}).join('');
}
function renderPipeline(){
  var n=[['Tokens','texto','T posiciones'],['Embedding','contenido','T×dmodel'],['Posición','orden','x+PE'],['Q/K/V','tres roles','proyecciones'],['QKᵀ','scores','T×T'],['÷√dk','escala','estabilidad'],['Softmax','pesos','filas suman 1'],['A·V','contexto','T×dv'],['Multi-head','miradas','h cabezas'],['Wᴼ','regresar','dmodel'],['Residual+LN','conservar','x+corrección'],['FFN','procesar','dmodel→dff→dmodel'],['Residual+LN','salida','mismo shape'],['×N bloques','profundidad','representación'],['Logits','vocabulario','probabilidades']];
  $('#pipelineMap').innerHTML=n.map(function(x){return '<div class="pipe-node"><b>'+x[0]+'</b><span>'+x[1]+'</span><code>'+x[2]+'</code></div>'}).join('');
}

var slides=[
 ['La pregunta','¿Cómo consigue masacotudo entender su contexto?','Vamos a seguir una sola posición hasta ver cómo cambia su vector.'],
 ['Datos reales','El ejercicio empieza con Q, K y V ya proyectadas.','No inventamos matrices anteriores que la guía no entrega.'],
 ['Scores','q₃ produce los scores (4,2,0).','Producto punto: compatibilidad, todavía no probabilidad.'],
 ['Escala + softmax','(4,2,0) → (2,1,0) → (.6652,.2447,.09)','Escalamos y luego repartimos una unidad total de atención.'],
 ['Values','A mezcla V y produce z₃=(1.4205,.5795).','Aquí es donde realmente viaja la información.'],
 ['Bloque','Wᴼ → residual → LayerNorm → FFN.','z₃ vuelve a dmodel y continúa por el bloque.'],
 ['Resultado','y₃=(.2393,−1.1821,1.4963,−.5536).','Mismo tamaño que la entrada, contenido distinto.'],
 ['Masking','El futuro recibe −∞ antes de softmax.','exp(−∞)=0: las posiciones futuras quedan con peso cero.'],
 ['GPT‑2','124,439,808 parámetros.','12 bloques + embeddings + posiciones + LayerNorm final.']
];
function slideVisual(i){
  if(i===0)return '<div class="phrase-row"><div class="word-chip tamal">tamal</div><div class="word-chip estaba">estaba</div><div class="word-chip masacotudo">masacotudo</div></div>';
  if(i===1)return '<div class="matrix-pair">'+matrix('Q',Q,'q')+matrix('K',K,'k')+matrix('V',V,'v')+'</div>';
  if(i===2)return stages[1].visual();
  if(i===3)return stages[3].visual();
  if(i===4)return stages[4].visual();
  if(i===5)return '<div class="vector-flow">'+vectorBox('z₃','(1.4205,.5795)')+'<span class="flow-arrow">Wᴼ → Add+LN → FFN → Add+LN</span></div>';
  if(i===6)return stages[9].visual();
  if(i===7)return '<div class="mask-compare"><div>'+matrix('M',[[0,'−∞','−∞'],[0,0,'−∞'],[0,0,0]],'masked')+'</div><div class="mask-compare-arrow">→</div><div>'+matrix('A causal',CAUSAL.map(function(r){return r.map(function(v){return fmt(v,4)})}),'a')+'</div></div>';
  return '<div class="final-result"><span>GPT‑2 pequeño</span><strong>124,439,808</strong></div><div class="formula-banner" style="margin-top:20px">85,054,464 + 38,597,376 + 786,432 + 1,536</div>';
}
function renderPresent(){
  var s=slides[presentIndex];
  $('#presentContent').innerHTML='<div class="present-slide"><div><span class="eyebrow coral">'+(presentIndex+1)+' · recorrido</span><h2>'+s[1]+'</h2><p>'+s[2]+'</p></div><div class="present-visual">'+slideVisual(presentIndex)+'</div></div>';
  $('#presentCount').textContent=(presentIndex+1)+' / '+slides.length;
  $('#presentProgressFill').style.width=((presentIndex+1)/slides.length*100)+'%';
  $('#presentPrev').disabled=presentIndex===0;$('#presentNext').disabled=presentIndex===slides.length-1;
}
function openPresent(){presentIndex=0;$('#presentOverlay').classList.add('open');$('#presentOverlay').setAttribute('aria-hidden','false');renderPresent()}
function closePresent(){$('#presentOverlay').classList.remove('open');$('#presentOverlay').setAttribute('aria-hidden','true')}

buildStepList();setStage(0);renderMask();renderPosition();renderParams();renderPipeline();

$$('[data-jump]').forEach(function(b){b.addEventListener('click',function(){$('#'+b.dataset.jump).scrollIntoView({behavior:'smooth',block:'start'})})});
$('#prevStep').addEventListener('click',function(){setStage(current-1)});
$('#nextStep').addEventListener('click',function(){setStage(current+1)});
$('#toggleMathBtn').addEventListener('click',function(){showAll=!showAll;renderMath()});
$('#easyBtn').addEventListener('click',function(){openModal('easy')});
$('#whyBtn').addEventListener('click',function(){openModal('why')});
$('#modalClose').addEventListener('click',closeModal);
$('#modal').addEventListener('click',function(e){if(e.target.id==='modal')closeModal()});
$('#maskToggle').addEventListener('click',function(){maskOn=!maskOn;renderMask()});
$('#positionSlider').addEventListener('input',renderPosition);
$('#fullscreenBtn').addEventListener('click',function(){if(!document.fullscreenElement)document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();else document.exitFullscreen&&document.exitFullscreen()});
$('#examBtn').addEventListener('click',function(){document.body.classList.toggle('exam-mode');$('#examBtn').textContent=document.body.classList.contains('exam-mode')?'Salir del examen':'Modo examen'});
$('#presentBtn').addEventListener('click',openPresent);$('#tourBtn').addEventListener('click',openPresent);$('#presentClose').addEventListener('click',closePresent);
$('#presentPrev').addEventListener('click',function(){if(presentIndex>0){presentIndex--;renderPresent()}});
$('#presentNext').addEventListener('click',function(){if(presentIndex<slides.length-1){presentIndex++;renderPresent()}});
document.addEventListener('keydown',function(e){
  if($('#presentOverlay').classList.contains('open')){
    if(e.key==='ArrowRight'&&presentIndex<slides.length-1){presentIndex++;renderPresent()}
    if(e.key==='ArrowLeft'&&presentIndex>0){presentIndex--;renderPresent()}
    if(e.key==='Escape')closePresent();return;
  }
  if(e.key==='Escape')closeModal();
});
})();
