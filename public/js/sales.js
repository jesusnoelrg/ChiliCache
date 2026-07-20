const API = 'http://localhost:3000/api'
const SALES_URL = `${API}/sales`;
const CLIENTS_URL = `${API}/clients`;
const PRODUCTS_URL = `${API}/products`;

const modalCreateSale = new bootstrap.Modal(document.getElementById('formCreateSale'));
const modalSalesDetail = new bootstrap.Modal(document.getElementById('modalSalesDetail'));

/*
  ----------------------------------------------------------------
  SALES DETAIL
*/

const openSalesDetail = async (saleId) => {
  if(!saleId) return;
  document.getElementById('detailIdSale').innerHTML = saleId;

  try {
    const res = await fetch(`${SALES_URL}/${saleId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if(!res.ok) {
      let errorMsg = `Error del servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch (errorr){
        console.error(errorr);
      }

      showAlert(errorMsg, 'error');
      return;
    }

    const result = await res.json();

    if(!result.data) {
      showAlert('No hay datos por mostrar', 'info');
      return;
    }

    fillSaleDetail(result.data);
    modalSalesDetail.show();
  } catch (err) {
    console.error(err);
  }
}

const fillSaleDetail = (data) => {
  document.getElementById('btnCancelSale').setAttribute('cancel-sale-id', data.id_venta);
  document.getElementById('detailClientName').innerHTML = data.client_name;
  document.getElementById('detailOpName').innerHTML = data.op_name;
  document.getElementById('detailDate').innerHTML = data.date;
  document.getElementById('detailInvoice').innerHTML = (data.invoice === 1) ? 'Sí' : 'No';
  document.getElementById('detailStatus').innerHTML = `
    ${data.status === 'completed' ? 
      `
      <b class='text-success'>Completado</b>
      ` 
    : 
      `
      <b class='text-danger'>Cancelado</b>
      `
    }`
  document.getElementById('detailTotal').innerHTML = data.total;

  const table = document.getElementById('detailProductList');
  let fillTable = '';

  data.products.forEach(p => {
    const subtotal = Number(p.price) * Number(p.amount);

    fillTable += `
    <tr>
      <th class='scope'>${p.product_name}</th>
      <td>${p.price}</td>
      <td>${p.amount}</td>
      <td>$${subtotal}</td>
    </tr>
    `
  });

  table.innerHTML = fillTable;
}

/*
  ----------------------------------------------------------------
  SALES REPORT
*/

const reportStartDate = document.getElementById('startDate');
const reportEndDate = document.getElementById('endDate');
const reportSeller = document.getElementById('reportSeller');
const reportClient = document.getElementById('reportClient');
const reportInvoice = document.getElementById('reportInvoice');

