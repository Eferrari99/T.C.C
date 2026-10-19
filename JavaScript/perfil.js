
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
      return {
          ...extra,
          'x-user-id': userId || ''
      };
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

      if (!response.ok) {
          throw new Error(
              data.error || 'Não foi possível concluir a solicitação.'
          );
      }

      return data;
  }

  function addInfo(container, label, value) {
      const info = document.createElement('div');
      info.className = 'informacao';

      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;

      const span = document.createElement('span');
      span.textContent =
          value !== undefined && value !== null && value !== ''
              ? String(value)
              : 'Não informado';

      info.append(strong, span);
      container.appendChild(info);
  }

  function setPhotoMessage(message, success = false) {
      if (!photoMessage) return;

      photoMessage.textContent = message;
      photoMessage.style.color = success ? '#176b2c' : '#b00020';
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

              const result = await request('/api/me/photo', {
                  method: 'POST',
                  body: formData
              });

              photo.src = result.photoUrl;
              photo.hidden = false;
              avatar?.classList.add('com-foto');
              setPhotoMessage('Foto atualizada com sucesso!', true);
          } catch (error) {
              photo.src = previousSrc;
              photo.hidden = previousHidden;

              if (avatar && previousHidden) {
                  avatar.classList.remove('com-foto');
              }

              setPhotoMessage(error.message);
          } finally {
              URL.revokeObjectURL(previewUrl);
              photoInput.value = '';
          }
      });
  }

  function createPetCard(pet) {
      const card = document.createElement('article');
      card.className = 'pet-card';

      const title = document.createElement('h3');
      title.textContent = pet.name || 'Pet';
      card.appendChild(title);

      // Foto e botão de lápis exclusivos deste pet.
      const photoWrapper = document.createElement('div');
      photoWrapper.className = 'foto-pet-wrapper';

      const petPhoto = document.createElement('img');
      petPhoto.className = 'foto-pet';
      petPhoto.alt = `Foto de ${pet.name || 'pet'}`;

      if (pet.photoUrl) {
          petPhoto.src = pet.photoUrl;
      } else {
          petPhoto.hidden = true;
      }

      petPhoto.addEventListener('error', () => {
          petPhoto.hidden = true;
      });

      const placeholder = document.createElement('div');
      placeholder.className = 'foto-pet-placeholder';
      placeholder.innerHTML = '<i class="bi bi-camera-fill" aria-hidden="true"></i>';
      placeholder.setAttribute('aria-label', 'Pet sem foto');

      if (pet.photoUrl) {
          placeholder.hidden = true;
      }

      petPhoto.addEventListener('load', () => {
          placeholder.hidden = true;
          petPhoto.hidden = false;
      });

      photoWrapper.append(petPhoto, placeholder);

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

      const pencil = document.createElement('i');
      pencil.className = 'bi bi-pencil-fill';
      pencil.setAttribute('aria-hidden', 'true');

      editLabel.appendChild(pencil);
      editLabel.appendChild(fileInput);
      photoWrapper.appendChild(editLabel);

      card.appendChild(photoWrapper);

      const photoStatus = document.createElement('p');
      photoStatus.className = 'mensagem-foto-pet';
      photoStatus.setAttribute('role', 'status');
      photoStatus.setAttribute('aria-live', 'polite');
      card.appendChild(photoStatus);

      // Cada botão envia a foto usando o ID do próprio pet.
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
          const previousHidden = petPhoto.hidden;
          const previewUrl = URL.createObjectURL(file);

          petPhoto.src = previewUrl;
          petPhoto.hidden = false;
          placeholder.hidden = true;
          photoStatus.textContent = 'Salvando foto...';
          editLabel.classList.add('enviando');

          try {
              const formData = new FormData();
              formData.append('photo', file);

              const result = await request(
                  `/api/pets/${encodeURIComponent(pet.id)}/photo`,
                  {
                      method: 'POST',
                      body: formData
                  }
              );

              pet.photoUrl = result.photoUrl;
              petPhoto.src = result.photoUrl;
              petPhoto.hidden = false;
              placeholder.hidden = true;
              photoStatus.textContent = 'Foto atualizada com sucesso!';
          } catch (error) {
              petPhoto.src = previousUrl || '';
              petPhoto.hidden = previousUrl ? previousHidden : true;
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

      result.pets.forEach(pet => {
          petsBox.appendChild(createPetCard(pet));
      });
  }

  async function loadProfile() {
      if (!userId) {
          window.location.replace('login.html');
          return;
      }

      try {
          const result = await request('/api/me');
          const user = result.user;

          if (avatar) {
              avatar.textContent = (user.name || user.email || 'U')
                  .trim()
                  .charAt(0)
                  .toUpperCase();
          }

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

          if (userBox) {
              userBox.replaceChildren();
              addInfo(userBox, 'Nome', user.name);
              addInfo(userBox, 'Telefone', user.phone);
              addInfo(userBox, 'E-mail', user.email);
              addInfo(userBox, 'Nascimento', user.birthDate);

              if (user.cpf) {
                  addInfo(userBox, 'CPF', user.cpf);
              }
          }

          await loadPets();
      } catch (error) {
          console.error('Erro ao carregar perfil:', error);

          if (userBox) {
              userBox.textContent = error.message;
          }

          if (petsBox) {
              petsBox.textContent = 'Não foi possível carregar seus pets.';
          }
      }
  }

  if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
          try {
              await fetch('/api/logout', {
                  method: 'POST',
                  headers: authHeaders()
              });
          } finally {
              localStorage.removeItem('taxidog_userId');
              window.location.replace('login.html');
          }
      });
  }

  addUserPhotoControls();
  loadProfile();
})();