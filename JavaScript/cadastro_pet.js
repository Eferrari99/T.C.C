(() => {
  const form = document.getElementById('formPet');
  const message = document.getElementById('mensagem');
  const userId = localStorage.getItem('taxidog_userId');

  if (!userId) {
    window.location.replace('login.html');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('taxidog_userId');
        window.location.replace('login.html');
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Não foi possível cadastrar o pet.');

      message.style.color = '#236b21';
      message.textContent = result.message + ' Voltando ao perfil...';
      form.reset();
      setTimeout(() => { window.location.href = 'perfil.html'; }, 900);
    } catch (error) {
      message.textContent = error.message || 'Erro de conexão com o servidor.';
    } finally {
      button.disabled = false;
      button.textContent = 'Confirmar';
    }
  });
})();
