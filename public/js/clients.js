const URL_API = 'http://localhost:3000/api/clients';



const fetchClients = async () => {
  try {
    const response = await fetch(`${URL_API}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json'},
      credentials: 'include'
    });

    if(!response.ok){
      let errorMsg = `Error del servidor ${response.status}`;

      try {
        const errorResult = await response.json();
        errorMsg = errorResult.message || errorMsg;
      } catch (err) { 
        console.log(err);
      }

      showAlert(errorMsg, 'error');
    }

    const result = await response.json();

    if(!result.success){
      showAlert(result.message, 'error');
      return;
    }

    renderTableClients(result.data);
  } catch (err) {
    console.error(err);
  }
}

const renderTableClients = (clients) => {
  let table = document.getElementById('clientsTableBody');
  table.innerHTML = '';

  if(!clients || !Array.isArray(clients) || clients.length === 0){
    table.innerHTML = `<tr><td colspan="5" class="text-center">No se han encontrado clientes.</td></tr>`;
  }

  let data = '';

  clients.forEach(client => {
    data += `
      <tr>
        <th scope='row'>${client.id}</th>
        <td>${client.name || 'N/A'}</td>
        <td>${client.rfc || 'N/A'}</td>
        <td>${client.address || 'N/A'}</td>
        <td>${client.email || 'N/A'}</td>
        <td>${client.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-primary" data-client-id="${client.id}">
            <i class="bi bi-gear-fill"></i>
          </button>
          <button class="btn btn-danger" data-client-id="${client.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  table.innerHTML = data;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchClients();
})