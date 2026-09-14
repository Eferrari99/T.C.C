/* ==========================================
   VARIÁVEIS
========================================== */

let latitudeAtual = null;

let longitudeAtual = null;

let mapa;

let marcadorUsuario;

let circuloBusca;

let marcadoresLocais = [];

let timerBusca;



/* ==========================================
   ELEMENTOS HTML
========================================== */

const input =
    document.getElementById("inputlocal");

const sugestoes =
    document.getElementById("sugestoes");

const status =
    document.getElementById("statusLocalizacao");

const listaLocais =
    document.getElementById("listaLocais");

const btnLocalizacao =
    document.getElementById("btnLocalizacao");

const btnConfirmar =
    document.getElementById("btnConfirmar");



/* ==========================================
   INICIAR MAPA
========================================== */

mapa = L.map("mapa").setView(
    [-23.5505, -46.6333],
    13
);



/* ==========================================
   MAPA OPENSTREETMAP
========================================== */

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

        attribution:
            '&copy; OpenStreetMap contributors'

    }
).addTo(mapa);



/* ==========================================
   ATUALIZAR MAPA
========================================== */

function atualizarMapa(lat, lon) {


    /* Remove marcador antigo */

    if (marcadorUsuario) {

        mapa.removeLayer(
            marcadorUsuario
        );

    }


    /* Remove círculo antigo */

    if (circuloBusca) {

        mapa.removeLayer(
            circuloBusca
        );

    }


    /* Cria novo marcador */

    marcadorUsuario =
        L.marker([lat, lon])
        .addTo(mapa)
        .bindPopup(
            "<b>📍 Sua localização</b>"
        )
        .openPopup();


    /* Cria círculo de busca */

    circuloBusca =
        L.circle(
            [lat, lon],
            {

                radius: 5000,

                color: "#d60000",

                fillOpacity: 0.08

            }
        )
        .addTo(mapa);


    /* Centraliza mapa */

    mapa.setView(
        [lat, lon],
        14
    );

}



/* ==========================================
   DIGITAÇÃO DO ENDEREÇO
========================================== */

input.addEventListener(
    "input",
    function () {


        clearTimeout(timerBusca);


        const texto =
            input.value.trim();


        /* Limpa se tiver poucos caracteres */

        if (texto.length < 3) {

            sugestoes.innerHTML = "";

            return;

        }


        /* Espera 500ms antes de pesquisar */

        timerBusca =
            setTimeout(
                function () {

                    buscarEnderecos(texto);

                },
                500
            );

    }
);



/* ==========================================
   BUSCAR ENDEREÇOS
========================================== */

async function buscarEnderecos(texto) {


    sugestoes.innerHTML = `

        <div class="sugestao">

            <i class="bi bi-hourglass-split"></i>

            Procurando endereço...

        </div>

    `;


    try {


        const url =

            "https://nominatim.openstreetmap.org/search" +

            "?format=json" +

            "&addressdetails=1" +

            "&limit=5" +

            "&countrycodes=br" +

            "&q=" +

            encodeURIComponent(texto);


        const resposta =
            await fetch(
                url,
                {

                    headers: {

                        "Accept-Language":
                            "pt-BR"

                    }

                }
            );


        const dados =
            await resposta.json();


        sugestoes.innerHTML = "";


        /* Nenhum resultado */

        if (dados.length === 0) {

            sugestoes.innerHTML = `

                <div class="sugestao">

                    Nenhum endereço encontrado.

                </div>

            `;

            return;

        }


        /* Cria as sugestões */

        dados.forEach(
            function (local) {


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "sugestao";


                div.innerHTML = `

                    <i class="bi bi-geo-alt-fill"></i>

                    ${local.display_name}

                `;


                div.addEventListener(
                    "click",
                    function () {

                        selecionarEndereco(
                            local
                        );

                    }
                );


                sugestoes.appendChild(div);

            }
        );


    }
    catch (erro) {


        sugestoes.innerHTML = `

            <div class="sugestao">

                Não foi possível buscar o endereço.

            </div>

        `;

    }

}



/* ==========================================
   SELECIONAR ENDEREÇO
========================================== */

function selecionarEndereco(local) {


    latitudeAtual =
        parseFloat(local.lat);


    longitudeAtual =
        parseFloat(local.lon);


    input.value =
        local.display_name;


    sugestoes.innerHTML = "";


    status.innerHTML = `

        <i class="bi bi-check-circle-fill"></i>

        Localização selecionada.

    `;


    /* Atualiza mapa */

    atualizarMapa(
        latitudeAtual,
        longitudeAtual
    );

}



