/* V3.1: texto y TeX comparten el mismo tratamiento en editor, motor y bancos.
 * Moneda nueva: CLP 3000. Se preservan los $ monetarios de entregas anteriores.
 */
window.PACEText=(()=>{
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function parts(value){
  return String(value??'').split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$]*?\$)/g).filter(Boolean).map(text=>{
   const explicit=text.startsWith('$$')||text.startsWith('\\(')||text.startsWith('\\[');
   const single=text.startsWith('$')&&text.endsWith('$')&&text.length>1;
   // Solo se protege el patrón monetario con prosa entre importes, no fórmulas.
   const currency=single&&!explicit&&/^\$\s*\d/.test(text)&&/\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(text)&&!/[\\=^_{}+*/<>]/.test(text);
   return {text,math:explicit||(single&&!currency)};
  });
 }
 const strip=t=>t.startsWith('$$')?t.slice(2,-2):t.startsWith('\\(')||t.startsWith('\\[')?t.slice(2,-2):t.slice(1,-1);
 const html=v=>parts(v).map(p=>'<span'+(p.math?'':' class="tex2jax_ignore"')+'>'+escape(p.text).replace(/\r?\n/g,'<br>')+'</span>').join('');
 return {parts,strip,html};
})();

/* Respuesta escrita (prototipo): solo números y conjuntos de números.
 * Pregunta: {type:'input', kind:'number'|'set', q, answer, reduced?, why}
 *  - number: "3/2", "-4", "0,75", "√9"... (valor numérico equivalente; reduced=true exige fracción irreductible)
 *  - set: soluciones separadas por ";", "y" o ", " (coma + espacio). Vacío: ∅.  Orden y "x =" opcionales.
 */
