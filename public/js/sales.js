const API = 'http://localhost:3000/api'
const SALES_URL = `${API}/sales`;
const CLIENTS_URL = `${API}/clients`;
const PRODUCTS_URL = `${API}/products`;

/*
  ----------------------------------------------------------------
  CREATE SALES
*/

const btnCreateSale = document.getElementById('btnCreateSale');

const inputSearchClient = document.getElementById('inputSearchClient');
const clientValue = document.getElementById('clientValue');
const selectProducts = document.getElementById('selectProducts');

const listClients = document.getElementById('listClients');

const inputDate = document.getElementById('inputDate');

let debounceTime;

const searchClientsPredictive = (name) => {
  clearTimeout(debounceTime);

  debounceTime = setTimeout(async () => {
    const queryParams = new URLSearchParams({
      name: name,
    });

    try {
      const res = await fetch(`${CLIENTS_URL}/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'},
        credentials: 'include'
      });

      if(res.ok){
        const result = await res.json();
        renderListClients(result);
      }
    } catch (err) {
      console.error(err);
    }
  }, 500)
}

const showListClients = () => {
  listClients.classList.add('d-block');
  listClients.classList.remove('d-none');
}

const hideListClients = () => {
  listClients.classList.add('d-none');
  listClients.classList.remove('d-block');
}

const renderListClients = (data) => {
  if(!data || data.length === 0) {
    hideListClients();
    return;
  }

  listClients.innerHTML = '';

  let value = inputSearch.value.trim();

  const coincidences = data.filter(item => item.name.includes(value));

  if(coincidences.length > 0) {
    showListClients();
    coincidences.forEach(item => {
      const name = item.name
      const li = document.createElement('li');

      const regex = new RegExp(`(${value})`, 'gi');
      li.innerHTML = name.replace(regex, '<b>$1</b>');

      li.addEventListener('click', () => {
        inputSearchClient.value = name;
        hideListClients();
        listClients.innerHTML = '';
        clientValue.innerHTML = name;
      })

      listClients.appendChild(li);
    })
  }

}

const fillSelectProducts = (data) => {
  if(!data || data.length === 0) return;
  

  data.forEach(item => {
    const option = document.createElement('option');
    option.innerHTML = item.name;
    option.value = item.id;

    selectProducts.appendChild(option);
  })
}

let productList = [];
let productsAdded = [];

btnCreateSale.addEventListener('click', async () => {
  try {
    const res = await fetch(`${PRODUCTS_URL}/list/`, {
      method: 'GET',
      credentials: 'include'
    });

    if(res.ok) {
      const result = await res.json();
      productList = result.data;
      inputDate.value = formatDateYYYYMMDD();
      fillSelectProducts(productList);
      renderTableProduct();
    }

  } catch (err) { 
    console.error(err);
  }
})

inputSearchClient.addEventListener('input', (e) => {
  searchClientsPredictive(e.target.value);
})

document.getElementById('btnAddProduct').addEventListener('click', () => {
  const productId = selectProducts.value;
  const inputQuantity = document.getElementById('inputQuantity').value;

  if(productId === 'none'){
    showAlert('Selecciona un producto para añadirlo.', 'info');
    return;
  }


  const product = productList.find(x => x.id === Number(productId)) || null;

  if(product === null) {
    showAlert('Producto no encontrado.', 'error');
    return;
  }

  const quantity = Number(inputQuantity);

  if(isNaN(quantity)) {
    showAlert('Añade un número valido en el campo de cantidad.', 'info');
    return;
  }

  if(quantity <= 0) {
    showAlert('Solo puedes añadir valores mayores a <b>0</b>.', 'info');
    return;
  }

  if(quantity > product.stock) {
    showAlert('¡No puedes añadir más productos de los que hay en el stock!', 'info');
    return;
  }

  const isProductAdded = productsAdded.find(x => x.id === product.id);

  if(isProductAdded) {
    sumQuantityProduct(isProductAdded, quantity, product.stock);
  } else {
    const productToAdd = {
      ...product,
      quantity: quantity
    }

    productsAdded.push(productToAdd);
  }

  renderTableProduct();
})

const sumQuantityProduct = (product, quantity, stock) => {
  const newQuantity = quantity + product.quantity;

  if(newQuantity > stock) {
    showAlert('¡No puedes añadir más productos de los que hay en el stock!', 'info');
    return;
  }

  product.quantity = newQuantity;
}

document.addEventListener('click', (e) => {
  deleteRowProduct(e);
});

document.addEventListener('change', (e) => {
  const input = e.target.closest('td[quantity-product-edit]');
})

const deleteRowProduct = (e) => {
  const button = e.target.closest('button[data-product-id]');

  if(!button) return;

  const row = button.closest('tr');

  if(row) {
    const productId = button.getAttribute('data-product-id');

    row.style.transition = 'opacity 0.5s';
    row.style.opacity = '0';
    setTimeout(() => {
      row.remove();
      deleteProduct(productId)
    }, 500)
  }
}

const deleteProduct = (productId) => {
  productsAdded = productsAdded.filter(x => x.id === productId);
  renderTableProduct();
}

const renderTableProduct = () => {
  const table = document.getElementById('tableProduct');

  if(!productsAdded || productsAdded.length === 0) {
     table.innerHTML = `<tr><td colspan="12" class="text-center">No hay productos añadidos.</td></tr>`;
     return;
  }

  let data = '';

  productsAdded.forEach(p => {
    if(p.quantity <= 0) {
      showAlert('Cantidad no valida.', 'error');
      return;
    }

    data += `
      <tr>
        <th scope='row'>${p.name}</th>
        <td>${p.price || 'N/A'}</td>
        <td quantity-product-edit='true'><input type='number' class="form-control" value=${p.quantity}></td>
        <td>
          <button class="btn btn-danger" data-product-id="${p.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  table.innerHTML = data;
}

/*
  ----------------------------------------------------------------
  SEARCH SALES
*/

const filters = {
  'client_name': 'Nombre del cliente',
  'seller_name': 'Nombre del vendedor',
  'invoice': 'Factura',
  'total': 'Total',
  'timestamp': 'Fecha'
}

const filtersText = ['client_name', 'seller_name'];
const filtersRange = ['total', 'timestamp'];

const onTypeSearch = {
  normal: () => {
    rangeSearch.classList.add('d-none');
    rangeSearch.classList.remove('d-flex');

    normalSearch.classList.add('d-block');
    normalSearch.classList.remove('d-none');
  },

  range: () => {
    rangeSearch.classList.add('d-flex');
    rangeSearch.classList.remove('d-none');

    normalSearch.classList.add('d-none');
    normalSearch.classList.remove('d-block');
  },
}

const lblSearch = document.getElementById('lblSearch');
const inputSearch = document.getElementById('inputSearch');
const normalSearch = document.getElementById('normalSearch');

const rangeSearch = document.getElementById('rangeSearch');
const lblMin = document.getElementById('lblMin');
const lblMax = document.getElementById('lblMax');
const inputMin = document.getElementById('inputMin');
const inputMax = document.getElementById('inputMax');

const invoiceSearch = document.getElementById('invoiceSearch');
const checkInvoice = document.getElementById('checkInvoice');
const btnSearch = document.getElementById('btnSearch')

const updateFilter = () => {
  const checked = document.querySelector('input[name=saleFilters]:checked').value;

  if(!checked) return;

  const filterDisplay = filters[checked]

  if(filtersRange.includes(checked)) {
    let textMin = '';
    let textMax = '';

    if(checked === 'timestamp') {
      textMin = 'Fecha inicial';
      textMax = 'Fecha final';
      inputMin.type = 'date';
      inputMax.type = 'date';
    } else {
      textMin = `${filterDisplay} Min.`;
      textMax = `${filterDisplay} Max.`;
      inputMin.type = 'number';
      inputMax.type = 'number';
    }

    
    lblMin.innerHTML = textMin;
    lblMax.innerHTML = textMax;
    onTypeSearch.range();
  } else if (filtersText.includes(checked)) {
    lblSearch.innerHTML = filterDisplay;
    onTypeSearch.normal();
  }

  return checked;
}

document.getElementById('checkInvoice').addEventListener('change', () => {

  if(checkInvoice.checked) {
    invoiceSearch.classList.add('d-block');
    invoiceSearch.classList.remove('d-none');
  } else {
    invoiceSearch.classList.remove('d-block');
    invoiceSearch.classList.add('d-none');
  }

  fetchSales();
})

document.querySelectorAll('input[name=saleFilters]').forEach(radio => {
  radio.addEventListener('change', () => updateFilter())
})

document.querySelectorAll('input[name=radioInvoice]').forEach(radio => {
  radio.addEventListener('change', () => fetchSales())
})


btnSearch.addEventListener('click', (e) => {
  e.preventDefault();
  fetchSales();
})

inputSearch.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    fetchSales();
  }
});

inputMin.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    fetchSales();
  }
});

