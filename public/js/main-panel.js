const API = 'http://localhost:3000/api'

const countClients = document.getElementById('countClients');
const countProducts = document.getElementById('countProducts');
const countSales = document.getElementById('countSales');
const countUsers = document.getElementById('countUsers');

const fillCounts = async () => {
  try {
    const res = await fetch(`${API}/counts`, {
      method: 'GET',
      credentials: 'include'
    });

    if(!res.ok) {
      throw new Error(`Error en el servidor (${res.status})`);
      return;
    }

    const counts = await res.json();

    countClients.textContent = counts.clients;
    countProducts.textContent = counts.products;
    countSales.textContent = counts.sales;
    countUsers = count.users;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fillCounts();
})

