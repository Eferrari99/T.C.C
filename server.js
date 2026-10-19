
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const DB_DIR = path.join(__dirname, 'BD');
const USERS_FILE = path.join(DB_DIR, 'usuarios.json');
const PETS_FILE = path.join(DB_DIR, 'pets.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(DB_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

for (const file of [USERS_FILE, PETS_FILE]) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]', 'utf8');
    }
}

app.disable('x-powered-by');
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false }));

// Impede o acesso público aos arquivos internos.
app.use((req, res, next) => {
    let pathname;

    try {
        pathname = decodeURIComponent(req.path);
    } catch {
        return res.status(400).send('Caminho inválido.');
    }

    const normalized = pathname.replace(/\\/g, '/');
    const blocked = [
        '/BD',
        '/server.js',
        '/package.json',
        '/package-lock.json',
        '/.env'
    ];

    if (
        blocked.some(item =>
            normalized === item || normalized.startsWith(item + '/')
        ) ||
        normalized.split('/').includes('node_modules')
    ) {
        return res.status(404).send('Página não encontrada.');
    }

    next();
});

app.use('/uploads', express.static(UPLOAD_DIR, {
    dotfiles: 'deny',
    index: false
}));

app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: false
}));

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function readDb(file) {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Erro ao ler ${path.basename(file)}:`, error.message);
        throw new Error('Não foi possível ler o banco de dados.');
    }
}

function writeDb(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function publicUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

function getUserFromRequest(req) {
    const userId = String(
        req.get('x-user-id') || req.body?.userId || ''
    ).trim();

    if (!userId) return null;

    return readDb(USERS_FILE).find(user => user.id === userId) || null;
}

function requireUser(req, res, next) {
    try {
        const user = getUserFromRequest(req);

        if (!user) {
            return res.status(401).json({
                error: 'Você precisa entrar na sua conta novamente.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erro ao identificar usuário:', error.message);
        return res.status(500).json({
            error: 'Não foi possível verificar o usuário.'
        });
    }
}

function deleteUploadedImage(photoUrl) {
    if (!photoUrl || typeof photoUrl !== 'string') return;

    const filename = path.basename(photoUrl);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Só remove arquivos diretamente dentro da pasta de uploads.
    if (path.dirname(filePath) !== UPLOAD_DIR) return;

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Não foi possível remover a imagem antiga:', error.message);
    }
}

// ========================================
// UPLOAD DE IMAGENS
// ========================================

const allowedImageTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const imageStorage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, UPLOAD_DIR);
    },

    filename: (_req, file, callback) => {
        const extension = allowedImageTypes[file.mimetype];

        if (!extension) {
            return callback(new Error('Envie uma imagem JPG, PNG ou WebP.'));
        }

        callback(null, crypto.randomUUID() + extension);
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 1
    },
    fileFilter: (_req, file, callback) => {
        if (!allowedImageTypes[file.mimetype]) {
            return callback(new Error('Envie uma imagem JPG, PNG ou WebP.'));
        }

        callback(null, true);
    }
});

// ========================================
// CADASTRO DE USUÁRIO
// ========================================

app.post('/api/register', async (req, res) => {
    try {
        const {
            name,
            birthDate,
            cpf,
            phone,
            email,
            password,
            confirmPassword
        } = req.body;

        if (![name, birthDate, cpf, phone, email, password, confirmPassword]
            .every(value => String(value || '').trim())) {
            return res.status(400).json({
                error: 'Preencha todos os campos.'
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(String(email))) {
            return res.status(400).json({
                error: 'Informe um e-mail válido.'
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                error: 'A senha deve ter pelo menos 8 caracteres.'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'As senhas não são iguais.'
            });
        }

        const birth = new Date(`${birthDate}T00:00:00`);

        if (Number.isNaN(birth.getTime()) || birth > new Date()) {
            return res.status(400).json({
                error: 'Informe uma data de nascimento válida.'
            });
        }

        const cpfDigits = String(cpf).replace(/\D/g, '');

        if (cpfDigits.length !== 11) {
            return res.status(400).json({
                error: 'Informe um CPF com 11 dígitos.'
            });
        }

        const users = readDb(USERS_FILE);
        const normalizedEmail = normalizeEmail(email);

        if (users.some(user => user.email === normalizedEmail)) {
            return res.status(409).json({
                error: 'Este e-mail já está cadastrado.'
            });
        }

        if (users.some(user => user.cpf === cpfDigits)) {
            return res.status(409).json({
                error: 'Este CPF já está cadastrado.'
            });
        }

        const user = {
            id: `usr_${crypto.randomUUID()}`,
            name: String(name).trim(),
            birthDate: String(birthDate),
            cpf: cpfDigits,
            phone: String(phone).trim(),
            email: normalizedEmail,
            passwordHash: await bcrypt.hash(String(password), 10),
            provider: 'local',
            photoUrl: '',
            createdAt: new Date().toISOString()
        };

        users.push(user);
        writeDb(USERS_FILE, users);

        return res.status(201).json({
            message: 'Cadastro concluído! Agora você já pode entrar na sua conta.'
        });
    } catch (error) {
        console.error('Erro no cadastro:', error);

        return res.status(500).json({
            error: 'Não foi possível concluir o cadastro.'
        });
    }
});

// ========================================
// LOGIN
// ========================================

app.post('/api/login', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        const user = readDb(USERS_FILE)
            .find(item => item.email === email);

        if (
            !user ||
            !user.passwordHash ||
            !(await bcrypt.compare(password, user.passwordHash))
        ) {
            return res.status(401).json({
                error: 'E-mail ou senha incorretos.'
            });
        }

        return res.json({
            message: 'Login realizado com sucesso.',
            user: publicUser(user)
        });
    } catch (error) {
        console.error('Erro no login:', error);

        return res.status(500).json({
            error: 'Erro ao realizar login.'
        });
    }
});

// ========================================
// DADOS DO USUÁRIO
// ========================================

app.get('/api/me', requireUser, (req, res) => {
    res.set('Cache-Control', 'no-store');

    return res.json({
        user: publicUser(req.user)
    });
});

// ========================================
// ATUALIZAR FOTO DO USUÁRIO
// ========================================

app.post(
    '/api/me/photo',
    requireUser,
    imageUpload.single('photo'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'Selecione uma imagem.'
                });
            }

            const users = readDb(USERS_FILE);
            const user = users.find(item => item.id === req.user.id);

            if (!user) {
                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    error: 'Usuário não encontrado.'
                });
            }

            const oldPhoto = user.photoUrl;
            user.photoUrl = `/uploads/${req.file.filename}`;

            writeDb(USERS_FILE, users);
            deleteUploadedImage(oldPhoto);

            return res.json({
                message: 'Foto atualizada com sucesso.',
                photoUrl: user.photoUrl
            });
        } catch (error) {
            console.error('Erro ao atualizar foto:', error);

            return res.status(500).json({
                error: 'Não foi possível atualizar a foto.'
            });
        }
    }
);

// ========================================
// SAIR DA CONTA
// ========================================

app.post('/api/logout', (_req, res) => {
    return res.json({
        message: 'Você saiu da conta.'
    });
});

// ========================================
// LISTAR PETS DO USUÁRIO
// ========================================

app.get('/api/pets', requireUser, (req, res) => {
    try {
        const pets = readDb(PETS_FILE)
            .filter(pet => pet.userId === req.user.id);

        return res.json({ pets });
    } catch (error) {
        console.error('Erro ao listar pets:', error);

        return res.status(500).json({
            error: 'Não foi possível carregar os pets.'
        });
    }
});

// ========================================
// CADASTRAR PET, COM FOTO OPCIONAL
// ========================================

app.post(
    '/api/pets',
    requireUser,
    imageUpload.single('photo'),
    (req, res) => {
        try {
            const {
                name,
                sex,
                species,
                breed,
                age,
                weight,
                comorbidities
            } = req.body;

            if (![name, sex, species, breed, age, weight]
                .every(value => String(value ?? '').trim())) {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    error: 'Preencha nome, sexo, espécie, raça, idade e peso.'
                });
            }

            if (!['masculino', 'feminino'].includes(sex)) {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    error: 'Selecione o sexo do pet.'
                });
            }

            if (
                !Number.isInteger(Number(age)) ||
                Number(age) < 0 ||
                Number(age) > 100
            ) {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    error: 'Informe uma idade válida entre 0 e 100 anos.'
                });
            }

            if (
                !Number.isFinite(Number(weight)) ||
                Number(weight) <= 0 ||
                Number(weight) > 500
            ) {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    error: 'Informe um peso válido em kg.'
                });
            }

            const pets = readDb(PETS_FILE);

            const pet = {
                id: `pet_${crypto.randomUUID()}`,
                userId: req.user.id,
                name: String(name).trim(),
                sex,
                species: String(species).trim(),
                breed: String(breed).trim(),
                age: Number(age),
                weight: Number(weight),
                comorbidities: String(comorbidities || '').trim(),
                photoUrl: req.file
                    ? `/uploads/${req.file.filename}`
                    : '',
                createdAt: new Date().toISOString()
            };

            pets.push(pet);
            writeDb(PETS_FILE, pets);

            return res.status(201).json({
                message: 'Pet cadastrado com sucesso.',
                pet
            });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error('Erro ao cadastrar pet:', error);

            return res.status(500).json({
                error: 'Não foi possível salvar o pet.'
            });
        }
    }
);

// ========================================
// ALTERAR FOTO DE UM PET ESPECÍFICO
// ========================================

app.post(
    '/api/pets/:petId/photo',
    requireUser,
    imageUpload.single('photo'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'Selecione uma imagem.'
                });
            }

            const pets = readDb(PETS_FILE);

            const pet = pets.find(item =>
                item.id === req.params.petId &&
                item.userId === req.user.id
            );

            if (!pet) {
                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    error: 'Pet não encontrado na sua conta.'
                });
            }

            const oldPhoto = pet.photoUrl;
            pet.photoUrl = `/uploads/${req.file.filename}`;

            writeDb(PETS_FILE, pets);
            deleteUploadedImage(oldPhoto);

            return res.json({
                message: 'Foto do pet atualizada com sucesso.',
                photoUrl: pet.photoUrl,
                pet
            });
        } catch (error) {
            console.error('Erro ao atualizar foto do pet:', error);

            return res.status(500).json({
                error: 'Não foi possível atualizar a foto do pet.'
            });
        }
    }
);

// ========================================
// PÁGINA INICIAL
// ========================================

app.get('/', (_req, res) => {
    res.redirect('/login.html');
});

// ========================================
// TRATAMENTO DE ERROS
// ========================================

app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);

    if (
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'
    ) {
        return res.status(413).json({
            error: 'A imagem deve ter no máximo 3 MB.'
        });
    }

    if (error.message?.includes('Envie uma imagem')) {
        return res.status(400).json({
            error: error.message
        });
    }

    console.error('Erro no servidor:', error);

    return res.status(500).json({
        error: 'Ocorreu um erro interno no servidor.'
    });
});

app.listen(PORT, () => {
    console.log(`Taxi-Dog disponível em http://localhost:${PORT}`);
});