
const renderMyAccount = () => {
  const cacheUser = sessionStorage.getItem('user-profile');

  if(!cacheUser) return;

  const user = JSON.parse(cacheUser);

  document.getElementById('accountUsername').innerHTML = user.username;
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
}


document.addEventListener('DOMContentLoaded', () => {
  renderMyAccount();
})