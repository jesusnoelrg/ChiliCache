const AUTH_URL = 'http://localhost:3000/api/auth'

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const errorMsg = document.getElementById('errorMsg');


  if (!form || !btnSubmit) {
    return; 
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();


    if (errorMsg) {
        errorMsg.style.display = 'none';
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Cargando...';

    const username = document.getElementById('floatingUsername')?.value || '';
    const password = document.getElementById('floatingPassword')?.value || '';

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en el inicio de sesión.');
      }

      const result = await response.json();

      if(!result.success){
        showAlert(result.message, 'error');
        return;
      }

      sessionStorage.setItem('user-profile', JSON.stringify(result.user));
      window.location.replace('/home');
      
      return result;
    } catch (error) {
      console.error('Falló el login:', error);
      if (errorMsg) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
      }
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Iniciar sesión';
    }
  });
});

const logout = async () => {
  try{
    const response = await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include'
    });

    if (response.ok){
      window.location.replace('/login');
    } else {
      console.error('Error al cerrar sesión.');
    }
  }catch(err){
    console.error('Falló el login:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');

  if(btnLogout){
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
})