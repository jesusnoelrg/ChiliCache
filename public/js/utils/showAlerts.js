function showAlert (message, type, action) {
  const icon = document.getElementById('iconoAlerta');
  const boxIcon = document.getElementById('cajaIconoAlerta');
  const title = document.getElementById('tituloAlerta');
  const btn = document.getElementById('btnAlerta');

  icon.classList.remove('bi-check', 'bi-x', 'bi-info');

  if (type == 'success') {
    icon.classList.add('bi-check');
    boxIcon.style = 'background-color: var(--success);'
    btn.style = 'background-color: var(--success);'
    title.textContent = '¡Exitoso!'
  } else if (type == 'info') {
    icon.classList.add('bi-info');
    boxIcon.style = 'background-color: var(--info);'
    btn.style = 'background-color: var(--info);'
    title.textContent = 'Información'

  } else {
    icon.classList.add('bi-x');
    boxIcon.style = 'background-color: var(--error);'
    btn.style = 'background-color: var(--error);'
    title.textContent = 'Error'
  }

  btn.onclick = () => {
    if(action !== undefined) action();
    modal.hide();
  }

  const modal = new bootstrap.Modal(document.getElementById('modalAlerta'));
  document.getElementById('mensajeAlerta').textContent = message;
  modal.show();
}

function showConfirm (message, action){
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
    const btnConfirmacion = document.getElementById('btnConfirmacion');

    document.getElementById('mensajeConfirmacion').textContent = message;

    btnConfirmacion.onclick = () => {
        action();
        modal.hide();
    }

    modal.show();
}