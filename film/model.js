(()=>{
"use strict";
const X=[[1,0,0,0],[0,1,0,0],[1,0,2,1]];
const WQ=[[1,0,1,0],[0,1,0,1],[0,.5,0,.5],[0,0,0,0]],WK=[[1,1,1,1],[1,1,0,0],[0,-1,0,-1],[0,0,0,0]],WV=[[2,0],[0,2],[-.5,.5],[0,0]];
const WO=[[1,0,1,0],[0,1,0,1]],W1=[[1,0,0,0,1,-1,1,-1],[0,1,0,0,0,0,0,0],[0,0,1,0,1,-1,1,-1],[0,0,0,1,0,0,0,0]],W2=[[1,0,0,0],[0,0,0,0],[0,0,1,0],[0,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,1],[0,0,0,0]];
const transpose=a=>a[0].map((_,j)=>a.map(r=>r[j])),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),mul=(a,b)=>a.map(r=>transpose(b).map(c=>dot(r,c))),softmax=a=>{let m=Math.max(...a),e=a.map(x=>Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s)},add=(a,b)=>a.map((x,i)=>x+b[i]),stats=a=>{let mean=a.reduce((s,x)=>s+x,0)/a.length,v=a.reduce((s,x)=>s+(x-mean)**2,0)/a.length;return {mean,variance:v,sd:Math.sqrt(v+1e-5)}},norm=a=>{let s=stats(a);return a.map(x=>(x-s.mean)/s.sd)},f=(n,d=4)=>Number(n.toFixed(d)).toString();
const Q=mul(X,WQ),K=mul(X,WK),V=mul(X,WV),S=mul(Q,transpose(K)),A=S.map(r=>softmax(r.map(x=>x/2))),Z=mul(A,V),a=mul([Z[2]],WO)[0],res=add(X[2],a),ln=norm(res),hidden=mul([ln],W1)[0],relu=hidden.map(x=>Math.max(0,x)),ff=mul([relu],W2)[0],res2=add(ln,ff),Y=norm(res2);
const pe=p=>[Math.sin(p),Math.cos(p),Math.sin(p/100),Math.cos(p/100)],E=X.map((r,i)=>r.map((v,j)=>v-pe(i)[j]));

const vocab=['.','y','pero','<fin>'];
const Wvocab=[[3,1,0,-1],[-1,0,1,0],[1,0,0,0],[0,0,0,0]];
const logits=mul([Y],Wvocab)[0],probabilities=softmax(logits);
window.Model={X,WQ,WK,WV,WO,W1,W2,Q,K,V,S,A,Z,a,res,ln,hidden,relu,ff,res2,Y,E,pe,stats,norm,softmax,dot,mul,transpose,f,vocab,Wvocab,logits,probabilities};
})();
