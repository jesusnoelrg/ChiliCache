const URL_API = 'http://localhost:3000';
const ROUTE = '/api/users';


const modalCreateUser = new bootstrap.Modal(document.getElementById('modalCreateUser'));
const modalEditUser = new bootstrap.Modal(document.getElementById('modalEditUser'));
const formCreateUser = document.getElementById('formCreateUser');
const formEditUser = document.querySelector('#formEditUser');

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

const openEditModal = async (userId) => {
  try{
    const response = await fetch(`${URL_API}${ROUTE}/${userId}`, {
      method: 'GET',
      credentials: 'include'
    });

    const result = await response.json();

    if(!result.success){
      showAlert(result.message, 'error');
      throw new Error(result.message);
      return;
    }

    document.getElementById('title-modal-user-edit').innerHTML = `EDITAR USUARIO (ID: ${userId})`;
    formEditUser.setAttribute('data-user-id', userId);
    document.getElementById('editUsername').value = result.data.username;
    document.getElementById('editFullname').value = result.data.full_name;
    document.getElementById('editRole').value = result.data.role;

    modalEditUser.show();
  } catch (err) {
    console.error(err);
  }
};

formEditUser.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    username: document.getElementById('editUsername').value.trim(),
    full_name: document.getElementById('editFullname').value.trim(),
    password: document.getElementById('editPassword').value,
    role: document.getElementById('editRole').value
  };

  const userId = formEditUser.getAttribute('data-user-id');

  try {
    const response = await fetch(`${URL_API}${ROUTE}/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if(!result.success){
      modalEditUser.hide();

      showAlert(result.message, 'error', () => {modalEditUser.show()})
      throw new Error(result.message);
      return;
    }

    showAlert(result.message, 'success');
    modalEditUser.hide();
    formEditUser.reset();
    await fetchUsers();
  } catch (err) {
    console.error(err);
  }
});

const btnCleanCreate = document.getElementById('btnCleanCreate');
btnCleanCreate.addEventListener('click', () => formCreateUser.reset());

document.getElementById('btnCleanEdit')
  .addEventListener('click', () => formEditUser.reset());

/*
 -------------------------------------------------------------------------
 */

const filters = {
  'username': 'Nombre de usuario',
  'full_name': 'Nombre completo',
  'role': 'Rol'
}

const getCurrentFilter = () => {
  const filter = document.querySelector('input[name=userFilters]:checked');

  if(!filter) console.error('No hay un filtro seleccionado.');

  document.getElementById('lblSearch').innerHTML = filters[filter.value];

  const blockSearch = document.getElementById('blockSearch');
  const selectRole = document.getElementById('selectRole');
  const lblRole = document.getElementById('lblRoles');

  if (filter.value === 'role') {
    blockSearch.classList.add('d-none'); 
    lblRole.classList.remove('d-none');
    selectRole.classList.remove('d-none');
  } else {
    blockSearch.classList.remove('d-none');
    selectRole.classList.add('d-none');
    lblRole.classList.add('d-none');
  }

  return filter.value;
}

const radios = document.querySelectorAll('input[name=userFilters]');

radios.forEach(radio => {
  radio.addEventListener('change', getCurrentFilter);
});

document.getElementById('btnSearch').addEventListener('click', (e) => {
  e.preventDefault();
  fetchUsers();
});

document.getElementById('inputSearch').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    fetchUsers();
  }
});

document.getElementById('inputLimit').addEventListener('change', () => {
  fetchUsers();
})

document.getElementById('selectRole').addEventListener('change', () => {
  fetchUsers();
})

/*
 -------------------------------------------------------------------------
 */


const fetchUsers = async () => {
  try {

    const currentFilter = getCurrentFilter();
    const limitValue = document.getElementById('inputLimit').value || 10;

    const queryParams = new URLSearchParams({
      limit: limitValue
    });

    let searchValue = '';

    if(currentFilter === 'role'){
      searchValue = document.getElementById('selectRole').value;

      if(searchValue === 'all') searchValue = '';
    } else {
      searchValue = document.getElementById('inputSearch').value.trim();
    }

    if (searchValue && searchValue !== ''){
      queryParams.append(currentFilter, searchValue);
    }

    const response = await fetch(`${URL_API}${ROUTE}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include'
    });

    if(!response.ok){
      throw new Error(`Error HTTP: ${response.status}`);
      return;
    }

    const result = await response.json();

    if(!result.success){
      showAlert(result.message, 'error');
      throw new Error('Error al obtener a los usuarios.');
      return;
    }

    renderUsersTable(result.data);
  } catch (err) {
    console.error(err);
  }
}

const renderUsersTable = (users) => {
  const tableBody = document.getElementById('usersTableBody');
  tableBody.innerHTML = '';

  if(!users || !Array.isArray(users) || users.length === 0){
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No se han encontrado usuarios.</td></tr>`;
    return;
  }

  let data = '';

  users.forEach(user => {
    data += `
      <tr>
        <th scope='row'>${user.id}</th>
        <td>${user.username}</td>
        <td>${user.full_name}</td>
        <td>${user.role === 'seller' ? 'Vendedor' : 'Admin'}</td>
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
      setTimeout(() => {
        row.remove()
        fetchUsers();
      }, 500);
    }

    showAlert(result.message, 'success');
    console.log('Usuario eliminado exitosamente.');
  } catch (err) {
    console.log(err.message);
  }
}

document.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-user-id]');
  if(!button) return;

  const userId = button.getAttribute('data-user-id');

  e.preventDefault();

  if(button.classList.contains('btn-danger')){
    showConfirm(`¿Estás seguro de eliminar al usuario (ID: ${userId})?`, () => deleteUserById(userId, button));
  } else if(button.classList.contains('btn-primary')){
    openEditModal(userId);
  }
})

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
})