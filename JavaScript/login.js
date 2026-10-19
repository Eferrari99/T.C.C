(() => {
  const form = document.getElementById('formLogin');
  const message = document.getElementById('mensagem');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.style.color = '#a51e1e';
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Entrando...';

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');

      // Mantém apenas o identificador do usuário neste navegador.
      localStorage.setItem('taxidog_userId', result.user.id);
      message.style.color = '#236b21';
      message.textContent = 'Login realizado! Abrindo seu perfil...';
      window.location.replace('perfil.html');
    } catch (error) {
      message.textContent = error.message || 'Erro de conexão com o servidor.';
    } finally {
      button.disabled = false;
      button.textContent = 'Entrar';
    }
  });
})();