window.PACETyped=(()=>{
 const TOL=1e-9;
 const same=(a,b)=>Math.abs(a-b)<=TOL*Math.max(1,Math.abs(a),Math.abs(b));
 function tokens(src){
  let s=String(src).replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/[÷:]/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\bpi\b/gi,'π');
  const out=[];let i=0;
  while(i<s.length){
   const c=s[i];
   if(/\s/.test(c)){out.push({t:'sp'});i++;continue;}
   const m=/^\d+(?:[.,]\d+)?/.exec(s.slice(i));
   if(m){out.push({t:'num',v:m[0]});i+=m[0].length;continue;}
   if('+-*/^()√π'.includes(c)){out.push({t:c});i++;continue;}
   throw Error('símbolo no permitido: '+c);
  }
  // los espacios solo separan; dos números seguidos ("1 1/2") no se aceptan
  const res=[];for(let k=0;k<out.length;k++){
   if(out[k].t==='sp'){const a=res[res.length-1],b=out.slice(k).find(x=>x.t!=='sp');if(a&&b&&a.t==='num'&&b.t==='num')throw Error('dos números seguidos');continue;}
   res.push(out[k]);}
  return res;
 }
 function parse(src){
  const T=tokens(src);let p=0;const peek=()=>T[p]&&T[p].t,next=()=>T[p++];
  if(!T.length)throw Error('vacío');
  function expr(){let a=term();while(peek()==='+'||peek()==='-'){const o=next().t;a={t:o==='+'?'add':'sub',a,b:term()};}return a;}
  function term(){let a=unary();
   for(;;){const k=peek();
    if(k==='*'){next();a={t:'mul',a,b:unary()};}
    else if(k==='/'){next();a={t:'div',a,b:unary()};}
    else if(k==='('||k==='π'||k==='√'){a={t:'mul',a,b:unary(),imp:true};}
    else break;}
   return a;}
  function unary(){const k=peek();if(k==='-'){next();return {t:'neg',a:unary()};}if(k==='+'){next();return unary();}return pow();}
  function pow(){const a=atom();if(peek()==='^'){next();return {t:'pow',a,b:unary()};}return a;}
  function atom(){const k=peek();
   if(k==='num'){return {t:'num',v:next().v};}
   if(k==='π'){next();return {t:'pi'};}
   if(k==='√'){next();return {t:'sqrt',a:atomOrPow()};}
   if(k==='('){next();const e=expr();if(peek()!==')')throw Error('paréntesis sin cerrar');next();return {t:'par',a:e};}
   throw Error('expresión incompleta');}
  function atomOrPow(){const k=peek();if(k==='-')throw Error('raíz de signo');return atom();}
  const e=expr();if(p<T.length)throw Error('sobra: '+peek());return e;
 }
 function val(n){
  switch(n.t){
   case 'num':return parseFloat(n.v.replace(',','.'));
   case 'pi':return Math.PI;
   case 'par':return val(n.a);
   case 'neg':return -val(n.a);
   case 'add':return val(n.a)+val(n.b);
   case 'sub':return val(n.a)-val(n.b);
   case 'mul':return val(n.a)*val(n.b);
   case 'div':{const d=val(n.b);if(d===0)throw Error('división por cero');return val(n.a)/d;}
   case 'pow':{const r=Math.pow(val(n.a),val(n.b));if(!Number.isFinite(r))throw Error('potencia no válida');return r;}
   case 'sqrt':{const x=val(n.a);if(x<0)throw Error('raíz de negativo');return Math.sqrt(x);}
  }
  throw Error('nodo');
 }
 function tex(n){
  switch(n.t){
   case 'num':return n.v.replace(/[.,]/,'{,}');
   case 'pi':return '\\pi';
   case 'par':return '\\left('+tex(n.a)+'\\right)';
   case 'neg':return '-'+tex(n.a);
   case 'add':return tex(n.a)+'+'+tex(n.b);
   case 'sub':return tex(n.a)+'-'+tex(n.b);
   case 'mul':return tex(n.a)+(n.imp?'\\,':'\\cdot ')+tex(n.b);
   case 'div':return '\\frac{'+tex(n.a)+'}{'+tex(n.b)+'}';
   case 'pow':return '{'+tex(n.a)+'}^{'+tex(n.b)+'}';
   case 'sqrt':return '\\sqrt{'+tex(n.a)+'}';
  }
  return '';
 }
 const isInt=n=>n.t==='num'&&!/[.,]/.test(n.v);
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 // ¿es un entero o una fracción de enteros ya simplificada (con signo opcional)?
 function irreducible(n){
  if(n.t==='neg')return irreducible(n.a);
  if(isInt(n))return true;
  const iv=x=>x.t==='neg'?(isInt(x.a)?-x.a.v:NaN):(isInt(x)?+x.v:NaN);
  if(n.t==='div'){const a=iv(n.a),b=iv(n.b);if(Number.isNaN(a)||Number.isNaN(b))return false;return b>1&&gcd(Math.abs(a),b)===1;}
  return false;
 }
 const NAME=/^\s*[A-Za-z]\d?\s*=\s*/;
 const EMPTY=/^\s*(?:∅|\{\s*\}|vac[ií]o|conjunto\s+vac[ií]o|sin\s+soluci[oó]n)\s*$/i;
 function splitSet(text){
  let t=String(text).trim().replace(NAME,'').trim();
  if(EMPTY.test(t))return [];
  t=t.replace(/^\{([\s\S]*)\}$/,'$1').trim();
  if(!t)throw Error('vacío');
  return t.replace(/\s+[ye]\s+/gi,';').split(/;|,\s+/).map(x=>x.trim()).filter(x=>x.length).map(x=>x.replace(NAME,''));
 }
 // devuelve {kind, nodes:[ast], values:[número]}
 function read(kind,text){
  if(kind==='set'){const parts=splitSet(text),nodes=parts.map(parse);return {kind,nodes,values:nodes.map(val)};}
  const t=String(text).trim().replace(NAME,'');const n=parse(t);return {kind:'number',nodes:[n],values:[val(n)]};
 }
 function dedupe(vs){const o=[];for(const v of vs)if(!o.some(x=>same(x,v)))o.push(v);return o;}
 function answerTex(q){
  const r=read(q.kind,q.answer);
  if(q.kind==='set')return r.nodes.length?'\\left\\{'+r.nodes.map(tex).join(';\\ ')+'\\right\\}':'\\varnothing';
  return tex(r.nodes[0]);
 }
 function previewTex(kind,text){
  if(!String(text).trim())return '';
  try{const r=read(kind,text);
   if(kind==='set')return r.nodes.length?'\\left\\{'+r.nodes.map(tex).join(';\\ ')+'\\right\\}':'\\varnothing';
   return tex(r.nodes[0]);}catch(e){return null;}
 }
 function hint(q){
  return q.kind==='set'
   ?'Escribe todas las soluciones separadas por «;» o por «y» (por ejemplo: 2; 3). Si no hay solución, escribe ∅.'
   :'Escribe un número: entero, decimal (con coma o punto) o fracción (por ejemplo: 3/4).'+(q.reduced?' Debe ir simplificado.':'');
 }
 // estados: ok | wrong | invalid | empty | reduce | missing | extra
 function check(q,text){
  if(!String(text).trim())return {state:'empty',msg:'Escribe tu respuesta antes de comprobar.'};
  let got,exp;
  try{exp=read(q.kind,q.answer);}catch(e){return {state:'invalid',msg:'Esta pregunta tiene una respuesta mal configurada.'};}
  try{got=read(q.kind,text);}catch(e){return {state:'invalid',msg:'No pude leer tu respuesta. '+hint(q)};}
  if(q.kind==='set'){
   const g=dedupe(got.values),x=dedupe(exp.values);
   const missing=x.filter(v=>!g.some(w=>same(v,w))),extra=g.filter(v=>!x.some(w=>same(v,w)));
   if(!missing.length&&!extra.length)return {state:'ok'};
   if(extra.length)return {state:'extra',msg:'Alguno de los valores que escribiste no es solución. Revísalo e inténtalo de nuevo.'};
   return {state:'missing',msg:'Vas bien, pero faltan soluciones.'};
  }
  if(!same(got.values[0],exp.values[0]))return {state:'wrong',msg:'Todavía no. Revisa el procedimiento e inténtalo nuevamente.'};
  if(q.reduced&&!irreducible(got.nodes[0]))return {state:'reduce',msg:'Ese valor es equivalente, pero debes escribirlo como número o fracción simplificada.'};
  return {state:'ok'};
 }
 // teclas del teclado en pantalla: [texto visible, texto a insertar | acción]
 function keys(kind){
  const k=[['7'],['8'],['9'],['4'],['5'],['6'],['1'],['2'],['3'],['0'],[','],['−','-'],['/'],['^'],['²'],['√'],['π'],['('],[')']];
  if(kind==='set')k.push([';','; '],['y',' y '],['x'],['='],['∅']);
  k.push(['⌫','@del']);
  return k;
 }
 return {read,check,hint,keys,answerTex,previewTex,parse,val,tex};
})();
