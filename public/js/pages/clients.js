const CLIENT_URL = '/api/clients';

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
      showConfirm(`¿Estás seguro de eliminar al cliente (ID: ${clientId})?`, () => deleteClientById(clientId, button));
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
      showAlert(errorMsg, 'error', () => modalCreateClient.show());
      return;
    }

    const result = await response.json();

    fetchClients();
    modalCreateClient.hide();
    formCreateClient.reset();
    formCreateClient.classList.remove('was-validated');
    showAlert(result.message, 'success');
  } catch (err) {
    console.error(err);
  }
})

const setFormEdit = async (clientId) => {

  try {
    const response = await fetch(`${CLIENT_URL}/id/${clientId}`, {
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

    formEditClient.setAttribute('data-client-id', clientId)
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
  const clientId = formEditClient.getAttribute('data-client-id');
  if (clientId) setFormEdit(clientId);
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
      let errorMsg = `Error en el servidor (${response.status})`;

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
      let errorMsg = `Error en el servidor (${response.status})`;

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
    lblSearch.textContent = filtersName[radioChecked.value]
    return radioChecked.value;
  }
  
  lblSearch.textContent = 'Buscar';
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
});

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
      return;
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
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 12;
    td.className = 'text-center';
    td.textContent = 'No se han encontrado clientes.';
    tr.appendChild(td);
    table.appendChild(tr);
    return;
  }

  let fragment = document.createDocumentFragment();

  clients.forEach(client => {
    const tr = document.createElement('tr');
    const thId = document.createElement('th');

    thId.textContent = client.id;
    tr.appendChild(thId);
    const tdName = document.createElement('td');
    tdName.textContent = client.name || 'N/A';
    tr.appendChild(tdName);
    const tdRfc = document.createElement('td');
    tdRfc.textContent = client.rfc || 'N/A';
    tr.appendChild(tdRfc);
    const tdAddress = document.createElement('td');
    tdAddress.textContent = client.address || 'N/A';
    tr.appendChild(tdAddress);
    const tdEmail = document.createElement('td');
    tdEmail.textContent = client.email || 'N/A';
    tr.appendChild(tdEmail);
    const tdPhone = document.createElement('td');
    tdPhone.textContent = client.phone || 'N/A';
    tr.appendChild(tdPhone);
    const tdActions = document.createElement('td');
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn btn-primary me-2';
    btnEdit.dataset.clientId = client.id;
    btnEdit.innerHTML = '<i class="bi bi-gear-fill"></i>';
    tdActions.appendChild(btnEdit);
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-danger';
    btnDelete.dataset.clientId = client.id;
    btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
    tdActions.appendChild(btnDelete);
    tr.appendChild(tdActions);
    fragment.appendChild(tr);
  });

  table.appendChild(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchClients();
  updateFilter();
})