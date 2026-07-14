const URL_API = 'http://localhost:3000';
const ROUTE = '/api/users';

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
          <button>X<i class="bi bi-gear-fill"></i></button>
          <button>Z</button>
        </td>
      </tr>
    `
  });

  tableBody.innerHTML = data;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
})