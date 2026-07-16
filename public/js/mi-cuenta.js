const URL_API = 'http://localhost:3000/api/users/'

const inputUsername = document.getElementById('changeUsername');
const inputFullname = document.getElementById('changeFullname');
const inputCurentPassword = document.getElementById('changeCurrentPassword');
const inputNewPassword = document.getElementById('changeNewPassword');
const formEditMe = document.getElementById('formEditMe');

const renderMyAccount = () => {
  const cache = sessionStorage.getItem('user-profile');
  if(!cache) return;

  const user = JSON.parse(cache);

  document.querySelectorAll('.accountUsername').forEach(element => element.innerHTML = user.username)
  document.getElementById('accountFullname').innerHTML = user.full_name;

  const role = document.getElementById('accountRole');
  let roleText = '';

  if(user.role === 'admin'){
    roleText = 'Admin';
    role.classList.add('bg-danger');
    role.classList.remove('bg-success');
  } else {
    roleText = 'Vendedor';
    role.classList.add('bg-success');
    role.classList.remove('bg-danger');
  }

  role.innerHTML = roleText;

  inputUsername.value = user.username;
  inputFullname.value = user.full_name;
}

formEditMe.addEventListener('submit', async (e) => {
  e.preventDefault();

  const cache = sessionStorage.getItem('user-profile');


  if(!cache) {
    showAlert('No se ha podido obtener su ID.', 'error');
    return;
  };

  const user = JSON.parse(cache);

  const userData = {
    username: inputUsername.value.trim() || '',
    full_name: inputFullname.value.trim() || '',
    old_password: inputCurentPassword.value || '',
    password: inputNewPassword.value || ''
  }

  try {
    const response = await fetch(`${URL_API}${user.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      let errorMessage = `Error del servidor (${response.status})`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.message || errorMessage;
      } catch (err) {
        console.log(err);
      }

      showAlert(errorMessage, 'error');
      return;
    }


    const result = await response.json();

    if(!result.success) {
      showAlert(result.message, 'error');
      return;
    }

    showAlert(result.message, 'success');
    resetForm();
  } catch (err) {
    console.error(err);
    showAlert('Ocurrió un error inesperado al conectar con el servidor.', 'error');
  }
});

const resetForm = () => {
  renderMyAccount();
  inputCurentPassword.value = '';
  inputNewPassword.value = '';
}

document.getElementById('resetForm').addEventListener('click', () => {
  resetForm();
})


document.addEventListener('DOMContentLoaded', () => {
  renderMyAccount();
})