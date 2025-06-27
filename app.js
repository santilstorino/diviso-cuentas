// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyDxCMuFVfk2L8BdF-Pt-CI-D_XtNeWPULg",
  authDomain: "divisor-cuentas.firebaseapp.com",
  projectId: "divisor-cuentas",
  storageBucket: "divisor-cuentas.appspot.com",
  messagingSenderId: "873311462010",
  appId: "1:873311462010:web:1e2b75de2732ab90c51c3",
  measurementId: "G-3K59WN59D0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Variables globales ---
let amigos = [];
let gastos = [];
let grupoId = null;
let unsubAmigos = null;
let unsubGastos = null;
let codigoGrupoCreado = null;
let mpDatos = '';
let deudasPagadas = {};

// --- Elementos del DOM ---
const grupoSection = document.getElementById('grupo-section');
const codigoGrupoInput = document.getElementById('codigo-grupo');
const unirseGrupoBtn = document.getElementById('unirse-grupo');
const mainApp = document.getElementById('main-app');
const amigoInput = document.getElementById('amigo-nombre');
const agregarAmigoBtn = document.getElementById('agregar-amigo');
const listaAmigos = document.getElementById('lista-amigos');
const gastoDescInput = document.getElementById('gasto-desc');
const gastoMontoInput = document.getElementById('gasto-monto');
const gastoPagadorSelect = document.getElementById('gasto-pagador');
const agregarGastoBtn = document.getElementById('agregar-gasto');
const listaGastos = document.getElementById('lista-gastos');
const calcularBtn = document.getElementById('calcular');
const resumenDeudas = document.getElementById('resumen-deudas');
const responsableSelect = document.getElementById('responsable-select');
const gastoParticipantesDiv = document.getElementById('gasto-participantes');
const crearGrupoBtn = document.getElementById('crear-grupo');
const mostrarUnirseBtn = document.getElementById('mostrar-unirse');
const unirseDiv = document.getElementById('unirse-div');
const codigoCreadoDiv = document.getElementById('codigo-creado');
const codigoCreadoText = document.getElementById('codigo-creado-text');
const copiarCodigoBtn = document.getElementById('copiar-codigo');
const entrarGrupoBtn = document.getElementById('entrar-grupo');
const nombreUsuarioInput = document.getElementById('nombre-usuario');
const grupoInfoDiv = document.getElementById('grupo-info');
const mpDatosInput = document.getElementById('mp-datos');
const guardarMpBtn = document.getElementById('guardar-mp');
const mpDatosMostrado = document.getElementById('mp-datos-mostrado');
const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');

// --- Funciones de grupo ---
function mostrarApp(grupo) {
    grupoSection.style.display = 'none';
    mainApp.style.display = 'block';
    document.title = `Divisor de Cuentas - ${grupo}`;
    mostrarGrupoInfo(grupo);
    escucharMpDatos(grupo);
}

function mostrarGrupoInfo(grupo) {
    const url = `${window.location.origin}${window.location.pathname}?grupo=${grupo}`;
    grupoInfoDiv.innerHTML = `
        <b>Código del grupo:</b> <span style='font-size:1.1em;'>${grupo}</span>
        <button id="copiar-codigo-main">Copiar código</button>
        <button id="compartir-grupo">Compartir grupo</button>
        <br><small>Link directo: <input id="link-grupo" value="${url}" readonly style="width:220px;"> <button id="copiar-link">Copiar link</button></small>
    `;
    document.getElementById('copiar-codigo-main').onclick = () => {
        navigator.clipboard.writeText(grupo);
        document.getElementById('copiar-codigo-main').textContent = '¡Copiado!';
        setTimeout(() => { document.getElementById('copiar-codigo-main').textContent = 'Copiar código'; }, 1500);
    };
    document.getElementById('copiar-link').onclick = () => {
        navigator.clipboard.writeText(url);
        document.getElementById('copiar-link').textContent = '¡Copiado!';
        setTimeout(() => { document.getElementById('copiar-link').textContent = 'Copiar link'; }, 1500);
    };
    document.getElementById('compartir-grupo').onclick = () => {
        if (navigator.share) {
            navigator.share({ title: 'Divisor de Cuentas', text: `Unite a mi grupo: ${grupo}`, url });
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copiado. Compartilo por WhatsApp, Telegram, etc.');
        }
    };
}

function ocultarApp() {
    grupoSection.style.display = 'block';
    mainApp.style.display = 'none';
    document.title = 'Divisor de Cuentas';
}

function escucharGrupo(grupo) {
    // Limpiar listeners anteriores
    if (unsubAmigos) unsubAmigos();
    if (unsubGastos) unsubGastos();
    // Escuchar amigos
    unsubAmigos = db.collection('grupos').doc(grupo).collection('amigos')
        .onSnapshot(snap => {
            amigos = snap.docs.map(doc => doc.data().nombre);
            actualizarListaAmigos();
        });
    // Escuchar gastos
    unsubGastos = db.collection('grupos').doc(grupo).collection('gastos')
        .onSnapshot(snap => {
            gastos = snap.docs.map(doc => doc.data());
            actualizarListaGastos();
        });
}

