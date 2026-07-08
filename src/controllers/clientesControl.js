const formClientes = {
    entidad: 'Cliente',
    url: '/clientes',
    campos: [
        { id: 'floatingEmpresa', nombre: 'Empresa' },
        { id: 'floatingRFC', nombre: 'RFC' },
        { id: 'floatingDireccion', nombre: 'Direccion' },
        { id: 'floatingCorreo', nombre: 'Correo' },
        { id: 'floatingTelefono', nombre: 'Telefono' }
    ]
};

const configClientes = {
    url: '/clientes',
    columnas: ['IDCliente', 'Empresa', 'RFC', 'Direccion', 'Correo', 'Telefono'],
    acciones: (cliente) => `
        <button type="button" class="btn btn-secondary mx-1" onclick="editarCliente(${cliente.IDCliente});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Editar cliente">
            <i class="bi bi-gear-fill"></i>
        </button>
        <button class="btn btn-danger mx-1" onclick="eliminarCliente(${cliente.IDCliente});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Eliminar cliente">
            <i class="bi bi-trash3-fill"></i>
        </button>
    `
};

function abrirModalNuevoCliente() {
    abrirModal(formClientes, 'nuevo');
}

function abrirModalEditarCliente(datos) {
    abrirModal(formClientes, 'editar', datos);
}


document.addEventListener('DOMContentLoaded', () => {
    cargarDatos(configClientes);
    enviarFormulario(formClientes, configClientes);
});

function editarCliente(idCliente) {
    fetch(`/clientes/${idCliente}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data == null) {
            mostrarAlerta('Cliente no encontrado en el sistema', 'error');
            return;
        }
        
        abrirModalEditarCliente(data);
    })
    .catch((error) => {
        console.error('Error:', error);
        mostrarAlerta(error, 'error');
    });
}

function eliminarCliente(idCliente) {
    mostrarModalConfirmacion("¿Estás seguro de querer eliminar a este cliente?", () => {
        fetch(`/clientes/${idCliente}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            mostrarAlerta(data.message, 'exitoso');
            cargarDatos(configClientes);
        })
        .catch((error) => {
            console.error('Error:', error);
            mostrarAlerta(`Hubo un error al eliminar al cliente`, 'error');
        });
    });
}

function buscarCliente(){
    const buscarID = document.getElementById('buscarClienteID').checked;
    const inputBuscar = document.getElementById('floatingBuscar').value.trim();

    if (inputBuscar === "") {
        mostrarAlerta('Por favor, ingresa un valor para buscar.', 'error')
        return;
    }

    if(buscarID){
        fetch(`/clientes/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta(`¡El cliente con el [ID: ${inputBuscar}] no existe!`, 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                } else {
                    llenarTabla([data], configClientes.columnas, configClientes.acciones);
                }
            })
            .catch(error => console.error("Error al buscar por ID:", error));
    }else{
        fetch(`/clientes/nombre/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    llenarTabla(data, configClientes.columnas, configClientes.acciones);
                } else {
                    mostrarAlerta("No se encontraron clientes con ese nombre.", 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                }
            })
            .catch(error => console.error("Error al buscar por nombre:", error));
    }
}