document.getElementById('formReportSales').addEventListener('submit', async (e) => {
  e.preventDefault();

  const start_timestamp = reportStartDate.value;
  const end_timestamp = reportEndDate.value;

  if(!start_timestamp || !end_timestamp) {
    showAlert('Debe de ingresar una fecha de inicio y de fin.', 'info');
    return;
  }

  let queryParams = new URLSearchParams({
    start_timestamp: start_timestamp,
    end_timestamp: end_timestamp
  });

  const seller_name = reportSeller.value.trim();
  const client_name = reportClient.value.trim();

  if(seller_name && seller_name !== '') {
    queryParams.append('seller_name', seller_name);
  }

  if(client_name && client_name !== '') {
    queryParams.append('client_name', client_name);
  }

  const invoice = reportInvoice.value;

  if(invoice && (invoice === '0' || invoice === '1')) {
    queryParams.append('invoice', Number(invoice));
  }
  
  try {
    const res = await fetch(`${SALES_URL}/reports/pdf?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/pdf' },
      credentials: 'include'
    });

    if(!res.ok) {
      let errorMsg = `Error del servidor (${res.status})`;

      const errorRes = await res.json().catch(() => null);
      errorMsg = errorRes.message || errorMsg;

      showAlert(errorMsg, 'error');
      return;
    }

    const blob = await res.blob();
    const pdfUrl = URL.createObjectURL(blob);

    window.open(pdfUrl, '__blank');

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
  } catch (err) {
    console.error(err);
  }
});

const listReportClients = document.getElementById('listReportClients')

reportClient.addEventListener('input', (e) => {
  searchClientsPredictive(e.target.value, reportClient, listReportClients)
})

/*
  ----------------------------------------------------------------
  SALES CANCEL
*/

const cancelSale = async (saleId) => {
  if(!saleId) return;

  try {
    const res = await fetch(`${SALES_URL}/${saleId}/cancel`, {
      method: 'PATCH',
      credentials: 'include'
    });

    if(!res.ok) {
      let errorMsg = `Error del servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch {}

      showAlert(errorMsg, 'error');
      return;
    }

    const result = await res.json();
    modalSalesDetail.hide();
    showAlert(result.message, 'success');
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('btnCancelSale').addEventListener('click', () => {
  const id = document.getElementById('btnCancelSale').getAttribute('cancel-sale-id');
  if(!id || id === undefined) return;
  showConfirm(`¿Estás seguro de cancelar la venta (ID: ${id})`,
    () => cancelSale(Number(id))
  );
})

/*
  ----------------------------------------------------------------
  CREATE SALES
*/

const btnCreateSale = document.getElementById('btnCreateSale');

const inputSearchClient = document.getElementById('inputSearchClient');
const clientValue = document.getElementById('clientValue');
const selectProducts = document.getElementById('selectProducts');

const listClients = document.getElementById('listClients');

const inputPay = document.getElementById('inputPay');
const lblChange = document.getElementById('lblChange');

let debounceTime;

const searchClientsPredictive = (name, element, list) => {
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
        renderListClients(result, element, list);
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

const renderListClients = (data, element, list) => {
  if(!data || data.length === 0) {
    list.classList.add('d-none');
    list.classList.remove('d-block');
    return;
  }

  list.innerHTML = '';

  let value = element.value.trim();

  const coincidences = data.filter(item => item.name.includes(value));

  if(coincidences.length > 0) {
    list.classList.add('d-block');
    list.classList.remove('d-none');
    coincidences.forEach(item => {
      const name = item.name
      const li = document.createElement('li');

      const regex = new RegExp(`(${value})`, 'gi');
      li.innerHTML = name.replace(regex, '<b>$1</b>');

      li.addEventListener('click', () => {
        element.value = name;
        element.setAttribute('client-id', item.id);
        
        list.classList.add('d-none');
        list.classList.remove('d-block');

        list.innerHTML = '';
        clientValue.innerHTML = name;
      })

      list.appendChild(li);
    })
  }

}

const fillSelectProducts = (data) => {
  if(!data || data.length === 0) return;

  const optionsCount = document.querySelectorAll('#selectProducts option').length;

  if(optionsCount >= data.length) return;
  
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
      fillSelectProducts(productList);
      renderTableProduct();
    }

  } catch (err) { 
    console.error(err);
  }
})

inputSearchClient.addEventListener('input', (e) => {
  searchClientsPredictive(e.target.value, inputSearchClient, listClients);
})

document.getElementById('btnAddProduct').addEventListener('click', () => {
  const productId = selectProducts.value;
  const inputAmount = document.getElementById('inputAmount').value;

  if(productId === 'none'){
    showAlert('Selecciona un producto para añadirlo.', 'info');
    return;
  }


  const product = productList.find(x => x.id === Number(productId)) || null;

  if(product === null) {
    showAlert('Producto no encontrado.', 'error');
    return;
  }

  const amount = Number(inputAmount);

  if(isNaN(amount)) {
    showAlert('Añade un número valido en el campo de cantidad.', 'info');
    return;
  }

  if(amount <= 0) {
    showAlert('Solo puedes añadir valores mayores a <b>0</b>.', 'info');
    return;
  }

  if(amount > product.stock) {
    showAlert('¡No puedes añadir más productos de los que hay en el stock!', 'info');
    return;
  }

  const isProductAdded = productsAdded.find(x => x.id === product.id);

  if(isProductAdded) {
    sumAmountProduct(isProductAdded, amount, product.stock);
  } else {
    const productToAdd = {
      ...product,
      amount: amount
    }

    productsAdded.push(productToAdd);
  }

  updateTotalSale();
  renderTableProduct();
})

const sumAmountProduct = (product, amount, stock) => {
  const newAmount = amount + product.amount;

  if(newAmount > stock) {
    showAlert('¡No puedes añadir más productos de los que hay en el stock!', 'info');
    return;
  }

  product.amount = newAmount;
}

document.addEventListener('change', (e) => {
  const input = e.target.closest('td[amount-product-edit]');
})

document.addEventListener('click', (e) => {
  deleteRowProduct(e);
  buttonsSales(e);
});

const deleteRowProduct = (event) => {
  const button = event.target.closest('button[data-product-id]');

  if(!button) return;

  const productId = button.getAttribute('data-product-id');

  if(!productId || isNaN(Number(productId))) return;

  const row = button.closest('tr');

  if(row) {

    row.style.transition = 'opacity 0.5s';
    row.style.opacity = '0';
    setTimeout(() => {
      row.remove();
      deleteProduct(productId);
      updateTotalSale();
    }, 500)
  }
}

inputPay.addEventListener('input', () => {
  updateTotalSale();
})

const updateTotalSale = () => {
  const pay = Number(inputPay.value);

  const total_sale = productsAdded.reduce((acc, product) => {
    return acc + (product.amount * product.price)
  }, 0);

  if(pay && !isNaN(pay)) {
    lblChange.innerHTML = pay - total_sale;
  };

  lblTotal.innerHTML = total_sale;
}

const deleteProduct = (productId) => {
  productsAdded = productsAdded.filter(x => x.id !== Number(productId));
  renderTableProduct();
}

const tableProduct = document.getElementById('tableProduct');

const renderTableProduct = () => {
  if(!productsAdded || productsAdded.length === 0) {
     tableProduct.innerHTML = `<tr><td colspan="12" class="text-center">No hay productos añadidos.</td></tr>`;
     return;
  }

  let data = '';

  productsAdded.forEach(p => {
    if(p.amount <= 0) {
      showAlert('Cantidad no valida.', 'error');
      return;
    }

    data += `
      <tr>
        <th scope='row'>${p.name}</th>
        <td>${p.price || 'N/A'}</td>
        <td data-product-id="${p.id}">
          <input 
            type='number' 
            class="form-control input-amount"
            min=1
            max=${p.stock} 
            value=${p.amount}
          >
        </td>
        <td>
          <button class="btn btn-danger" data-product-id="${p.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
  });

  tableProduct.innerHTML = data;
}

tableProduct.addEventListener('input', (e) => {
  if(e.target.classList.contains('input-amount')){
    const target = e.target;
    const input = target.closest('td[data-product-id]');
    if(!input) return;

    const productId = Number(input.dataset.productId);
    const newAmount = Number(target.value);

    if(isNaN(newAmount)) return;

    const product = productsAdded.find(p => p.id === productId);

    if(product) {
      if(newAmount > product.stock) {
        modalCreateSale.hide();
        showAlert(`Stock máximo alcanzado (${product.stock}).`, 'error', () => modalCreateSale.show());
        target.value = product.stock; 
        product.amount = product.stock;
        updateTotalSale();
        return;
      }

      product.amount = newAmount;
      updateTotalSale();
    }
  }
})

const cleanCreateSale = () => {
  inputSearchClient.value = '';
  lblChange.innerHTML = 0.00;
  lblTotal.innerHTML = 0.00;
  tableProduct.innerHTML = `<tr><td colspan="12" class="text-center">No hay productos añadidos.</td></tr>`;
  productsAdded = [];
  clientValue.innerHTML = 'N/A';
  inputAmount.value = '';
  selectProducts.value = 'none';
  inputPay.value = '';
}

document.getElementById('btnRegisterSale')
  .addEventListener('click', async  () => {
    const clientId = inputSearchClient.getAttribute('client-id');
    
    if(!clientId || clientId === undefined) {
      showAlert('Ingresa un cliente en el buscador de clientes.', 'info');
      return;
    }

    let invoice = 0;

    if(document.getElementById('switchInvoice').checked) invoice = 1;

    productsAdded.forEach((product) => {
      console.log(product);
      if(product.amount <= 0) {
        showAlert(`Revisa la cantidad de '${product.name}' no puede ser menor o igual a 0`, 'info');
        return;
      }

      if(product.stock < product.amount) {
        showAlert(`'${product.name}' no tiene suficientes unidades en el stock (${product.stock})`, 'info');
        return;
      }
    });

    const payload = {
      id_client: clientId,
      invoice: invoice,
      products: productsAdded
    };

    try {
      const res = await fetch(`${SALES_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
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

        modalCreateSale.hide();
        showAlert(errorMsg, 'error', () => modalCreateSale.show());
        return;
      }

      const result = await res.json();
      modalCreateSale.hide();
      cleanCreateSale();
      showAlert(result.message, 'success');
      fetchSales();
    } catch (err) { 
      console.log(err);
    }
})

/*
  ----------------------------------------------------------------
  SEARCH SALES
*/

const filters = {
  'client_name': 'Nombre del cliente',
  'seller_name': 'Nombre del vendedor',
  'invoice': 'Factura',
  'status': 'Estado de venta',
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

const statusSearch = document.getElementById('statusSearch');
const selectStatus = document.getElementById('selectStatus');
const checkStatus = document.getElementById('checkStatus');

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
});

