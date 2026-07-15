const URL_API = 'http://localhost:3000';
const ROUTE = '/api/users';


const modalCreateUser = new bootstrap.Modal(document.getElementById('modalCreateUser'));
const modalEditUser = new bootstrap.Modal(document.getElementById('modalEditUser'));
const formCreateUser = document.getElementById('formCreateUser');
const formEditUser = document.getElementById('formEditUser');

formCreateUser.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    username: document.getElementById('createUsername').value.trim(),
    password: document.getElementById('createPassword').value,
    full_name: document.getElementById('createFullname').value.trim(),
    role: document.getElementById('createRole').value,
  };

  try {
    const response = await fetch(`${URL_API}${ROUTE}/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if(!result.success) {
      modalCreateUser.hide();

      showAlert(result.message, "error", () => {modalCreateUser.show()});
      throw new Error(result.message);

      return;
    }

    showAlert(result.message, 'success');

    modalCreateUser.hide();
    formCreateUser.reset();

    await fetchUsers();
  } catch (err) {
    console.error(err);
  }
});



const btnCleanCreate = document.getElementById('btnCleanCreate');
btnCleanCreate.addEventListener('click', () => formCreateUser.reset());

document.getElementById('btnCleanCreate')
  .addEventListener('click', () => formEditUser.reset());

/*
 -------------------------------------------------------------------------
 */

const fetchUsers = async () => {
  try {
    const response = await fetch(`${URL_API}${ROUTE}/`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include'
    });

    if(!response.ok){
      if(response.status === 403){
        alert('No tienes permisos para ver esta sección.');
        window.location.replace('/inicio');
        return;
      }

      throw new Error('Error al obtener a los usuarios.')
    }

    const result = await response.json();

    renderUsersTable(result.data);
  } catch (err) {
    console.error(err.message);
  }
}

const renderUsersTable = (users) => {
  const tableBody = document.getElementById('usersTableBody');
  tableBody.innerHTML = '';

  if(users.length === 0){
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay usuarios registrados.</td></tr>`;
    return;
  }

  let data = '';

  users.forEach(user => {
    data += `
      <tr>
        <th scope='row'>${user.id}</th>
        <td>${user.username}</td>
        <td>${user.full_name}</td>
        <td>${user.role}</td>
        <td>
          <button class="btn btn-primary" data-user-id="${user.id}">
            <i class="bi bi-gear-fill"></i>
          </button>
          <button class="btn btn-danger" data-user-id="${user.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  tableBody.innerHTML = data;
}

const deleteUserById = async (id, element) => {
  try{
    const response = await fetch(`${URL_API}${ROUTE}/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    const result = await response.json();

    if(!result.success){
      showAlert(result.message, 'error');
      throw new Error('Hubo un error al eliminar al usuario');
    }


    const row = element.closest('tr');

    if(row){
      row.style.transition = 'opacity 0.5s';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 500);
    }

    

    showAlert(result.message, 'success');
    console.log('Usuario eliminado exitosamente.');
  } catch (err) {
    console.log(err.message);
  }
}

document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-user-id]');

  if(button && button.hasAttribute('data-user-id')){
    const userId = button.getAttribute('data-user-id');

    e.preventDefault();

    showConfirm(`¿Estás seguro de eliminar al usuario (ID: ${userId})?`, () => deleteUserById(userId, button));
  }
})

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
})