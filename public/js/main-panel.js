const API = 'http://localhost:3000/api'
const DASHBOARD_URL = `${API}/dashboard`

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

document.addEventListener('DOMContentLoaded', () => {
  fillCounts();
})

