const CLIENT_URL = 'http://localhost:3000/api/clients';

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