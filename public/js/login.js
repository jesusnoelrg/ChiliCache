const form = document.getElementById('loginForm');
const button = document.getElementById('btnSubmit');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Cargando...';
  errorMsg.style.display = 'none';

  const username = document.getElementById('floatingUsername').value;
  const password = document.getElementById('floatingPassword').value;

  console.log('antes try')

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({username, password})
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error en el inicio de sesión.');
    }

    const data = await response.json();
    console.log('Login exitoso:', data);

    window.location.replace('/home');
    
    return data;
  } catch (error) {
    console.error('Falló el login:', error);

    errorMsg.textContent = error.message;
    errorMsg.style.display = 'block';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Iniciar sesión'
  }
})