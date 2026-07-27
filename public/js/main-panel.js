const API = 'http://localhost:3000/api'
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
      return;
    }

    const result = await res.json();
    const stats = result.stats;
    
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
  if(!movements || !Array.isArray(movements) || movements.length === 0){
    table.innerHTML = `<tr><td colspan="12" class="text-center">No se han hecho movimientos recientemente.</td></tr>`;
    return;
  }

  let data = '';

  movements.forEach(m => {
    data += `

      <tr>
        <td>${m.seller_name || 'N/A'}</td>
        <td>${typeMov(m.type)}</td>
        <td>${m.product_name}</td>
        <td>${m.old_stock}</td>
        <td>${stockMov(m.old_stock, m.new_stock)}</td>
        <td>${m.created_at || 'N/A'}</td>
      </tr>
    `
  })

  movTable.innerHTML = data;
}

const stockMov = (old, rec) => {
  let comp = rec - old;
  let res = `<b class='text-success'><i class="bi bi-arrow-up"></i> ${rec} (+${comp})</b>`;

  if(old > rec) {
    res = `<b class='text-danger'><i class="bi bi-arrow-down"></i> ${rec} (${comp})</b>`
  }

  return res;
}

const typeMov = (type) => {
  let res = 'N/A';

  switch(type){
    case 'cancel':
      res = `<b class='text-danger'><i class="bi bi-x-circle-fill"></i> Cancelado</b>`
      break;
    case 'sale':
      res= `<b class='text-warning'><i class="bi bi-bag-check-fill"></i> Venta</b>`
      break;
    case 'restock':
      res= `<b class='text-info'><i class="bi bi-box-fill"></i> Re-stock</b>`
      break;
    case 'created':
      res= `<b class='text-success'><i class="bi bi-file-plus-fill"></i> Creación</b>`
      break;
  }

  return res;
}
document.addEventListener('DOMContentLoaded', () => {
  fillCounts();
  getFiveMovements();
})