/* ==========================================
   BOTÃO GPS
========================================== */

btnLocalizacao.addEventListener(
    "click",
    function () {


        /* Verifica suporte */

        if (!navigator.geolocation) {

            status.innerHTML = `

                Seu navegador não suporta
                localização.

            `;

            return;

        }


        status.innerHTML = `

            <i class="bi bi-hourglass-split"></i>

            Obtendo sua localização...

        `;


        /* Solicita localização */

        navigator.geolocation.getCurrentPosition(

            function (posicao) {


                latitudeAtual =
                    posicao.coords.latitude;


                longitudeAtual =
                    posicao.coords.longitude;


                /* Atualiza mapa */

                atualizarMapa(
                    latitudeAtual,
                    longitudeAtual
                );


                status.innerHTML = `

                    <i class="bi bi-check-circle-fill"></i>

                    Localização atual encontrada.

                `;


                /* Busca endereço */

                obterEnderecoAtual();

            },


            function () {


                status.innerHTML = `

                    Não foi possível acessar sua
                    localização.

                    Verifique a permissão do navegador.

                `;

            },

            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0

            }

        );

    }
);



/* ==========================================
   OBTER ENDEREÇO DO GPS
========================================== */

async function obterEnderecoAtual() {


    try {


        const url =

            "https://nominatim.openstreetmap.org/reverse" +

            "?format=json" +

            "&lat=" +
            latitudeAtual +

            "&lon=" +
            longitudeAtual +

            "&zoom=18";


        const resposta =
            await fetch(url);


        const dados =
            await resposta.json();


        if (dados.display_name) {

            input.value =
                dados.display_name;

        }


    }
    catch (erro) {


        input.value =
            "Minha localização atual";

    }

}



/* ==========================================
   CONFIRMAR LOCALIZAÇÃO
========================================== */

btnConfirmar.addEventListener(
    "click",
    function () {


        /* Verifica se existe localização */

        if (
            latitudeAtual === null ||
            longitudeAtual === null
        ) {


            status.innerHTML = `

                <i class="bi bi-exclamation-circle"></i>

                Primeiro escolha um endereço
                ou use sua localização.

            `;


            return;

        }


        status.innerHTML = `

            <i class="bi bi-hourglass-split"></i>

            Procurando atendimento próximo...

        `;


        buscarLocaisProximos();

    }
);



/* ==========================================
   BUSCAR PETSHOPS E CLÍNICAS
========================================== */

async function buscarLocaisProximos() {


    listaLocais.innerHTML = `

        <div class="mensagem-inicial">

            <i class="bi bi-hourglass-split"></i>

            <p>

                Procurando estabelecimentos próximos...

            </p>

        </div>

    `;


    /* Raio de 5 quilômetros */

    const raio = 5000;


    /*
        Consulta do OpenStreetMap.

        veterinary = clínica veterinária

        pet = petshop
    */

    const query = `

        [out:json];

        (

            node["amenity"="veterinary"](
                around:${raio},
                ${latitudeAtual},
                ${longitudeAtual}
            );

            way["amenity"="veterinary"](
                around:${raio},
                ${latitudeAtual},
                ${longitudeAtual}
            );

            node["shop"="pet"](
                around:${raio},
                ${latitudeAtual},
                ${longitudeAtual}
            );

            way["shop"="pet"](
                around:${raio},
                ${latitudeAtual},
                ${longitudeAtual}
            );

        );

        out center;

    `;


    try {


        const resposta =
            await fetch(
                "https://overpass-api.de/api/interpreter",
                {

                    method: "POST",

                    body: query

                }
            );


        const dados =
            await resposta.json();


        let locais = [];


        /* Percorre os estabelecimentos */

        dados.elements.forEach(
            function (local) {


                let lat =
                    local.lat;


                let lon =
                    local.lon;


                /*
                    Algumas informações do mapa
                    são armazenadas como "way".
                */

                if (local.center) {

                    lat =
                        local.center.lat;

                    lon =
                        local.center.lon;

                }


                /* Ignora locais sem coordenadas */

                if (
                    !lat ||
                    !lon
                ) {

                    return;

                }


                /* Nome */

                const nome =

                    local.tags?.name ||

                    "Estabelecimento veterinário";


                /* Tipo */

                const tipo =

                    local.tags?.amenity ===
                    "veterinary"

                    ? "Clínica veterinária"

                    : "Petshop";


                /* Distância */

                const distancia =

                    calcularDistancia(

                        latitudeAtual,

                        longitudeAtual,

                        lat,

                        lon

                    );


                /* Endereço */

                const endereco =

                    local.tags?.["addr:street"] ||

                    "Endereço não informado";


                /* Adiciona à lista */

                locais.push({

                    nome,

                    tipo,

                    lat,

                    lon,

                    distancia,

                    endereco

                });

            }
        );


        /* Ordena pelo mais próximo */

        locais.sort(
            function (a, b) {

                return (
                    a.distancia -
                    b.distancia
                );

            }
        );


        /* Mostra no site */

        mostrarLocais(locais);


        /* Mostra no mapa */

        mostrarLocaisNoMapa(locais);


        status.innerHTML = `

            <i class="bi bi-check-circle-fill"></i>

            Localização confirmada.

        `;


    }
    catch (erro) {


        listaLocais.innerHTML = `

            <div class="mensagem-inicial">

                <i class="bi bi-wifi-off"></i>

                <p>

                    Não foi possível buscar os
                    estabelecimentos.

                    Verifique sua conexão com a internet.

                </p>

            </div>

        `;

    }

}



