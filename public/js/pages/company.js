const API_COMPANY = '/api/company'

const previewLogo = document.getElementById('previewLogo');

const companyLogo = document.getElementById('companyLogo');
const companyName = document.getElementById('companyName');
const companyRfc = document.getElementById('companyRfc');
const companyAddress = document.getElementById('companyAddress');
const companyEmail = document.getElementById('companyEmail');
const companyPhone = document.getElementById('companyPhone');

const companyPrimaryColor = document.getElementById('primaryColor');
const primaryColorText = document.getElementById('primaryColorText');
const companySecondaryColor = document.getElementById('secondaryColor');
const secondaryColorText = document.getElementById('secondaryColorText');

const asideLogo = document.getElementById('asideLogo');
const asideTitle = document.getElementById('asideTitle');

/*
  ----------------------------------------------------------------
  EDIT COMPANY DATA
*/

companyLogo.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;

  if (!file.type.startsWith('image/')) {
    showAlert('Por favor, selecciona un archivo de imagen válido.', 'error');
    companyLogo.value = '';
    return;
  }

  const objectUrl = URL.createObjectURL(file);

  previewLogo.src = objectUrl;
  previewLogo.onload = () => {
    URL.revokeObjectURL(objectUrl);
  };
});

companyPrimaryColor.addEventListener('change', () => {
  primaryColorText.value = companyPrimaryColor.value;
});

companySecondaryColor.addEventListener('change', () => 
  secondaryColorText.value = companySecondaryColor.value
);

primaryColorText.addEventListener('change', () => {
  const color = primaryColorText.value;
  if(!color || !hexcolorFormat(color)) return;
  companyPrimaryColor.value = color;
});

secondaryColorText.addEventListener('change', () => {
  const color = secondaryColorText.value;
  if(!color || !hexcolorFormat(color)) return;
  companySecondaryColor.value = color;
});

document.getElementById('formCompanySettings').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();

  const name = companyName.value;
  const rfc = companyRfc.value;
  const email = companyEmail.value;
  const address = companyAddress.value;
  let phone = companyPhone.value;
  const logo = companyLogo.value;
  const primary_color = companyPrimaryColor.value;
  const secondary_color = companySecondaryColor.value;

  if(name !== '' && (name.length <= 3 || name.length >= 80)) {
    showAlert('El nombre de la empresa debe contener entre 3 y 80 caracteres.', 'info');
    return;
  }

  if(rfc !== '' && (rfc.length <= 3 || rfc.length >= 30)) {
    showAlert('El nombre de la empresa debe contener entre 3 y 30 caracteres.', 'info');
    return;
  }
  
  if(email !== '' && !emailFormat(email)) {
    showAlert('Formato de E-Mail inválido.','info');
    return;
  }

  if(address !== '' && (address.length <= 3 || address.length >= 250)) {
    showAlert('La dirección de la empresa debe contener entre 3 y 250 caracteres.','info');
    return;
  }

  if(phone !== ''){
    phone = phoneFormat(phone);

    if(phone === null) {
      showAlert('Formato del número de telefono incorrecto.','info');
      return;
    }
  }

  if(primary_color) {
    if(!hexcolorFormat(primary_color)) {
      showAlert('El color primario no sigue el formato HexColor para los colores (ej #bf2121)', 'info');
      return;
    }
  }

  if(secondary_color) {
    if(!hexcolorFormat(secondary_color)) {
      showAlert('El color secundario no sigue el formato HexColor para los colores (ej #bf2121)', 'info');
      return;
    }
  }

  if(companyLogo.files.length > 0) {
    formData.append('logo', companyLogo.files[0]);
  }

  formData.append('name', name);
  formData.append('tax_id', rfc);
  formData.append('email', email);
  formData.append('address', address);
  formData.append('phone', phone);
  formData.append('primary_color', primary_color);
  formData.append('secondary_color', secondary_color);

  try {
    const res = await fetch(`${API_COMPANY}/`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      if(result.message) {
        showAlert(result.message, 'error');
      }
      console.error(result.message || `Error en el servidor (${res.status})`);
      return;
    }

    if(result.success) {
      showAlert(result.message, 'success');
      fetchAllData();
    }
  } catch (err) {
    console.error(err);
  }
});

document.getElementById('btnResetForm').addEventListener('click', () => fetchAllData());

/*
  ----------------------------------------------------------------
  FETCH COMPANY DATA
*/

const fetchAllData = async () => {
  try {
    const res = await fetch(`${API_COMPANY}/`, {
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

    fillForm(result);
  } catch (err) {
    console.error(err);
  }
}

/*
  ----------------------------------------------------------------
  FILL FORM
*/

const fillForm = (data) => {
  if(!data) return;

  applyTheme(data.primary_color, data.secondary_color);
  updateFavicon(cleanStaticUrl(data.logo_path));
  asideLogo.src = cleanStaticUrl(data.logo_path);
  asideTitle.textContent = data.name;
  previewLogo.src = cleanStaticUrl(data.logo_path);
  companyPrimaryColor.value = data.primary_color;
  companySecondaryColor.value = data.secondary_color;
  primaryColorText.value = data.primary_color;
  secondaryColorText.value = data.secondary_color;
  companyName.value = data.name;
  companyRfc.value = data.tax_id ?? '';
  companyAddress.value = data.address ?? '';
  companyEmail.value = data.email ?? '';
  companyPhone.value = data.phone ?? '';
}

/*
  ----------------------------------------------------------------
  UPDATE FAVICON
*/

const updateFavicon = (logoPath) => {
  let favicon = document.querySelector("link[rel*='icon']");
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'shortcut icon';
    document.head.appendChild(favicon);
  }
  favicon.href = `${cleanStaticUrl(logoPath)}?t=${Date.now()}`;
};

/*
  ----------------------------------------------------------------
  APPLY THEME
*/

const applyTheme = (primaryColor, secondaryColor) => {
  const root = document.documentElement;
  if (primaryColor) root.style.setProperty('--color-primario', primaryColor);
  if (secondaryColor) root.style.setProperty('--color-secundario', secondaryColor);
};

/*
  ----------------------------------------------------------------
  CLEAN STATIC URL
*/

const cleanStaticUrl = (path) => {
  if (!path) return '/images/default-logo.svg';

  let clean = path.replace(/\\/g, '/');
  
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  
  return clean;
};

/*
  ----------------------------------------------------------------
  DOM CONTENT LOADED
*/

document.addEventListener('DOMContentLoaded', () => {
  fetchAllData();
});