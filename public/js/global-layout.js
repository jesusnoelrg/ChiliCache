const d = document;

const renderHeader = () => {
  const cachedUser = sessionStorage.getItem('user-profile');

  if(!cachedUser) return;

  const user = JSON.parse(cachedUser);

  d.getElementById('headerUsername').innerHTML = user.username;
  d.getElementById('headerFullname').innerHTML = user.full_name;

  const headerRol = d.getElementById('headerRol')
  let role = '';

  if(user.role === 'admin'){
    role = 'Admin';
    headerRol.classList.add('bg-danger');
    headerRol.classList.remove('bg-success');
  } else {
    role = 'Vendedor';
    headerRol.classList.add('bg-success');
    headerRol.classList.remove('bg-danger');
  }

  headerRol.innerHTML = role;
}


document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
})