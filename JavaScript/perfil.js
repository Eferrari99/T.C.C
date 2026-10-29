(() => {
  const userBox = document.getElementById('dadosUsuario');
  const petsBox = document.getElementById('listaPets');
  const avatar = document.getElementById('avatarUsuario');
  const photo = document.getElementById('fotoUsuario');
  const photoInput = document.getElementById('arquivoFotoUsuario');
  const photoMessage = document.getElementById('mensagemFoto');
  const logoutButton = document.getElementById('botaoSair');
  const editUserButton = document.getElementById('botaoEditarUsuario');
  const editUserForm = document.getElementById('formEditarUsuario');
  const cancelEditUserButton = document.getElementById('cancelarEditarUsuario');
  const userFormMessage = document.getElementById('mensagemEditarUsuario');

  const userId = localStorage.getItem('taxidog_userId');
  let currentUser = null;

  function authHeaders(extra = {}) {
    return { ...extra, 'x-user-id': userId || '' };
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

  function addInfo(container, label, value) {
    const info = document.createElement('div');
    info.className = 'informacao';
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    const span = document.createElement('span');
    span.textContent = value !== undefined && value !== null && value !== '' ? String(value) : 'Não informado';
    info.append(strong, span);
    container.appendChild(info);
  }

  function setPhotoMessage(message, success = false) {
    if (!photoMessage) return;
    photoMessage.textContent = message;
    photoMessage.style.color = success ? '#176b2c' : '#b00020';
  }

  function setFormMessage(element, message, success = false) {
    if (!element) return;
    element.textContent = message;
    element.style.color = success ? '#176b2c' : '#b00020';
  }

  function addUserPhotoControls() {
    if (!photoInput || !photo) return;
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setPhotoMessage('Escolha uma imagem JPG, PNG ou WebP.');
        photoInput.value = '';
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setPhotoMessage('A imagem deve ter no máximo 3 MB.');
        photoInput.value = '';
        return;
      }

      const previousSrc = photo.src;
      const previousHidden = photo.hidden;
      const previewUrl = URL.createObjectURL(file);
      photo.src = previewUrl;
      photo.hidden = false;
      avatar?.classList.add('com-foto');
      setPhotoMessage('Salvando foto...');

      try {
        const formData = new FormData();
        formData.append('photo', file);
        const result = await request('/api/me/photo', { method: 'POST', body: formData });
        photo.src = result.photoUrl;
        photo.hidden = false;
        avatar?.classList.add('com-foto');
        setPhotoMessage('Foto atualizada com sucesso!', true);
      } catch (error) {
        photo.src = previousSrc;
        photo.hidden = previousHidden;
        if (avatar && previousHidden) avatar.classList.remove('com-foto');
        setPhotoMessage(error.message);
      } finally {
        URL.revokeObjectURL(previewUrl);
        photoInput.value = '';
      }
    });
  }

  function showUser(user) {
    currentUser = user;
    if (avatar) avatar.textContent = (user.name || user.email || 'U').trim().charAt(0).toUpperCase();
    if (photo) {
      photo.onerror = () => {
        photo.hidden = true;
        avatar?.classList.remove('com-foto');
      };
      if (user.photoUrl || user.picture) {
        photo.src = user.photoUrl || user.picture;
        photo.hidden = false;
        avatar?.classList.add('com-foto');
      } else {
        photo.hidden = true;
        avatar?.classList.remove('com-foto');
      }
    }

    userBox.replaceChildren();
    addInfo(userBox, 'Nome', user.name);
    addInfo(userBox, 'Telefone', user.phone);
    addInfo(userBox, 'E-mail', user.email);
    addInfo(userBox, 'Nascimento', user.birthDate);
    if (user.cpf) addInfo(userBox, 'CPF', user.cpf);

    if (editUserForm) {
      editUserForm.elements.name.value = user.name || '';
      editUserForm.elements.phone.value = user.phone || '';
      editUserForm.elements.email.value = user.email || '';
      editUserForm.elements.birthDate.value = user.birthDate || '';
      editUserForm.elements.cpf.value = user.cpf || '';
    }
  }

  if (editUserButton && editUserForm) {
    editUserButton.addEventListener('click', () => {
      editUserForm.hidden = !editUserForm.hidden;
      editUserButton.textContent = editUserForm.hidden ? 'Editar informações' : 'Fechar edição';
      if (!editUserForm.hidden) editUserForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  cancelEditUserButton?.addEventListener('click', () => {
    if (currentUser) showUser(currentUser);
    editUserForm.hidden = true;
    if (editUserButton) editUserButton.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar informações';
    setFormMessage(userFormMessage, '');
  });

  editUserForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setFormMessage(userFormMessage, 'Salvando alterações...', true);
    const payload = {
      name: editUserForm.elements.name.value.trim(),
      phone: editUserForm.elements.phone.value.trim(),
      email: editUserForm.elements.email.value.trim(),
      birthDate: editUserForm.elements.birthDate.value,
      cpf: editUserForm.elements.cpf.value.trim()
    };
    try {
      const result = await request('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showUser(result.user);
      editUserForm.hidden = true;
      if (editUserButton) editUserButton.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar informações';
      setFormMessage(userFormMessage, 'Informações atualizadas com sucesso!', true);
    } catch (error) {
      setFormMessage(userFormMessage, error.message);
    }
  });

  function makePetEditForm(pet) {
    const form = document.createElement('form');
    form.className = 'form-edicao form-edicao-pet';
    form.hidden = true;
    form.innerHTML = `
      <label>Nome <input name="name" type="text" maxlength="80" required></label>
      <label>Sexo <select name="sex" required><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
      <label>Espécie <input name="species" type="text" maxlength="60" required></label>
      <label>Raça <input name="breed" type="text" maxlength="80" required></label>
      <label>Idade (anos) <input name="age" type="number" min="0" max="100" step="1" required></label>
      <label>Peso (kg) <input name="weight" type="number" min="0.1" max="500" step="0.1" required></label>
      <label>Comorbidades / necessidades especiais <textarea name="comorbidities" rows="3" maxlength="500"></textarea></label>
      <p class="mensagem-formulario" role="status" aria-live="polite"></p>
      <div class="acoes-formulario">
        <button class="botao-acao-perfil" type="submit">Salvar alterações</button>
        <button class="botao-cancelar" type="button">Cancelar</button>
      </div>`;
    form.elements.name.value = pet.name || '';
    form.elements.sex.value = pet.sex || 'masculino';
    form.elements.species.value = pet.species || '';
    form.elements.breed.value = pet.breed || '';
    form.elements.age.value = pet.age ?? '';
    form.elements.weight.value = pet.weight ?? '';
    form.elements.comorbidities.value = pet.comorbidities || '';
    return form;
  }

  function createPetCard(pet) {
    const card = document.createElement('article');
    card.className = 'pet-card';
    const title = document.createElement('h3');
    title.textContent = pet.name || 'Pet';
    card.appendChild(title);

    const photoWrapper = document.createElement('div');
    photoWrapper.className = 'foto-pet-wrapper';
    const petPhoto = document.createElement('img');
    petPhoto.className = 'foto-pet';
    petPhoto.alt = `Foto de ${pet.name || 'pet'}`;
    petPhoto.hidden = !pet.photoUrl;
    if (pet.photoUrl) petPhoto.src = pet.photoUrl;
    petPhoto.addEventListener('error', () => { petPhoto.hidden = true; });

    const placeholder = document.createElement('div');
    placeholder.className = 'foto-pet-placeholder';
    placeholder.innerHTML = '<i class="bi bi-camera-fill" aria-hidden="true"></i>';
    placeholder.setAttribute('aria-label', 'Pet sem foto');
    placeholder.hidden = Boolean(pet.photoUrl);
    petPhoto.addEventListener('load', () => { placeholder.hidden = true; petPhoto.hidden = false; });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'arquivo-foto-pet';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.hidden = true;
    fileInput.setAttribute('aria-label', `Escolher foto de ${pet.name || 'pet'}`);
    const editLabel = document.createElement('label');
    editLabel.className = 'botao-alterar-foto-pet';
    editLabel.title = `Alterar foto de ${pet.name || 'pet'}`;
    editLabel.setAttribute('aria-label', `Alterar foto de ${pet.name || 'pet'}`);
    editLabel.innerHTML = '<i class="bi bi-pencil-fill" aria-hidden="true"></i>';
    editLabel.appendChild(fileInput);
    photoWrapper.append(petPhoto, placeholder, editLabel);
    card.appendChild(photoWrapper);

    const photoStatus = document.createElement('p');
    photoStatus.className = 'mensagem-foto-pet';
    photoStatus.setAttribute('role', 'status');
    photoStatus.setAttribute('aria-live', 'polite');
    card.appendChild(photoStatus);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        photoStatus.textContent = 'Escolha uma imagem JPG, PNG ou WebP.';
        fileInput.value = '';
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        photoStatus.textContent = 'A imagem deve ter no máximo 3 MB.';
        fileInput.value = '';
        return;
      }
      const previousUrl = pet.photoUrl || '';
      const previewUrl = URL.createObjectURL(file);
      petPhoto.src = previewUrl;
      petPhoto.hidden = false;
      placeholder.hidden = true;
      photoStatus.textContent = 'Salvando foto...';
      editLabel.classList.add('enviando');
      try {
        const formData = new FormData();
        formData.append('photo', file);
        const result = await request(`/api/pets/${encodeURIComponent(pet.id)}/photo`, { method: 'POST', body: formData });
        pet.photoUrl = result.photoUrl;
        petPhoto.src = result.photoUrl;
        petPhoto.hidden = false;
        placeholder.hidden = true;
        photoStatus.textContent = 'Foto atualizada com sucesso!';
      } catch (error) {
        petPhoto.src = previousUrl;
        petPhoto.hidden = !previousUrl;
        placeholder.hidden = Boolean(previousUrl);
        photoStatus.textContent = error.message;
      } finally {
        URL.revokeObjectURL(previewUrl);
        fileInput.value = '';
        editLabel.classList.remove('enviando');
      }
    });

    addInfo(card, 'Espécie', pet.species);
    addInfo(card, 'Sexo', pet.sex);
    addInfo(card, 'Raça', pet.breed);
    addInfo(card, 'Idade', pet.age === 1 ? '1 ano' : `${pet.age} anos`);
    addInfo(card, 'Peso', pet.weight ? `${pet.weight} kg` : '');
    addInfo(card, 'Comorbidades', pet.comorbidities);

    const actions = document.createElement('div');
    actions.className = 'acoes-pet';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'botao-acao-perfil';
    editButton.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar informações';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'botao-remover-pet';
    deleteButton.innerHTML = '<i class="bi bi-trash3-fill" aria-hidden="true"></i> Remover pet';
    actions.append(editButton, deleteButton);
    card.appendChild(actions);

    const form = makePetEditForm(pet);
    card.appendChild(form);
    editButton.addEventListener('click', () => {
      form.hidden = !form.hidden;
      editButton.innerHTML = form.hidden
        ? '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar informações'
        : '<i class="bi bi-x-lg" aria-hidden="true"></i> Fechar edição';
      if (!form.hidden) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    form.querySelector('.botao-cancelar').addEventListener('click', () => {
      form.elements.name.value = pet.name || '';
      form.elements.sex.value = pet.sex || 'masculino';
      form.elements.species.value = pet.species || '';
      form.elements.breed.value = pet.breed || '';
      form.elements.age.value = pet.age ?? '';
      form.elements.weight.value = pet.weight ?? '';
      form.elements.comorbidities.value = pet.comorbidities || '';
      form.hidden = true;
      editButton.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar informações';
      setFormMessage(form.querySelector('.mensagem-formulario'), '');
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = form.querySelector('.mensagem-formulario');
      setFormMessage(message, 'Salvando alterações...', true);
      const payload = {
        name: form.elements.name.value.trim(),
        sex: form.elements.sex.value,
        species: form.elements.species.value.trim(),
        breed: form.elements.breed.value.trim(),
        age: Number(form.elements.age.value),
        weight: Number(form.elements.weight.value),
        comorbidities: form.elements.comorbidities.value.trim()
      };
      try {
        await request(`/api/pets/${encodeURIComponent(pet.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await loadPets();
      } catch (error) {
        setFormMessage(message, error.message);
      }
    });

    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`Tem certeza de que deseja remover ${pet.name || 'este pet'}? Essa ação não pode ser desfeita.`)) return;
      deleteButton.disabled = true;
      deleteButton.textContent = 'Removendo...';
      try {
        await request(`/api/pets/${encodeURIComponent(pet.id)}`, { method: 'DELETE' });
        await loadPets();
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
        deleteButton.innerHTML = '<i class="bi bi-trash3-fill" aria-hidden="true"></i> Remover pet';
      }
    });

    return card;
  }

  async function loadPets() {
    petsBox.replaceChildren();
    const result = await request('/api/pets');
    if (!result.pets || result.pets.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Você ainda não cadastrou nenhum pet.';
      petsBox.appendChild(empty);
      return;
    }
    result.pets.forEach(pet => petsBox.appendChild(createPetCard(pet)));
  }

  async function loadProfile() {
    if (!userId) {
      window.location.replace('login.html');
      return;
    }
    try {
      const result = await request('/api/me');
      showUser(result.user);
      await loadPets();
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (userBox) userBox.textContent = error.message;
      if (petsBox) petsBox.textContent = 'Não foi possível carregar seus pets.';
    }
  }

  logoutButton?.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST', headers: authHeaders() });
    } finally {
      localStorage.removeItem('taxidog_userId');
      window.location.replace('login.html');
    }
  });

  addUserPhotoControls();
  loadProfile();
})();