// --- Lógica para crear/unirse a grupo ---
function generarCodigoGrupo() {
    // Código aleatorio de 6 caracteres
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

// --- Nombre de usuario ---
function obtenerNombreUsuario() {
    let nombre = nombreUsuarioInput.value.trim();
    if (!nombre) {
        nombre = localStorage.getItem('nombreUsuario') || '';
    }
    return nombre;
}

function guardarNombreUsuario(nombre) {
    localStorage.setItem('nombreUsuario', nombre);
}

crearGrupoBtn.addEventListener('click', () => {
    const nombreUsuario = nombreUsuarioInput.value.trim();
    if (!nombreUsuario) {
        alert('Por favor, ingresá tu nombre antes de crear un grupo.');
        nombreUsuarioInput.focus();
        return;
    }
    guardarNombreUsuario(nombreUsuario);
    const codigo = generarCodigoGrupo();
    grupoId = codigo;
    codigoGrupoCreado = codigo;
    db.collection('grupos').doc(codigo).set({ creado: Date.now() });
    codigoCreadoDiv.style.display = 'block';
    codigoCreadoText.innerHTML = `<b>Código de grupo:</b> <span style='font-size:1.2em;'>${codigo}</span><br>Compartilo con tus amigos para que se unan.`;
    unirseDiv.style.display = 'none';
    // No entrar aún, esperar a que el usuario haga clic en 'Entrar al grupo'
});

copiarCodigoBtn.addEventListener('click', () => {
    if (codigoGrupoCreado) {
        navigator.clipboard.writeText(codigoGrupoCreado);
        copiarCodigoBtn.textContent = '¡Copiado!';
        setTimeout(() => { copiarCodigoBtn.textContent = 'Copiar código'; }, 1500);
    }
});

entrarGrupoBtn.addEventListener('click', () => {
    if (codigoGrupoCreado) {
        mostrarApp(codigoGrupoCreado);
        escucharGrupo(codigoGrupoCreado);
        codigoCreadoDiv.style.display = 'none';
    }
});

mostrarUnirseBtn.addEventListener('click', () => {
    unirseDiv.style.display = 'block';
    codigoCreadoDiv.style.display = 'none';
});

unirseGrupoBtn.addEventListener('click', () => {
    const nombreUsuario = nombreUsuarioInput.value.trim();
    if (!nombreUsuario) {
        alert('Por favor, ingresá tu nombre antes de unirte a un grupo.');
        nombreUsuarioInput.focus();
        return;
    }
    guardarNombreUsuario(nombreUsuario);
    const codigo = codigoGrupoInput.value.trim();
    if (!codigo) return;
    grupoId = codigo;
    mostrarApp(codigo);
    escucharGrupo(codigo);
});

// --- Funciones de amigos/gastos (adaptadas a Firebase) ---
function actualizarListaAmigos() {
    listaAmigos.innerHTML = '';
    gastoPagadorSelect.innerHTML = '';
    responsableSelect.innerHTML = '';
    gastoParticipantesDiv.innerHTML = '';
    amigos.forEach(amigo => {
        const li = document.createElement('li');
        li.textContent = amigo;
        listaAmigos.appendChild(li);
        // Para el select de pagador
        const option = document.createElement('option');
        option.value = amigo;
        option.textContent = amigo;
        gastoPagadorSelect.appendChild(option);
        // Para el select de responsable
        const optionResp = document.createElement('option');
        optionResp.value = amigo;
        optionResp.textContent = amigo;
        responsableSelect.appendChild(optionResp);
        // Para los checkboxes de participantes
        const label = document.createElement('label');
        label.style.marginRight = '10px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = amigo;
        checkbox.className = 'participante-checkbox';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(amigo));
        gastoParticipantesDiv.appendChild(label);
    });
}

function actualizarListaGastos() {
    listaGastos.innerHTML = '';
    gastos.forEach(gasto => {
        const li = document.createElement('li');
        let creador = gasto.creadoPor ? ` (por ${gasto.creadoPor})` : '';
        li.textContent = `${gasto.pagador} pagó $${gasto.monto} por ${gasto.descripcion} (para: ${gasto.participantes.join(', ')})${creador}`;
        listaGastos.appendChild(li);
    });
}

function agregarAmigo() {
    const nombre = amigoInput.value.trim();
    const usuario = obtenerNombreUsuario();
    if (nombre && !amigos.includes(nombre) && grupoId) {
        db.collection('grupos').doc(grupoId).collection('amigos').add({ nombre, creadoPor: usuario });
        amigoInput.value = '';
    }
}