/* ==========================================
   CALCULAR DISTÂNCIA
========================================== */

function calcularDistancia(
    lat1,
    lon1,
    lat2,
    lon2
) {


    const R =
        6371;


    const dLat =

        (lat2 - lat1) *

        Math.PI /

        180;


    const dLon =

        (lon2 - lon1) *

        Math.PI /

        180;


    const a =

        Math.sin(dLat / 2) *

        Math.sin(dLat / 2) +

        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *

        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *

        Math.sin(dLon / 2) *

        Math.sin(dLon / 2);


    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );


    return R * c;

}



/* ==========================================
   MOSTRAR ESTABELECIMENTOS NOS CARDS
========================================== */

function mostrarLocais(locais) {


    listaLocais.innerHTML = "";


    /* Nenhum estabelecimento */

    if (locais.length === 0) {


        listaLocais.innerHTML = `

            <div class="mensagem-inicial">

                <i class="bi bi-search"></i>

                <p>

                    Não encontramos clínicas ou
                    petshops próximos dessa localização.

                </p>

            </div>

        `;


        return;

    }


    /*
        Mostra no máximo 10 resultados.
    */

    locais
        .slice(0, 10)
        .forEach(
            function (local) {


                /* Formata distância */

                const distancia =

                    local.distancia < 1

                    ?

                    Math.round(
                        local.distancia *
                        1000
                    )
                    + " metros"

                    :

                    local.distancia
                        .toFixed(1)
                    + " km";


                /* Link do Google Maps */

                const rota =

                    "https://www.google.com/maps/dir/?api=1" +

                    "&destination=" +

                    local.lat +

                    "," +

                    local.lon;


                /* Cria card */

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "card-local";


                /* Conteúdo */

                card.innerHTML = `

                    <span class="tipo-local">

                        ${local.tipo}

                    </span>


                    <h3>

                        <i class="bi bi-hospital"></i>

                        ${local.nome}

                    </h3>


                    <div class="endereco">

                        <i class="bi bi-geo-alt"></i>

                        ${local.endereco}

                    </div>


                    <div class="distancia">

                        <i class="bi bi-signpost-2"></i>

                        ${distancia}

                    </div>


                    <a
                        class="btn-rota"
                        href="${rota}"
                        target="_blank"
                    >

                        <i class="bi bi-map"></i>

                        Ver rota

                    </a>

                `;


                listaLocais.appendChild(
                    card
                );

            }
        );

}



/* ==========================================
   MOSTRAR LOCAIS NO MAPA
========================================== */

function mostrarLocaisNoMapa(locais) {


    /* Remove marcadores antigos */

    marcadoresLocais.forEach(
        function (marcador) {

            mapa.removeLayer(
                marcador
            );

        }
    );


    marcadoresLocais = [];


    /*
        Mostra os 20 primeiros
        estabelecimentos no mapa.
    */

    locais
        .slice(0, 20)
        .forEach(
            function (local) {


                let icone;


                if (
                    local.tipo ===
                    "Clínica veterinária"
                ) {

                    icone =
                        "🏥";

                }
                else {

                    icone =
                        "🐶";

                }


                const marcador =
                    L.marker(
                        [
                            local.lat,
                            local.lon
                        ]
                    )
                    .addTo(mapa);


                marcador.bindPopup(`

                    <strong>
                        ${icone}
                        ${local.nome}
                    </strong>

                    <br>

                    ${local.tipo}

                    <br><br>

                    ${local.distancia.toFixed(1)}
                    km de distância

                `);


                marcadoresLocais.push(
                    marcador
                );

            }
        );

}