inputMax.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    fetchSales();
  }
});


const fetchSales = async () => {
  const limit = document.getElementById('inputLimit').value || 10;

  const queryParams = new URLSearchParams({
    limit: limit
  })

  const currentFilter = updateFilter();
  const displayFilter = filters[currentFilter];

  if(filtersRange.includes(currentFilter)) {
    if(currentFilter === 'timestamp'){
      let startDate = new Date(inputMin.value || '2000-01-01');
      let endDate = new Date(inputMax.value || '2100-01-01');

      if(isNaN(startDate.getTime()) || isNaN(endDate.getTime())){
        showAlert('Las dos fechas deben ser validas.', 'info');
        return;
      }

      if (startDate > endDate) {
        showAlert('La fecha inicial no puede superar a la fecha final', 'info');
        return;
      }

      queryParams.append(`start_timestamp`, inputMin.value);
      queryParams.append(`end_timestamp`, inputMax.value);
    } else {
      let min = Number(inputMin.value || 0);
      let max = Number(inputMax.value || 2147483646);

      if(min < 0) min = 0;
      if(max > 2147483647) {
        showAlert(`${displayFilter} máximo excede el límite permitido por el sistema.`, 'info');
        return;
      }
      if(min > max) {
        showAlert(`${displayFilter} minimo no puede superar al contenido máximo.`, 'info');
        return;
      }

      queryParams.append(`min_${currentFilter}`, min.toString());
      queryParams.append(`max_${currentFilter}`, max.toString());
    }
  } else {
    if(inputSearch || inputSearch !== '') {
      queryParams.append(`${currentFilter}`, inputSearch.value.trim());
    }
  }

  if(checkInvoice.checked) {
    
    const checkedInvoice = document.querySelector('input[name=radioInvoice]:checked');

    if(checkedInvoice.value === '0' || checkedInvoice.value === '1') {
      queryParams.append('invoice', checkedInvoice.value);
    }
  }

  try {
    const res = await fetch(`${SALES_URL}?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      let errorMsg = `Error en el servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch {

      }

      showAlert(errorMsg, 'error');
      return;
    }

    const result = await res.json();

    renderTableSales(result.data);
  } catch (err) {
    console.error(err);
  }
}

/*
  ----------------------------------------------------------------
  RENDER SALES
*/

const renderTableSales = (sales) => {
  const table = document.getElementById('saleList');

  if(!sales || !Array.isArray(sales) || sales.length === 0) {
    table.innerHTML = `<tr><td colspan="12" class="text-center">No se han encontrado ventas.</td></tr>`;
    return;
  }

  let data = '';

  sales.forEach(s => {
    data += `
      <tr>
        <th scope='row'>${s.id}</th>
        <td>${s.client_name || 'N/A'}</td>
        <td>${s.seller_name || 'N/A'}</td>
        <td>${s.date}</td>
        <td >
          ${s.invoice === 1 ? 'Sí' : 'No' || 'N/A'}
        </td>
        <td>$${s.total}</td>
        <td>
          <button class="btn btn-primary" data-sale-id="${s.id}">
            <i class="bi bi-gear-fill"></i>
          </button>
          <button class="btn btn-danger" data-sale-id="${s.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  table.innerHTML = data;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSales();
})

/*
  ----------------------------------------------------------------
  UTILS FUNCTIONS
*/

const formatDateYYYYMMDD = (d = new Date()) => {
  const date = new Date(d);
  console.log(date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}