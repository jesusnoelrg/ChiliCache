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


const btnAside = d.querySelector("#btnAside");
const mainAside = d.querySelector("#mainAside");
const sectionName = d.querySelectorAll(".aside-section-name");
const textElements = d.querySelectorAll('.aside-category-name, .aside-title-logo');
const tooltipAside = d.querySelectorAll('.nav-tooltip');

btnAside.addEventListener('click', () => {
  if (mainAside.classList.contains('aside-collapse')) {
    mainAside.classList.remove('aside-collapse');

    tooltipAside.forEach(element => {
      bootstrap.Tooltip.getOrCreateInstance(element).disable();
    });

    setTimeout(() => {
      textElements.forEach(element => {
        element.style.display = 'block';
      });

      sectionName.forEach(element => {
        element.style.display = 'inline';
      });
    }, 300);

    setTimeout(() => {
      textElements.forEach(element => {
        element.style.opacity = '1';
      });

      sectionName.forEach(element => {
        element.style.opacity = '1';
      });
    }, 400);
  } else {

    textElements.forEach(element => {
      element.style.opacity = '0';
    });

    sectionName.forEach(element => {
      element.style.opacity = '0';
    });

    setTimeout(() => {
      textElements.forEach(element => {
        element.style.display = 'none';
      });

      sectionName.forEach(element => {
        element.style.display = 'none';
      });

      mainAside.classList.add('aside-collapse');

      tooltipAside.forEach(element => {
        bootstrap.Tooltip.getOrCreateInstance(element).enable();
      });
    }, 300);
  }
});