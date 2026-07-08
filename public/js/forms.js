function limpiarForm(config) {
    const form = document.getElementById(`formNuevo${config.entidad}`);
    form.reset();
    form.classList.remove('was-validated');
}

function abrirModal(config, modo = 'nuevo', datos = null) {
    const modal = document.querySelector(`#modalNuevo${config.entidad}`);
    modal.setAttribute('data-modo', modo);

    if (modo === 'nuevo') {
        document.querySelector('.modal-title').textContent = `NUEVO ${config.entidad.toUpperCase()}`;
        modal.removeAttribute('data-id');
        limpiarForm(config);
    } else if (modo === 'editar' && datos) {
        modal.setAttribute('data-id', datos[`ID${config.entidad}`]);
        document.querySelector('.modal-title').textContent = `EDITAR ${config.entidad.toUpperCase()} [ID: ${datos[`ID${config.entidad}`]}]`;

        config.campos.forEach(campo => {
            document.getElementById(campo.id).value = datos[campo.nombre];
        });
    }

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}


function enviarFormulario(form, config) {
    const formNuevo = document.getElementById(`formNuevo${form.entidad}`);
    formNuevo.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!formNuevo.checkValidity()) {
            event.stopPropagation();
            formNuevo.classList.add('was-validated');
            return;
        }

        const modal = document.querySelector(`#modalNuevo${form.entidad}`);
        const modo = modal.getAttribute('data-modo');
        const id = modal.getAttribute('data-id');

        const datos = {};
        form.campos.forEach(campo => {
            datos[campo.nombre] = document.getElementById(campo.id).value;
        });

        const url = (modo === 'editar') ? `${form.url}/${id}` : form.url;
        const metodo = (modo === 'editar') ? 'PUT' : 'POST';

        fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
        .then(response => response.json())
        .then(data => {
            mostrarAlerta(data.message, 'exitoso');
            cargarDatos(config);
            modal.removeAttribute('data-id');
            bootstrap.Modal.getInstance(modal).hide();
            limpiarForm(form);
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta(error, 'error');
        });
    });
}
