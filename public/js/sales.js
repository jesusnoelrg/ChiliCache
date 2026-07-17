const SALES_URL = 'http://localhost:3000/api/sales';

/*
  ----------------------------------------------------------------
  FETCH SALES
*/

const fetchSales = async () => {
  try {
    const res = await fetch(SALES_URL, {
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