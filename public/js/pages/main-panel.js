const API = '/api'
const DASHBOARD_URL = `${API}/dashboard`
const MOVEMENTS_URL = `${API}/movements`

const countClients = document.getElementById('countClients');
const countProducts = document.getElementById('countProducts');
const countSales = document.getElementById('countSales');
const countUsers = document.getElementById('countUsers');

const fillCounts = async () => {
  try {
    const res = await fetch(`${DASHBOARD_URL}/stats`, {
      method: 'GET',
      credentials: 'include'
    });

    if(!res.ok) {
      throw new Error(`Error en el servidor (${res.status})`);
    }

    const result = await res.json();
    const stats = result.stats;

    if(!stats) return;

    countClients.textContent = stats.clients;
    countProducts.textContent = stats.products;
    countSales.textContent = stats.sales;
    countUsers.textContent = stats.users;
  } catch (err) {
    console.error(err);
  }
}

const getFiveMovements = async () => {

  const queryParams = new URLSearchParams({
    order: 'desc',
    limit: 5
  })

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

      throw new Error(errorMsg);
    }

    const result = await res.json();
    fillMovements(result.data);
  } catch (err) {
    console.error(err);
  }
}

const movTable = document.getElementById('movementsList');

const fillMovements = (movements) => {
  movTable.innerHTML = '';
   
  if(!movements || !Array.isArray(movements) || movements.length === 0){

    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 12;
    td.className = 'text-center';
    td.textContent = 'No se han hecho movimientos recientemente.';
    tr.appendChild(td);
    movTable.appendChild(tr);
    return;
  }

  let fragment = document.createDocumentFragment();

  movements.forEach(m => {
    const tr = document.createElement('tr');
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

/*
  ----------------------------------------------------------------
  STOCK MOVEMENT
*/

const stockMov = (old, rec) => {
  const b = document.createElement('b');
  const i = document.createElement('i');
  const comp = rec - old;

  if(old > rec) {
    b.className = 'text-danger';
    i.className = 'bi bi-arrow-down';
    b.textContent = `${rec} (${comp})`;
  } else {
    b.className = 'text-success';
    i.className = 'bi bi-arrow-up';
    b.textContent = `${rec} (+${comp})`;
  }

  b.appendChild(i);
  return b;
}

const typeMov = (type) => {
  const b = document.createElement('b');
  const i = document.createElement('i');

  switch(type){
    case 'cancel':
      b.className = 'text-danger';
      i.className = 'bi bi-x-circle-fill';
      b.textContent = 'Cancelado';
      break;
    case 'sale':
      b.className = 'text-warning';
      i.className = 'bi bi-bag-check-fill';
      b.textContent = 'Venta';
      break;
    case 'restock':
      b.className = 'text-info';
      i.className = 'bi bi-box-fill';
      b.textContent = 'Re-stock';
      break;
    case 'created':
      b.className = 'text-success';
      i.className = 'bi bi-file-plus-fill';
      b.textContent = 'Creación';
      break;
  }

  b.appendChild(i);
  return b;
}
document.addEventListener('DOMContentLoaded', () => {
  fillCounts();
  getFiveMovements();
})

