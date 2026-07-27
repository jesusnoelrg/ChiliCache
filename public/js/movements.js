const API = 'http://localhost:3000/api'
const MOVEMENTS_URL = `${API}/movements`;

const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

const filterType = document.getElementById('filterType');
const filterOrder = document.getElementById('filterOrder');

const filterStartTimestamp = document.getElementById('filterStartTimestamp');
const filterEndTimestamp = document.getElementById('filterEndTimestamp');

const filterProductName = document.getElementById('filterProductName');
const filterSellerName = document.getElementById('filterSellerName');

const inputLimit = document.getElementById('inputLimit');

filterType.addEventListener('input', () => fetchMovements());

filterProductName.addEventListener('input', debounce(() => fetchMovements(), 600));
filterSellerName.addEventListener('input', debounce(() => fetchMovements(), 600));

filterOrder.addEventListener('input', () => fetchMovements());
inputLimit.addEventListener('input', () => fetchMovements());

filterStartTimestamp.addEventListener('input', (e) => {
  e.preventDefault();

  fetchMovements();
})

filterEndTimestamp.addEventListener('input', (e) => {
  e.preventDefault();
  fetchMovements();
})

const fetchMovements = async () => {

  const type = filterType.value || '';
  let start_timestamp = filterStartTimestamp.value;
  let end_timestamp = filterEndTimestamp.value;
  const sellerName = filterSellerName.value.trim();
  const productName = filterProductName.value.trim();
  const order = filterOrder.value || 'asc';
  const limit = inputLimit.value || 10;

  const queryParams = new URLSearchParams({
    order: order,
    limit: limit
  });

  if(type !== '') {
    queryParams.append('type', type);
  }

  let startDate = start_timestamp ? new Date(start_timestamp) : null;
  let endDate = end_timestamp ? new Date(end_timestamp) : null;

  if(startDate && isNaN(startDate.getTime())){
    showAlert('La fecha inicial no es válida.', 'info');
    return;
  }

  if(endDate && isNaN(endDate.getTime())) {
    showAlert('La fecha final no es válida.', 'info');
    return;
  }

  if(startDate && endDate && startDate > endDate) {
    showAlert('La fecha inicial no puede superar a la fecha final', 'info');
    return;
  }

  if (start_timestamp) queryParams.append('start_timestamp', start_timestamp);
  if (end_timestamp) queryParams.append('end_timestamp', end_timestamp);
  if (sellerName) queryParams.append('seller_name', sellerName);
  if (productName) queryParams.append('product_name', productName);

  try {
    const res = await fetch(`${MOVEMENTS_URL}?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      let errorMsg = `Error del servidor (${res.status})`;

      try {
        const errorRes = await res.json();
        errorMsg = errorRes.message || errorMsg;
      } catch { }

      console.error(errorMsg);
      return;
    }

    const result = await res.json();
    fillMovements(result.data);
  } catch (err) {
    console.error(err);
  }
}

const movTable = document.getElementById('movementsList');

const fillMovements = (movements) => {
  movTable.replaceChildren();

  if(!movements || !Array.isArray(movements) || movements.length === 0){
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.classList.add('text-center');
    td.setAttribute('colspan', 12);
    td.textContent = 'No se han hecho movimientos recientemente.';
   
    tr.appendChild(td);
    movTable.appendChild(tr);
    return;
  }

  let data = '';
  const fragment = document.createDocumentFragment();

  movements.forEach(m => {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = m.id;
    tr.appendChild(tdId);

    const tdSeller = document.createElement('td');
    tdSeller.textContent = m.seller_name || 'N/A';
    tr.appendChild(tdSeller);

    const tdType = document.createElement('td');
    tdType.appendChild(typeMov(m.type));
    tr.appendChild(tdType);

    const tdProduct = document.createElement('td');
    tdProduct.textContent = m.product_name || 'N/A';
    tr.appendChild(tdProduct);

    const tdOld = document.createElement('td');
    tdOld.textContent = m.old_stock || '0';
    tr.appendChild(tdOld);

    const tdNew = document.createElement('td');
    tdNew.appendChild(stockMov(m.old_stock, m.new_stock));
    tr.appendChild(tdNew);

    const tdDate = document.createElement('td');
    tdDate.textContent = m.created_at || 'N/A';
    tr.appendChild(tdDate);
    
    fragment.appendChild(tr);
  })

  movTable.appendChild(fragment);
}

const stockMov = (old, rec) => {
  let comp = rec - old;
  const b = document.createElement('b');
  const i = document.createElement('i');

  if(old > rec) {
    b.classList.add('text-danger');
    i.classList.add('bi', 'bi-arrow-down');
  } else {
    b.classList.add('text-success');
    i.classList.add('bi', 'bi-arrow-up');
  }

  b.appendChild(i);
  b.append(` ${rec} (${comp > 0 ? '+' : ''}${comp})`);

  return b;
}

const typeMov = (type) => {
  const b = document.createElement('b');
  const i = document.createElement('i');

  switch(type){
    case 'cancel':
      b.className = 'text-danger';
      b.textContent = 'Cancelado ';
      i.classList.add('bi', 'bi-x-circle-fill');
      break;
    case 'sale':
      b.className = 'text-warning';
      b.textContent = 'Venta ';
      i.classList.add('bi', 'bi-bag-check-fill');
      break;
    case 'restock':
      b.className = 'text-info';
      b.textContent = 'Re-stock ';
      i.classList.add('bi', 'bi-box-fill');
      break;
    case 'created':
      b.className = 'text-success';
      b.textContent = 'Creación ';
      i.classList.add('bi', 'bi-file-plus-fill');
      break;
  }

  b.appendChild(i);

  return b;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMovements();
})