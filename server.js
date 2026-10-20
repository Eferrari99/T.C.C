
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
// CATÁLOGO PÚBLICO DE PRODUTOS
// ========================================
app.get('/api/products', (_req, res) => {
    try {
        const productsFile = path.join(DB_DIR, 'produtos.json');
        const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
        res.set('Cache-Control', 'no-store');
        return res.json({ products: Array.isArray(products) ? products : [] });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        return res.status(500).json({ error: 'Não foi possível carregar os produtos.' });
    }
});


// ========================================
// GEOCODIFICAÇÃO (PESQUISA E ENDEREÇO ATUAL)
// Mantém as chamadas ao OpenStreetMap no servidor para evitar
// bloqueios de CORS/rate-limit do Nominatim no navegador.
// ========================================
async function fetchNominatim(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const resposta = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7',
                'User-Agent': 'Taxi-Dog/1.0 (https://localhost; pet location service)'
            },
            signal: controller.signal
        });

        if (!resposta.ok) {
            throw new Error(`Nominatim HTTP ${resposta.status}`);
        }

        return await resposta.json();
    } finally {
        clearTimeout(timer);
    }
}

app.get('/api/geocode/search', async (req, res) => {
    const query = String(req.query.q || '').trim();

    if (query.length < 3) {
        return res.status(400).json({ error: 'Digite pelo menos 3 caracteres.' });
    }

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '8');
        url.searchParams.set('countrycodes', 'br');
        url.searchParams.set('dedupe', '1');
        url.searchParams.set('q', query);

        // Se o usuário já tiver uma posição, ela serve como preferência
        // geográfica, mas a busca continua podendo retornar outra cidade.
        const latitude = Number(req.query.lat);
        const longitude = Number(req.query.lon);
        if (Number.isFinite(latitude) && Number.isFinite(longitude) &&
            Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
            const deltaLat = 0.35;
            const deltaLon = 0.35;
            url.searchParams.set('viewbox', [
                longitude - deltaLon,
                latitude + deltaLat,
                longitude + deltaLon,
                latitude - deltaLat
            ].join(','));
            url.searchParams.set('bounded', '0');
        }

        const dados = await fetchNominatim(url);
        return res.json(Array.isArray(dados) ? dados : []);
    } catch (error) {
        console.error('Falha na busca de endereço:', error?.message || error);
        return res.status(503).json({
            error: 'Não foi possível consultar o serviço de endereços agora.'
        });
    }
});

app.get('/api/geocode/reverse', async (req, res) => {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return res.status(400).json({ error: 'Coordenadas inválidas.' });
    }

    try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('zoom', '18');
        url.searchParams.set('lat', String(latitude));
        url.searchParams.set('lon', String(longitude));

        let dados = await fetchNominatim(url);

        // Alguns pontos de GPS ficam fora de um endereço de porta. Nesse
        // caso, tenta novamente em um nível mais amplo para obter rua/bairro.
        if (!dados || !dados.display_name) {
            url.searchParams.set('zoom', '16');
            dados = await fetchNominatim(url);
        }

        return res.json(dados || {});
    } catch (error) {
        console.error('Falha no reverse geocoding:', error?.message || error);
        return res.status(503).json({
            error: 'Não foi possível identificar o endereço da localização atual.'
        });
    }
});


