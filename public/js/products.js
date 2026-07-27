const PRODUCT_URL = 'http://localhost:3000/api/products';

/*
  ----------------------------------------------------------------
  BUTTON ACTIONS (DELETE AND UPDATE)
*/
document.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-product-id]');
  if(!button) return;

  const productId = button.getAttribute('data-product-id');

  if(productId) {
    if(button.classList.contains('btn-danger')) {
      showConfirm(`¿Estás seguro de eliminar el producto (ID: ${productId})`, () => deleteProductById(productId, button));
    } else {
      setFormEdit(productId);
      openEditModal();
    }
  }
});

/*
  ----------------------------------------------------------------
  CREATE PRODUCTS
*/
const modalCreateProduct = new bootstrap.Modal(document.getElementById('modalCreateProduct'));
const formCreateProduct = document.getElementById('formCreateProduct');

formCreateProduct.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById('createName').value.trim(),
    unit: document.getElementById('createUnit').value.trim(),
    net_content: document.getElementById('createNetContent').value,
    price: document.getElementById('createPrice').value,
    stock: document.getElementById('createStock').value
  }

  try {
    const res = await fetch(`${PRODUCT_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMsg = `Error en el servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch {

      }

      modalCreateProduct.hide();
      showAlert(errorMsg, 'error', () => modalCreateProduct.show());
      return;
    }

    const result = await res.json();

    modalCreateProduct.hide();
    formCreateProduct.reset();
    showAlert(result.message, 'success');
    fetchProducts();
  } catch (err) {
    console.error(err);
  }
})

/*
  ----------------------------------------------------------------
  EDIT PRODUCTS
*/

const modalEditProduct = new bootstrap.Modal(document.getElementById('modalEditProduct'));
const formEditProduct = document.getElementById('formEditProduct');

const setFormEdit = async (productId) => {
  try {
    const res = await fetch(`${PRODUCT_URL}/${productId}`, {
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

      modalEditProduct.hide();
      showAlert(errorMsg, 'error');
      return;
    }

    const result = await res.json();
    const data = result.data;

    formEditProduct.setAttribute('data-product-id', productId);
    document.getElementById('titleModalEdit').innerHTML = `EDITAR PRODUCTO (ID: ${productId})`;
    document.getElementById('editName').value = data.name || '';
    document.getElementById('editPrice').value = data.price || 0;
    document.getElementById('editNetContent').value = data.net_content || 0;
    document.getElementById('editUnit').value = data.unit || 'ml';

    modalEditProduct.show();
  } catch (err) {
    console.error(err);
  }
}

const openEditModal = () => modalEditProduct.show();

formEditProduct.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = formEditProduct.getAttribute('data-product-id');

  if(!productId) {
    showAlert('No se ha identificado un ID de producto.', 'error');
    return;
  }

  const payload = {
    name: document.getElementById('editName').value.trim(),
    unit: document.getElementById('editUnit').value.trim(),
    net_content: document.getElementById('editNetContent').value,
    price: document.getElementById('editPrice').value,
  }

  try {
    const res = await fetch(`${PRODUCT_URL}/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMsg = `Error en el servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch {

      }

      modalEditProduct.hide();
      showAlert(errorMsg, 'error');
      return;
    }

    const result = await res.json();

    modalEditProduct.hide();
    formEditProduct.reset();
    showAlert(result.message, 'success');
    await fetchProducts();
  } catch (err) {
    console.error(err);
  }
});

document.getElementById('btnResetEdit').addEventListener('click', () => {
  const productId = formEditProduct.getAttribute('data-product-id');
  if(productId) setFormEdit(productId);
});