function agregarGasto() {
    const descripcion = gastoDescInput.value.trim();
    const monto = parseFloat(gastoMontoInput.value);
    const pagador = gastoPagadorSelect.value;
    const participantes = Array.from(document.querySelectorAll('.participante-checkbox:checked')).map(cb => cb.value);
    const usuario = obtenerNombreUsuario();
    if (descripcion && monto > 0 && pagador && participantes.length > 0 && grupoId) {
        db.collection('grupos').doc(grupoId).collection('gastos').add({ descripcion, monto, pagador, participantes, creadoPor: usuario });
        gastoDescInput.value = '';
        gastoMontoInput.value = '';
        document.querySelectorAll('.participante-checkbox').forEach(cb => cb.checked = false);
    }
}

function calcularDeudas() {
    if (amigos.length === 0 || gastos.length === 0) return;
    const responsable = responsableSelect.value;
    if (!responsable) return;
    let debe = {};
    amigos.forEach(a => { debe[a] = 0; });
    gastos.forEach(gasto => {
        const montoPorPersona = gasto.monto / gasto.participantes.length;
        gasto.participantes.forEach(a => {
            debe[a] += montoPorPersona;
        });
    });
    resumenDeudas.innerHTML = '';
    amigos.forEach(a => {
        if (a !== responsable) {
            let li = document.createElement('li');
            if (debe[a] > 0) {
                // Botón de pago y pagado en efectivo
                let pagado = deudasPagadas[a + '_' + responsable + '_' + grupoId];
                li.innerHTML = pagado
                  ? `<s>${a} le debe $${debe[a].toFixed(2)} a ${responsable} (Pagado)</s>`
                  : `${a} le debe $${debe[a].toFixed(2)} a ${responsable}` +
                    (mpDatos ? ` <button onclick="window.open('${mpDatos}','_blank')">Pagar por MP</button>` : '') +
                    ` <button onclick="marcarPagado('${a}','${responsable}','${grupoId}')">Pagado en efectivo</button>`;
            } else {
                li.textContent = `${a} está saldado.`;
            }
            resumenDeudas.appendChild(li);
        }
    });
}

// --- Eventos ---
agregarAmigoBtn.addEventListener('click', agregarAmigo);
agregarGastoBtn.addEventListener('click', agregarGasto);
calcularBtn.addEventListener('click', calcularDeudas);
amigoInput.addEventListener('keyup', e => { if (e.key === 'Enter') agregarAmigo(); });
gastoDescInput.addEventListener('keyup', e => { if (e.key === 'Enter') agregarGasto(); });
gastoMontoInput.addEventListener('keyup', e => { if (e.key === 'Enter') agregarGasto(); });

// --- Unirse automáticamente si hay ?grupo= en la URL ---
window.addEventListener('DOMContentLoaded', () => {
    const nombreGuardado = localStorage.getItem('nombreUsuario');
    if (nombreGuardado) nombreUsuarioInput.value = nombreGuardado;
    const params = new URLSearchParams(window.location.search);
    const grupoParam = params.get('grupo');
    if (grupoParam) {
        grupoId = grupoParam;
        mostrarApp(grupoParam);
        escucharGrupo(grupoParam);
    }
});

guardarMpBtn.addEventListener('click', () => {
    mpDatos = mpDatosInput.value.trim();
    if (mpDatos && grupoId) {
        db.collection('grupos').doc(grupoId).set({ mpDatos }, { merge: true });
        mostrarMpDatos();
    }
});

function mostrarMpDatos() {
    if (mpDatos) {
        mpDatosMostrado.innerHTML = `<b>Datos para pagar al responsable:</b> <br>${mpDatos}`;
    } else {
        mpDatosMostrado.innerHTML = '';
    }
}

// Escuchar cambios en los datos de MP del grupo
function escucharMpDatos(grupo) {
    db.collection('grupos').doc(grupo).onSnapshot(doc => {
        mpDatos = doc.data()?.mpDatos || '';
        mostrarMpDatos();
    });
}

// Función global para marcar deuda como pagada
window.marcarPagado = function(a, responsable, grupoId) {
    deudasPagadas[a + '_' + responsable + '_' + grupoId] = true;
    calcularDeudas();
}

// --- Modo oscuro ---
function setDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
    if (enabled) {
        toggleDarkModeBtn.textContent = '☀️ Modo claro';
    } else {
        toggleDarkModeBtn.textContent = '🌙 Modo oscuro';
    }
    localStorage.setItem('darkMode', enabled ? '1' : '0');
}

toggleDarkModeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    setDarkMode(!isDark);
});

// Al cargar la página, restaurar preferencia
window.addEventListener('DOMContentLoaded', () => {
    const darkPref = localStorage.getItem('darkMode') === '1';
    setDarkMode(darkPref);
}); 