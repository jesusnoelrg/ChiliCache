function obtenerDatos(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error al obtener datos:', error));
}

function cargarDatos(config) {
    obtenerDatos(config.url, (data) => {
        console.log("Datos obtenidos:", data);
        if (data.length > 0) {
            llenarTabla(data, config.columnas, config.acciones);
        } else {
            tablaVacia(`No hay datos disponibles para ${config.entidad}.`, config.columnas.length + 1);
        }
    });
}


function llenarTabla(datos, columnas, accionesHTML) {
    const tbody = document.querySelector("#tablaDatos tbody");
    tbody.innerHTML = "";

    if (datos.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="${columnas.length + 1}" class="text-center">No hay datos disponibles.</td>
        </tr>`;
        return;
    }

    datos.forEach(dato => {
        const fila = document.createElement("tr");
        let celdas = '';

        columnas.forEach(col => {
            if (col === 'Direccion') {
                celdas += `<td>${acortarTexto(dato[col], 30)}</td>`;
            } else {
                celdas += `<td>${dato[col]}</td>`;
            }
        });

        fila.innerHTML = celdas + `<td>${accionesHTML(dato)}</td>`;
        tbody.appendChild(fila);
    });

    recargarTooltips();
}


function tablaVacia(mensaje, colspan) {
    const tbody = document.querySelector("#tablaDatos tbody");
    tbody.innerHTML = `
    <tr>
        <td colspan="${colspan}" class="text-center">${mensaje}</td>
    </tr>`;
}

function formatoTelefonico(numero) {
    const limpiar  = ('' + numero).replace(/\D/g, '');
    const match = limpiar.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
    }

    return null;
}

function mostrarModalConfirmacion(mensaje, accion){
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
    const btnConfirmacion = document.getElementById('btnConfirmacion');

    document.getElementById('mensajeConfirmacion').textContent = mensaje;

    btnConfirmacion.onclick = () => {
        accion();
        modal.hide();
    }

    modal.show();
}

function mostrarAlerta(mensaje, tipo){
    const icono = document.getElementById('iconoAlerta');
    const cajaIcono = document.getElementById('cajaIconoAlerta');
    const titulo = document.getElementById('tituloAlerta');
    const btn = document.getElementById('btnAlerta');

    icono.classList.remove('bi-check', 'bi-x', 'bi-info');

    if(tipo == 'exitoso'){
        icono.classList.add('bi-check');
        cajaIcono.style = 'background-color: var(--color-primario);'
        btn.style = 'background-color: var(--color-primario);'
        titulo.textContent = '¡Exitoso!'
    }else if(tipo == 'info'){
        icono.classList.add('bi-info');
        cajaIcono.style = 'background-color: var(--info);'
        btn.style = 'background-color: var(--info);'
        titulo.textContent = 'Información'

    }else{
        icono.classList.add('bi-x');
        cajaIcono.style = 'background-color: var(--error);'
        btn.style = 'background-color: var(--error);'
        titulo.textContent = 'Error'
    }

    const modal = new bootstrap.Modal(document.getElementById('modalAlerta'));
    document.getElementById('mensajeAlerta').textContent = mensaje;
    modal.show();
}

function obtenerUsuarios(callback) {
    fetch('/usuarios')
        .then(response => response.json())
        .then(data => {
            callback(data);
        })
        .catch(error => console.error('Error al obtener usuarios: ', error));
}

function obtenerClientes(callback){
    fetch('/clientes')
        .then(response => response.json())
        .then(data => {
            callback(data);
        })
        .catch(error => console.error('Error al obtener clientes: ', error))
}

function acortarTexto(texto, maxLongitud) {
    if (texto.length > maxLongitud) {
        return texto.slice(0, maxLongitud) + '...';
    }

    return texto;
}