document.getElementById('checkStatus').addEventListener('change', () => {

  if(checkStatus.checked) {
    statusSearch.classList.add('d-block');
    statusSearch.classList.remove('d-none');
  } else {
    statusSearch.classList.remove('d-block');
    statusSearch.classList.add('d-none');
  }

  fetchSales();
})

selectStatus.addEventListener('input', () => {
  fetchSales();
})

document.querySelectorAll('input[name=saleFilters]').forEach(radio => {
  radio.addEventListener('change', () => updateFilter())
});

document.querySelectorAll('input[name=radioInvoice]').forEach(radio => {
  radio.addEventListener('change', () => fetchSales())
});


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

  if(checkStatus.checked) {
    const status = selectStatus.value;

    if(status === 'completed' || status === 'cancelled') {
      queryParams.append('status', status);
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
  BUTTONS VIEW AND CANCEL SALE
*/

const buttonsSales = (event) => {
  const button = event.target.closest('button[data-sale-id]');

  if(!button) return;

  const id = button.getAttribute('data-sale-id');
  const action = button.getAttribute('sale-action');

  if(button.classList.contains('btn-danger') || action === 'cancel') {
    showConfirm(`¿Estás seguro de cancelar la venta (ID: ${id})`,
      () => cancelSale(id)
    );
  } else {
    openSalesDetail(id);
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
        <td>
          ${s.status === 'completed' ? 
            `
              <span class='text-success'>Completado</span>
            ` 
          : 
            `
              <span class='text-danger'>Cancelado</span>
            `
          }
        </td>
        <td >
          ${s.invoice === 1 ? 'Sí' : 'No' || 'N/A'}
        </td>
        <td>$${s.customer_payment}</td>
        <td>$${s.total}</td>
        <td>
          <button class="btn btn-info" sale-action='view' data-sale-id="${s.id}">
            <i class="bi bi-eye-fill"></i>
          </button>
          <button class="btn btn-danger" sale-action='cancel'  data-sale-id="${s.id}">
            <i class="bi bi-x-circle-fill"></i>
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