/*
  ----------------------------------------------------------------
  DELETE PRODUCTS
*/
const deleteProductById = async (productId, element) => {
  try {
    const response = await fetch(`${PRODUCT_URL}/${productId}`, {
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
        fetchProducts();
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
  SEARCH PRODUCTS
*/
const filters = {
  'name': 'Nombre',
  'unit': 'Unidad de medida',
  'price': 'Precio',
  'net_content': 'Cont. Neto',
  'stock': 'Stock'
};

const filtersRange = ['price', 'net_content', 'stock'];

const lblSearch = document.getElementById('lblSearch');
const inputSearch = document.getElementById('inputSearch');
const normalSearch = document.getElementById('normalSearch');

const rangeSearch = document.getElementById('rangeSearch');
const lblMin = document.getElementById('lblMin');
const lblMax = document.getElementById('lblMax');
const inputMin = document.getElementById('inputMin');
const inputMax = document.getElementById('inputMax');

const unitSearch = document.getElementById('unitSearch');
const unitSelect = document.getElementById('unitSelect');

const btnSearch = document.getElementById('btnSearch');

const onTypeSearch = {
  normal: () => {
    rangeSearch.classList.add('d-none');
    rangeSearch.classList.remove('d-flex');

    unitSearch.classList.add('d-none');
    unitSearch.classList.remove('d-block');

    normalSearch.classList.add('d-block');
    normalSearch.classList.remove('d-none');
  },

  range: () => {
    rangeSearch.classList.add('d-flex');
    rangeSearch.classList.remove('d-none');

    unitSearch.classList.add('d-none');
    unitSearch.classList.remove('d-block');

    normalSearch.classList.add('d-none');
    normalSearch.classList.remove('d-block');
  },

  net_content: () => {
    rangeSearch.classList.add('d-flex');
    rangeSearch.classList.remove('d-none');

    unitSearch.classList.add('d-block');
    unitSearch.classList.remove('d-none');

    normalSearch.classList.add('d-none');
    normalSearch.classList.remove('d-block');
  },

  unit: () => {
    rangeSearch.classList.add('d-none');
    rangeSearch.classList.remove('d-flex');

    unitSearch.classList.add('d-block');
    unitSearch.classList.remove('d-none');

    normalSearch.classList.add('d-none');
    normalSearch.classList.remove('d-block');
  }
}

const updateFilter = () => {
  const checked = document.querySelector('input[name=productFilters]:checked');
  const filterValue = filters[checked.value]

  if(filtersRange.includes(checked.value)){
    lblMin.innerHTML = `${filterValue} min.`
    lblMax.innerHTML = `${filterValue} max.`

    if (checked.value === 'net_content') onTypeSearch.net_content() 
    else onTypeSearch.range()
  } else if (checked.value === 'unit') onTypeSearch.unit();
  else {
    lblSearch.innerHTML = filterValue;
    onTypeSearch.normal();
  }

  return checked.value;
}

document.querySelectorAll('input[name=productFilters]').forEach(element => {
  element.addEventListener('change', () => updateFilter())
});

document.getElementById('inputLimit').addEventListener('change', (e) => {
  e.preventDefault();
  fetchProducts();
})

btnSearch.addEventListener('click', (e) => {
  e.preventDefault();
  fetchProducts();
});

inputSearch.addEventListener('keypress', (e) => {
  if(e.key === 'Enter'){
    e.preventDefault();
    fetchProducts();
  }
});

unitSelect.addEventListener('change', (e) => {
  e.preventDefault();
  fetchProducts();
})

const fetchProducts = async () => {
  const limit = document.getElementById('inputLimit');

  const queryParams = new URLSearchParams({
    limit: limit.value || 10
  });

  const currentFilter = updateFilter();

  if(filtersRange.includes(currentFilter)) {
    let min = Number(inputMin.value);
    let max = Number(inputMax.value);
    const displayFilter = filters[currentFilter];

    if(isNaN(min) || isNaN(max)) {
      showAlert(`Los rangos de ${displayFilter} deben ser un número.`, 'info');
      return;
    }

    if(min < 0) min = 0;
    if(min > max) {
      showAlert(`${displayFilter} minimo no puede superar al ${displayFilter} máximo.`, 'info');
      return;
    }

    if(max > 2147483647) {
      showAlert(`${displayFilter} máximo excede el límite permitido por el sistema.`, 'info');
      return;
    }

    const isContent = currentFilter === 'net_content';
    const capitalizeFilter = capitalize(isContent ? 'content' : currentFilter);

    if(currentFilter === 'net_content') queryParams.append('unit', unitSelect.value);
    queryParams.append(`min${capitalizeFilter}`, min.toString());
    queryParams.append(`max${capitalizeFilter}`, max.toString());
  } else if (inputSearch && inputSearch.value !== '') {
    queryParams.append(currentFilter, inputSearch.value.trim());
  } else if (currentFilter === 'unit') {
    queryParams.append('unit', unitSelect.value);
  }

  try {
    const res = await fetch(`${PRODUCT_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json'},
      credentials: 'include'
    });

    
    if (!res.ok) {
      let msgError = `Error en el servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        msgError = errorRes.message || msgError;
      } catch {}

      showAlert(msgError, 'error');
      return;
    }

    const result = await res.json();

    renderTableProducts(result.data);
  } catch (err) {
    console.error(err);
  }
}

/*
  ----------------------------------------------------------------
  RENDER PRODUCTS
*/

const renderTableProducts = (products) => {
  const table= document.getElementById('productList');

  if(!products || !Array.isArray(products) || products.length === 0) {
    table.innerHTML = `<tr><td colspan="12" class="text-center">No se han encontrado productos.</td></tr>`;
    return;
  }

  let data = '';

  products.forEach(p => {
    data += `
      <tr>
        <th scope='row'>${p.id}</th>
        <td>${p.name || 'N/A'}</td>
        <td>$${p.price || 'N/A'}</td>
        <td>${p.net_content}${p.unit}</td>
        <td 
          style='${stockColor(p.stock)}'
          class='fw-bold'
        >
          ${p.stock || 'N/A'}
        </td>
        <td>
          <button class="btn btn-primary" data-product-id="${p.id}">
            <i class="bi bi-gear-fill"></i>
          </button>
          <button class="btn btn-danger" data-product-id="${p.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  table.innerHTML = data;
}

const stockColor = (stock) => `color: var(--${stock < 10 ? 'stock-red' : stock < 50 ? 'stock-yellow': 'stock-green'})`;
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
})