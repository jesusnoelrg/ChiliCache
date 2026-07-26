const previewLogo = document.getElementById('previewLogo');

const companyLogo = document.getElementById('companyLogo');
const companyName = document.getElementById('companyName');
const companyRfc = document.getElementById('companyRfc');
const companyAddress = document.getElementById('companyAddress');
const companyEmail = document.getElementById('companyEmail');
const companyPhone = document.getElementById('companyPhone');

document.getElementById('formCompanySettings').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();

  const name = companyName.value;
  const rfc = companyRfc.value;
  const email = companyEmail.value;
  const address = companyAddress.value;
  let phone = companyPhone.value;
  const logo = companyLogo.value;

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

  if(companyLogo.files.length > 0) {
    formData.append('logo', companyLogo.files[0]);
  }

  formData.append('name', name);
  formData.append('tax_id', rfc);
  formData.append('email', email);
  formData.append('address', address);
  formData.append('phone', phone);

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
    }
  } catch (err) {
    console.error(err);
  }
});

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

const fillForm = (data) => {
  if(!data) return;

  previewLogo.src = cleanStaticUrl(data.logo);
  companyName.value = data.name;
  companyRfc.value = data.tax_id;
  companyAddress.value = data.address;
  companyEmail.value = data.email;
  companyPhone.value = data.phone;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAllData();
});