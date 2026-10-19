(() => {
  const userBox = document.getElementById('dadosUsuario');
  const petsBox = document.getElementById('listaPets');
  const avatar = document.getElementById('avatarUsuario');
  const photo = document.getElementById('fotoUsuario');
  const photoInput = document.getElementById('arquivoFotoUsuario');
  const photoMessage = document.getElementById('mensagemFoto');
  const logoutButton = document.getElementById('botaoSair');
  const userId = localStorage.getItem('taxidog_userId');

  function authHeaders(extra = {}) {
    return { ...extra, 'x-user-id': userId || '' };
  }

  function addInfo(container, label, value) {
    const div = document.createElement('div');
    div.className = 'informacao';
    div.textContent = `${label}: ${value || 'Não informado'}`;
    container.appendChild(div);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: authHeaders(options.headers || {})
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem('taxidog_userId');
      window.location.replace('login.html');
      throw new Error('Entre novamente na sua conta.');
    }
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
    return data;
  }

  async function loadPets() {
    const data = await request('/api/pets');
    petsBox.replaceChildren();

    if (!Array.isArray(data.pets) || data.pets.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'Você ainda não cadastrou nenhum pet.';
      petsBox.appendChild(p);
      return;
    }

    data.pets.forEach(pet => {
      const card = document.createElement('article');
      card.className = 'pet-card';
      const title = document.createElement('h3');
      title.textContent = pet.name || 'Pet';
      card.appendChild(title);
      addInfo(card, 'Espécie', pet.species);
      addInfo(card, 'Sexo', pet.sex === 'masculino' ? 'Macho' : pet.sex === 'feminino' ? 'Fêmea' : 'Não informado');
      addInfo(card, 'Raça', pet.breed);
      addInfo(card, 'Idade', `${pet.age ?? 'Não informada'} ano(s)`);
      addInfo(card, 'Peso', pet.weight ? `${pet.weight} kg` : '');
      if (pet.comorbidities) addInfo(card, 'Comorbidades', pet.comorbidities);
      petsBox.appendChild(card);
    });
  }

  async function loadProfile() {
    if (!userId) {
      window.location.replace('login.html');
      return;
    }

    try {
      const data = await request('/api/me');
      const user = data.user;
      avatar.textContent = (user.name || user.email || 'U').trim().charAt(0).toUpperCase();

      if (user.photoUrl && photo) {
        photo.src = user.photoUrl;
        photo.hidden = false;
        avatar.classList.add('com-foto');
      }

      userBox.replaceChildren();
      addInfo(userBox, 'Nome', user.name);
      addInfo(userBox, 'Telefone', user.phone);
      addInfo(userBox, 'E-mail', user.email);
      addInfo(userBox, 'Data nasc.', user.birthDate);
      if (user.cpf) addInfo(userBox, 'CPF', user.cpf);
      await loadPets();
    } catch (error) {
      userBox.textContent = error.message || 'Não foi possível carregar o perfil.';
    }
  }

  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        photoMessage.textContent = 'Escolha uma imagem JPG, PNG ou WebP.';
        photoInput.value = '';
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        photoMessage.textContent = 'A imagem deve ter no máximo 3 MB.';
        photoInput.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);
      photoMessage.textContent = 'Enviando foto...';

      try {
        const result = await request('/api/me/photo', {
          method: 'POST',
          body: formData
        });
        photo.src = `${result.photoUrl}?t=${Date.now()}`;
        photo.hidden = false;
        avatar.classList.add('com-foto');
        photoMessage.textContent = 'Foto atualizada com sucesso!';
      } catch (error) {
        photoMessage.textContent = error.message || 'Não foi possível atualizar a foto.';
      } finally {
        photoInput.value = '';
      }
    });
  }

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('taxidog_userId');
    window.location.replace('login.html');
  });

  loadProfile();
})();
