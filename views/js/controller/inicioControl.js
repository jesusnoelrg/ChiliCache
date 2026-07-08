document.addEventListener('DOMContentLoaded', () => {
    obtenerUsuarios((data) => {
        document.getElementById('cantidadUsuarios').textContent = data.length;
    });

    obtenerClientes((data) => {
        document.getElementById('cantidadClientes').textContent = data.length;
    });
});
