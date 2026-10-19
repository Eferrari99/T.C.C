(() => {
  const form = document.getElementById('formCadastro');
  const message = document.getElementById('mensagem');
  const cpf = document.getElementById('cpf');

  cpf.addEventListener('input', () => {
    const digits = cpf.value.replace(/\D/g, '').slice(0, 11);
    cpf.value = digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.style.color = '#a51e1e';
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    if (data.password.length < 8) {
      message.textContent = 'A senha precisa ter pelo menos 8 caracteres.';
      return;
    }
    if (data.password !== data.confirmPassword) {
      message.textContent = 'As senhas não são iguais.';
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Cadastrando...';

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível realizar o cadastro.');

      message.style.color = '#236b21';
      message.textContent = result.message + ' Redirecionando para o login...';
      form.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (error) {
      message.textContent = error.message || 'Erro de conexão com o servidor.';
    } finally {
      button.disabled = false;
      button.textContent = 'Cadastrar';
    }
  });
})();
