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

    if(result.logo) updateFavicon(result.logo);

    applyTheme(result.primary_color, result.secondary_color);

    elements.forEach(element => {
      const type = element.getAttribute('data-company');
      if(type === 'name') element.textContent = result.name;
      if (type === 'logo') {
        element.src = cleanStaticUrl(result.logo);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

const updateFavicon = (logo) => {
  if(!logo) return;

  const favicon = document.querySelector('link[rel*=icon]');

  if(!favicon) return;

  favicon.href =  cleanStaticUrl(logo);
}

const cleanStaticUrl = (path) => {
  if (!path) return '/img/logo.png';

  let clean = path.replace(/\\/g, '/');
  
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  
  return clean;
};

const applyTheme = (primaryColor, secondaryColor) => {
  const root = document.documentElement;

  if (primaryColor) {
    root.style.setProperty('--color-primario', primaryColor);
  }

  if (secondaryColor) {
    root.style.setProperty('--color-secundario', secondaryColor);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchCompany();
});