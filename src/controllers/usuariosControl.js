const formUsuarios = {
    entidad: 'Usuario',
    url: '/usuarios',
    campos: [
        { id: 'floatingNombres', nombre: 'Nombres' },
        { id: 'floatingApellidos', nombre: 'Apellidos' },
        { id: 'floatingRFC', nombre: 'RFC' },
        { id: 'floatingTelefono', nombre: 'Telefono' },
        { id: 'floatingUsuario', nombre: 'NombreUsuario'},
        { id: 'floatingPassword', nombre: 'Password'},
        { id: 'floatingSelect', nombre: 'Rol'}
    ]
};

const configUsuarios = {
    url: '/usuarios',
    columnas: ['IDUsuario', 'Nombres', 'Rol', 'RFC', 'Telefono'],
    acciones: (usuario) => `
        <button type="button" class="btn btn-secondary mx-1" onclick="editarUsuario(${usuario.IDUsuario});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Editar usuario">
            <i class="bi bi-gear-fill"></i>
        </button>
        <button class="btn btn-danger mx-1" onclick="eliminarUsuario(${usuario.IDUsuario});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Eliminar usuario">
            <i class="bi bi-trash3-fill"></i>
        </button>
    `
};

function abrirModalNuevoUsuario() {
    abrirModal(formUsuarios, 'nuevo');
}

function abrirModalEditarUsuario(datos) {
    abrirModal(formUsuarios, 'editar', datos);
}


document.addEventListener('DOMContentLoaded', () => {
    cargarDatos(configUsuarios);
    enviarFormulario(formUsuarios);
});

function editarUsuario(idUsuario) {
    fetch(`/usuarios/${idUsuario}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data == null) {
            mostrarAlerta('Usuario no encontrado en el sistema', 'error');
            return;
        }
        
        abrirModalEditarUsuario(data);
    })
    .catch((error) => {
        console.error('Error:', error);
        mostrarAlerta(error, 'error');
    });
}

function eliminarUsuario(idUsuario) {
    mostrarModalConfirmacion("¿Estás seguro de querer eliminar a este usuario?", () => {
        fetch(`/usuarios/${idUsuario}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            mostrarAlerta(data.message, 'exitoso');
            cargarDatos(configUsuarios);
        })
        .catch((error) => {
            console.error('Error:', error);
            mostrarAlerta(`Hubo un error al eliminar al usuario`, 'error');
        });
    });
}

function buscarUsuario(){
    const buscarID = document.getElementById('buscarUsuarioID').checked;
    const inputBuscar = document.getElementById('floatingBuscar').value.trim();

    if (inputBuscar === "") {
        mostrarAlerta('Por favor, ingresa un valor para buscar.', 'error')
        return;
    }

    if(buscarID){
        fetch(`/usuarios/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta(`¡El usuario con el [ID: ${inputBuscar}] no existe!`, 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                } else {
                    llenarTabla([data], configUsuarios.columnas, configUsuarios.acciones);
                }
            })
            .catch(error => console.error("Error al buscar por ID:", error));
    }else{
        fetch(`/usuarios/nombre/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    llenarTabla(data, configUsuarios.columnas, configUsuarios.acciones);
                } else {
                    mostrarAlerta("No se encontraron usuarios con ese nombre.", 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                }
            })
            .catch(error => console.error("Error al buscar por nombre:", error));
    }
}