// ========================================
// BUSCA RÁPIDA DE PETSHOPS E VETERINÁRIOS
// O servidor consulta o OpenStreetMap por múltiplos espelhos e,
// se o Overpass estiver indisponível, usa o Nominatim como fallback.
// ========================================
app.get('/api/locais-proximos', async (req, res) => {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return res.status(400).json({ error: 'Coordenadas inválidas.' });
    }

    const raio = 5000;
    const chaveCache = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const agora = Date.now();
    globalThis.__taxiDogLocaisCache ??= new Map();
    const cacheLocais = globalThis.__taxiDogLocaisCache;
    const cacheado = cacheLocais.get(chaveCache);

    if (cacheado && agora - cacheado.timestamp < 5 * 60 * 1000) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json(cacheado.dados);
    }

    const consulta = `[out:json][timeout:20];(
        nwr["shop"="pet"](around:${raio},${latitude},${longitude});
        nwr["shop"="pet_grooming"](around:${raio},${latitude},${longitude});
        nwr["amenity"="veterinary"](around:${raio},${latitude},${longitude});
        nwr["healthcare"="veterinary"](around:${raio},${latitude},${longitude});
        nwr["name"~"pet.?shop|pet ?shop|petshop|veterin",i](around:${raio},${latitude},${longitude});
    );out center tags;`;

    const servidores = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter'
    ];

    async function consultarOverpass(servidor) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        try {
            const resposta = await fetch(servidor, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Accept': 'application/json',
                    'User-Agent': 'Taxi-Dog/1.0 (petshop locator)'
                },
                body: 'data=' + encodeURIComponent(consulta),
                signal: controller.signal
            });

            if (!resposta.ok) {
                throw new Error(`Overpass HTTP ${resposta.status}`);
            }

            const dados = await resposta.json();
            if (!dados || !Array.isArray(dados.elements)) {
                throw new Error('Resposta inválida do Overpass');
            }

            return { elements: dados.elements };
        } finally {
            clearTimeout(timer);
        }
    }

    async function consultarNominatim() {
        const deltaLat = raio / 111320;
        const deltaLon = raio / (111320 * Math.max(Math.cos(latitude * Math.PI / 180), 0.2));
        const viewbox = [
            longitude - deltaLon,
            latitude + deltaLat,
            longitude + deltaLon,
            latitude - deltaLat
        ].join(',');

        const consultas = [
            'pet shop',
            'petshop',
            'pet shop veterinário',
            'veterinário',
            'clínica veterinária'
        ];

        const resultados = [];

        for (const termo of consultas) {
            const url = new URL('https://nominatim.openstreetmap.org/search');
            url.searchParams.set('format', 'jsonv2');
            url.searchParams.set('q', termo);
            url.searchParams.set('viewbox', viewbox);
            url.searchParams.set('bounded', '1');
            url.searchParams.set('limit', '25');
            url.searchParams.set('countrycodes', 'br');
            url.searchParams.set('addressdetails', '1');

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);

            try {
                const resposta = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Language': 'pt-BR',
                        'User-Agent': 'Taxi-Dog/1.0 (petshop locator)'
                    },
                    signal: controller.signal
                });

                if (!resposta.ok) continue;
                const dados = await resposta.json();
                if (Array.isArray(dados)) resultados.push(...dados);
            } finally {
                clearTimeout(timer);
            }
        }

        const vistos = new Set();
        const elements = [];

        for (const item of resultados) {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

            const chave = `${lat.toFixed(6)},${lon.toFixed(6)}`;
            if (vistos.has(chave)) continue;
            vistos.add(chave);

            const tags = {};
            if (item.name) tags.name = item.name;
            if (item.type === 'veterinary' || /veterin/i.test(item.display_name || '')) {
                tags.amenity = 'veterinary';
            } else {
                tags.shop = 'pet';
            }
            if (item.address?.road) tags['addr:street'] = item.address.road;
            if (item.address?.house_number) tags['addr:housenumber'] = item.address.house_number;

            elements.push({ type: 'node', lat, lon, tags });
        }

        return { elements };
    }

    try {
        let dados;

        try {
            dados = await Promise.any(servidores.map(consultarOverpass));
        } catch (overpassError) {
            console.warn(
                'Overpass indisponível; tentando fallback do Nominatim:',
                overpassError?.errors?.map(error => error.message) || overpassError?.message
            );
            dados = await consultarNominatim();
        }

        // Mesmo quando o serviço responde corretamente, evita dados antigos ou inválidos.
        dados.elements = (dados.elements || []).filter(elemento => {
            const lat = Number(elemento.lat ?? elemento.center?.lat);
            const lon = Number(elemento.lon ?? elemento.center?.lon);
            return Number.isFinite(lat) && Number.isFinite(lon);
        });

        cacheLocais.set(chaveCache, { dados, timestamp: Date.now() });
        while (cacheLocais.size > 100) {
            cacheLocais.delete(cacheLocais.keys().next().value);
        }

        res.set('Cache-Control', 'public, max-age=300');
        return res.json(dados);
    } catch (error) {
        console.error('Falha na busca de locais próximos:', error?.message || error);
        return res.status(503).json({
            error: 'Os serviços de mapas estão temporariamente indisponíveis.'
        });
    }
});

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