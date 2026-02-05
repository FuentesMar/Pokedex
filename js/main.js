const listaPokemon = document.querySelector("#listaPokemon");
const botonesHeader = document.querySelectorAll(".btn-header:not(.btn-dropdown):not(#searchBtn)");
let URL = "https://pokeapi.co/api/v2/pokemon/";

const TOTAL_POKEMON = 1026;

function fetchConTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal })
        .then(res => {
            clearTimeout(id);
            if (!res.ok) throw new Error(String(res.status));
            return res.json();
        });
} 

function setLoading(isLoading){
    const status = document.querySelector('#globalStatus');
    const statusText = document.querySelector('#statusText');
    const searchInput = document.querySelector('#searchInput');
    const searchBtn = document.querySelector('#searchBtn');
    if(isLoading){
        if(status){ status.classList.remove('hidden'); status.classList.add('loading'); statusText.textContent = 'Cargando...';}
        if(searchInput) searchInput.disabled = true;
        if(searchBtn) searchBtn.disabled = true;
        botonesHeader.forEach(b => b.disabled = true);
    } else {
        if(status){ status.classList.remove('loading'); status.classList.add('hidden'); statusText.textContent = ''; }
        if(searchInput) searchInput.disabled = false;
        if(searchBtn) searchBtn.disabled = false;
        botonesHeader.forEach(b => b.disabled = false);
    }
}  

function mostrarEstado(message, type='info'){
    const status = document.querySelector('#globalStatus');
    const statusText = document.querySelector('#statusText');
    if(!status) return;
    status.classList.remove('hidden','loading','error','warning');
    status.classList.add(type);
    statusText.textContent = message;
}
function ocultarEstado(){
    const status = document.querySelector('#globalStatus');
    const statusText = document.querySelector('#statusText');
    if(!status) return;
    status.classList.add('hidden');
    status.classList.remove('loading','error','warning');
    statusText.textContent = '';
} 

async function cargarTodos(){
    setLoading(true);
    mostrarEstado('Cargando...', 'loading');
    const promises = [];
    for(let i=1;i<=TOTAL_POKEMON;i++){
        promises.push(fetchConTimeout(URL + i).then(data => ({ok:true, data})).catch(err => ({ok:false, err, id:i})));
    }
    const results = await Promise.all(promises);
    let anySuccess = false;
    results.forEach(r => {
        if(r.ok){ mostrarPokemon(r.data); anySuccess = true; }
    });

    if(!anySuccess) {
        mostrarEstadoVacio('Error al cargar Pokémon. Intenta recargar la página.');
    } else {
        ocultarEstado();
        ocultarEstadoVacio();
        if(results.some(r => !r.ok)) mostrarEstado('Algunos Pokémon no se cargaron. Reintentar', 'warning');
    }

    setLoading(false);
} 

function mostrarEstadoVacio(message='No encontrado'){
    const lista = document.querySelector('#listaPokemon');
    if(!lista) return;
    lista.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `<h3>${message}</h3><p>Prueba con otro nombre o número</p><button id="emptyCta" class="empty-action">Mostrar todos</button>`;
    lista.append(div);

    // CTA
    const cta = document.querySelector('#emptyCta');
    if(cta) cta.addEventListener('click', () => {
        ocultarEstadoVacio();
        cargarTodos();
    });
}

function ocultarEstadoVacio(){
    const lista = document.querySelector('#listaPokemon');
    if(!lista) return;
    const es = lista.querySelector('.empty-state');
    if(es) es.remove();
}  



const dropdown = document.querySelector('.dropdown');
const dropdownToggle = document.querySelector('.btn-dropdown');
if (dropdownToggle && dropdown) {
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

const searchInput = document.querySelector('#searchInput');
const searchBtn = document.querySelector('#searchBtn');
const searchMessage = document.querySelector('#searchMessage');

async function buscarPokemon() {
    const raw = searchInput ? searchInput.value.trim() : '';

    if (!raw) {
        listaPokemon.innerHTML = '';
        cargarTodos();
        if (searchMessage) searchMessage.textContent = '';
        return;
    }

    let q = raw.toLowerCase();
    q = q.replace(/^#/, '');

    listaPokemon.innerHTML = '';
    setLoading(true);
    mostrarEstado('Buscando...', 'loading');

    try {
        const data = await fetchConTimeout(URL + q);
        mostrarPokemon(data);
        if (searchMessage) searchMessage.textContent = '';
        ocultarEstado();
    } catch (err) {
        if (err.name === 'AbortError') mostrarEstadoVacio('Tiempo agotado. Intenta de nuevo');
        else if (err.message === '404') mostrarEstadoVacio(`No encontrado: ${raw}`);
        else mostrarEstadoVacio('Error en la búsqueda');
    } finally {
        setLoading(false);
    }

    if (dropdown) dropdown.classList.remove('open');
} 

if (searchBtn) searchBtn.addEventListener('click', buscarPokemon);
if (searchInput) searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarPokemon();
});

cargarTodos(); 

function mostrarPokemon(poke) {

    let tipos = poke.types.map((type) => `<p class="${type.type.name} tipo">${type.type.name}</p>`);
    tipos = tipos.join('');

    let pokeId = poke.id.toString();
    if (pokeId.length === 1) {
        pokeId = "00" + pokeId;
    } else if (pokeId.length === 2) {
        pokeId = "0" + pokeId;
    }


    const div = document.createElement("div");
    div.classList.add("pokemon");
    div.innerHTML = `
        <p class="pokemon-id-back">#${pokeId}</p>
        <div class="pokemon-imagen">
            <img src="${poke.sprites.other["official-artwork"].front_default}" alt="${poke.name}">
        </div>
        <div class="pokemon-info">
            <div class="nombre-contenedor">
                <p class="pokemon-id">#${pokeId}</p>
                <h2 class="pokemon-nombre">${poke.name}</h2>
            </div>
            <div class="pokemon-tipos">
                ${tipos}
            </div>
        </div>
    `;
    listaPokemon.append(div);
}

botonesHeader.forEach(boton => boton.addEventListener("click", async (event) => {
    const botonId = event.currentTarget.id;

    listaPokemon.innerHTML = "";
    setLoading(true);
    mostrarEstado('Cargando...', 'loading');
    const promises = [];
    for (let i = 1; i <= TOTAL_POKEMON; i++) {
        promises.push(fetchConTimeout(URL + i).then(data => ({ok:true, data})).catch(err => ({ok:false, err})));}

    const results = await Promise.all(promises);
    let found = false;
    results.forEach(r => {
        if(r.ok){
            if(botonId === 'ver-todos') { mostrarPokemon(r.data); found = true; }
            else {
                const tipos = r.data.types.map(type => type.type.name);
                if (tipos.includes(botonId)) { mostrarPokemon(r.data); found = true; }
            }
        }
    });

    if(!found) mostrarEstadoVacio(`No se encontraron Pokémon del tipo ${botonId}`);
    else { ocultarEstado(); ocultarEstadoVacio(); }

    setLoading(false);
    if (dropdown) dropdown.classList.remove('open');
}))