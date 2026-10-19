# Taxi-Dog — telas integradas

Este pacote inclui versões integradas das páginas `cadastro.html`, `login.html`, `perfil.html` e `cadastro_pet.html`, os CSS dessas páginas, os scripts dentro de `JavaScript/`, os arquivos JSON dentro de `BD/` e uma API Node.js para validar login e salvar os dados.

## Requisitos
- Node.js 18 ou superior.
- As imagens originais do projeto. Copie seus arquivos de imagem (incluindo `TAXI-DOG.png` e as fotos) para a pasta `img/` deste pacote.

## Como executar
1. Extraia o ZIP.
2. Abra um terminal dentro da pasta `taxi-dog-integrado`.
3. Execute `npm install`.
4. Copie `.env.example` para `.env`.
5. No `.env`, defina `JWT_SECRET` como uma chave longa e aleatória (mínimo de 24 caracteres).
6. Execute `npm start`.
7. Abra `http://localhost:3000` no navegador. Não abra os HTML diretamente pelo explorador de arquivos: a API precisa estar rodando.

## Ativar login Google
1. Crie um OAuth Client ID do tipo Web no Google Cloud Console.
2. Adicione `http://localhost:3000` em **Origens JavaScript autorizadas**.
3. Copie o mesmo Client ID para `GOOGLE_CLIENT_ID` no `.env` e para `GOOGLE_CLIENT_ID` em `JavaScript/config.js`.
4. Reinicie o servidor.

O login Google usa a biblioteca oficial do Google Identity Services no navegador e valida a credencial novamente no servidor. Sem o Client ID, o login por e-mail e senha continua disponível e a tela informa que o Google ainda precisa ser configurado.

## Dados e segurança
- Os usuários ficam em `BD/usuarios.json`; os pets ficam em `BD/pets.json`.
- As senhas são armazenadas com hash bcrypt, nunca em texto puro.
- A sessão usa cookie HTTP-only e JWT assinado pelo servidor.
- Há limite de tentativas nos endpoints de autenticação.
- A confirmação de humano deste exemplo é uma caixa de confirmação do navegador. Ela é apenas uma etapa de interface, não um CAPTCHA resistente a bots. Antes de publicar na internet, substitua-a por reCAPTCHA ou hCaptcha validado no servidor.
- JSON é adequado apenas para projeto escolar/demonstração: não é um banco transacional, não deve ser exposto publicamente e não é indicado para múltiplas instâncias. Para produção, use um banco de dados, HTTPS, gerenciamento seguro de segredos, backups e revisão de segurança.

## Integração com o projeto original
Os nomes de páginas, IDs e classes principais das telas fornecidas foram mantidos sempre que possível. Este pacote contém apenas as quatro telas e os arquivos de suporte necessários; páginas adicionais como `index.html`, `sobre.html`, `produtos.html`, `corrida.html`, `carrinho.html` e `contato.html` não foram recriadas. Copie essas páginas e seus recursos originais para a mesma pasta do projeto. Os arquivos de imagem originais também precisam ser copiados para `img/`.
