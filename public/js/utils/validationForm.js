(() => {
    'use strict'
  
    const forms = document.querySelectorAll('.needs-validation')
  
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
})();

const emailFormat = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

const phoneFormat = (phone) => {
  if(!phone) return null;

  const onlyNumbers = phone.replace(/\D/g, '');
  const onlyTenDigits = /^\d{10}$/.test(onlyNumbers);

  return onlyTenDigits ? onlyNumbers : null;
}

const hexcolorFormat = (color) => /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(color);