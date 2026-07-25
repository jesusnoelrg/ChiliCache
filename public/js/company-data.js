const API_COMPANY = 'http://localhost:3000/api/company';

const fetchCompany = async () => {
  const elements = document.querySelectorAll('[data-company]');
  if(elements.length === 0) return;

  try {
    const res = await fetch(`${API_COMPANY}/public`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      let errorMsg = `Error en el servidor (${res.status})`;

      const errorRes = await res.json();
      errorMsg = errorRes.message || errorMsg;

      console.error(errorMsg);
      return;
    }

    const result = await res.json();

    elements.forEach(element => {
      const type = element.getAttribute('data-company');
      alert(result.name)
      if(type === 'name') element.textContent = result.name;
      if(type === 'logo') element.src = result.logo; 
    });
  } catch (err) {
    console.error(err);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  fetchCompany();
});