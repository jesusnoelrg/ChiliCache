const CLIENT_URL = 'http://localhost:3000/api/clients';

/*
  ----------------------------------------------------------------
  EDIT CLIENTS
*/

const modalCreateClient = new bootstrap.Modal(document.getElementById('modalCreateClient'));
const modalEditClient = new bootstrap.Modal(document.getElementById('modalEditClient'));
const formCreateClient = document.getElementById('formCreateClient');
const formEditClient = document.getElementById('formEditClient');

document.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-client-id]');
  if(!button) return;

  const clientId = button.getAttribute('data-client-id');
  e.preventDefault();

  if(clientId){
    if(button.classList.contains('btn-danger')){
      showConfirm(`¿Estás seguro de eliminar al cliente (ID: ${clientId})?`, deleteClientById(clientId, button));
    } else {
      setFormEdit(clientId);
      openEditModal();
    }
  }  
});

formCreateClient.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById('createClientName').value.trim(),
    rfc: document.getElementById('createClientRfc').value.trim(),
    address: document.getElementById('createClientAddress').value.trim(),
    email: document.getElementById('createClientEmail').value.trim() || undefined,
    phone: document.getElementById('createClientPhone').value.trim() || undefined,
  }

  try {
    const response = await fetch(`${CLIENT_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Error en el servidor (${response.status})`;

      try {
        const errorResult = await response.json();
        errorMsg = errorResult.message || errorMsg;
      } catch {

      }

      modalCreateClient.hide();
      showAlert(errorMsg, 'error');
      return;
    }

    const result = await response.json();

    fetchClients();
    modalCreateClient.hide();
    formCreateClient.reset();
    showAlert(result.message, 'success');
  } catch (err) {
    console.error(err);
  }
})

const setFormEdit = async (clientId) => {

  try {
    const response = await fetch(`${CLIENT_URL}/${clientId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if(!response.ok) {
      let errorMsg = `Error del servidor (${response.status})`;

      const errorResult = await response.json().catch({});
      errorMsg = errorResult.message || errorMsg;

      showAlert(errorMsg, 'error');
      return;
    }

    const client = await response.json();

    document.getElementById('titleEditClient').innerHTML = `EDITAR CLIENTE (ID: ${client.data.id})`
    document.getElementById('editClientName').value = client.data.name || '';
    document.getElementById('editClientRfc').value = client.data.rfc || '';
    document.getElementById('editClientAddress').value = client.data.address || ''; 
    document.getElementById('editClientPhone').value = client.data.phone || '';
    document.getElementById('editClientEmail').value = client.data.email || '';

  } catch (err) {
    console.error(err);
  }
}

const openEditModal = () => {
  modalEditClient.show();
};

document.getElementById('btnResetEdit').addEventListener('click', () => {
  setFormEdit();
})

formEditClient.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientId = formEditClient.getAttribute('data-client-id');

  const payload = {
    name: document.getElementById('editClientName').value.trim(),
    rfc: document.getElementById('editClientRfc').value.trim(),
    address: document.getElementById('editClientAddress').value.trim(),
    phone: document.getElementById('editClientPhone').value.trim() || undefined,
    email: document.getElementById('editClientEmail').value.trim() || undefined
  };

  try {
    const response = await fetch(`${CLIENT_URL}/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok){
      modalEditClient.hide();
      let errorMsg = `Error en el servidor (${response.code})`;

      try {
        const errorResult = await response.json();
        errorMsg = errorResult.message || errorMsg;
      } catch (err) {
        console.log(err);
      }

      showAlert(errorMsg, 'error');
      return;
    }

    const result = await response.json();
    showAlert(result.message, 'success');
    formEditClient.reset();
    modalEditClient.hide();
    await fetchClients();
  } catch (err) {
    console.error(err);
  }
})

/*
  ----------------------------------------------------------------
  DELETE CLIENT BY ID
*/

const deleteClientById = async (clientId, element) => {
  try {
    const response = await fetch(`${CLIENT_URL}/${clientId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok){
      let errorMsg = `Error en el servidor (${response.code})`;

      try {
        const errorResult = await response.json();
        errorMsg = errorResult.message || errorMsg;
      } catch (err) {
        console.log(err);
      }

      showAlert(errorMsg, 'error');
      return;
    }

    const row = element.closest('tr');
    
    if(row) {
      row.style.transition = 'opacity 0.5s';
      row.style.opacity = '0';
      setTimeout(() => {
        row.remove();
        fetchClients();
      }, 500)
    }

    const result = await response.json();
    showAlert(result.message, 'success');
  } catch (err) {
    console.error(err);
  }
}

/*
  ----------------------------------------------------------------
  SEARCH CLIENTS
*/

const filtersName = {
  'name': 'Nombre',
  'rfc': 'RFC',
  'address': 'Dirección',
  'phone': 'Teléfono',
  'email': 'E-Mail', 
}

const inputSearch = document.getElementById('inputSearch');
const lblSearch = document.getElementById('lblSearch');

const updateFilter = () => {
  const radioChecked = document.querySelector("input[name='clientFilters']:checked");

  if(radioChecked) {
    lblSearch.innerHTML = filtersName[radioChecked.value]
    return radioChecked.value;
  }
  
  lblSearch.innerHTML = 'Buscar';
  return 'name'
};

const radios = document.querySelectorAll("input[name='clientFilters']");
radios.forEach(radio => {
  radio.addEventListener('change', () => updateFilter());
});

document.getElementById('btnSearch').addEventListener('click', (e) => {
  e.preventDefault();
  fetchClients();
});

document.getElementById('inputLimit').addEventListener('change', () => fetchClients());
inputSearch.addEventListener('keypress', (e) => {
  if(e.key === 'Enter'){
    e.preventDefault();
    fetchClients();
  }
})
/*
  ----------------------------------------------------------------
  FETCH CLIENTS
*/

const fetchClients = async () => {
  const limitValue = document.getElementById('inputLimit').value || 10;

  const queryParams = new URLSearchParams({
    limit: limitValue
  });

  const currentFilter = updateFilter();

  if(inputSearch && inputSearch.value !== '') {
    queryParams.append(currentFilter, inputSearch.value)
  }

  try {
    const response = await fetch(`${CLIENT_URL}?${queryParams.toString()}`, {
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
  updateFilter();
})