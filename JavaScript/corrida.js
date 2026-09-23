/* =====================================================
   TAXI-DOG
   SISTEMA DE SOLICITAÇÃO DE CORRIDA
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =================================================
       ELEMENTOS
    ================================================= */

    const pet = document.getElementById("pet");
    const origem = document.getElementById("origem");
    const buscarEndereco = document.getElementById("buscarEndereco");
    const usarLocal = document.getElementById("usarLocal");
    const sugestoes = document.getElementById("sugestoes");
    const mapaElemento = document.getElementById("mapa");
    const mensagemLocal = document.getElementById("mensagemLocal");
    const petshop = document.getElementById("petshop");
    const distanciaPetshop = document.getElementById("distanciaPetshop");
    const data = document.getElementById("data");
    const horario = document.getElementById("horario");
    const tipo = document.getElementById("tipo");
    const observacoes = document.getElementById("observacoes");
    const solicitarCorrida = document.getElementById("solicitarCorrida");
    const mensagemSolicitacao =
        document.getElementById("mensagemSolicitacao");


    /* =================================================
       RESUMO
    ================================================= */

    const resumoPet = document.getElementById("resumoPet");
    const resumoOrigem = document.getElementById("resumoOrigem");
    const resumoPetshop = document.getElementById("resumoPetshop");
    const resumoData = document.getElementById("resumoData");
    const resumoHorario = document.getElementById("resumoHorario");
    const resumoTipo = document.getElementById("resumoTipo");
    const valorCorrida = document.getElementById("valorCorrida");


    /* =================================================
       VARIÁVEIS
    ================================================= */

    let mapa = null;
    let marcadorUsuario = null;
    let circuloBusca = null;
    let marcadoresPetshops = [];

    let latitudeAtual = null;
    let longitudeAtual = null;

    let temporizadorBusca = null;


    /* =================================================
       MENSAGENS
    ================================================= */

    function mostrarMensagem(texto) {

        if (mensagemLocal) {
            mensagemLocal.textContent = texto;
        }

    }


    function mostrarMensagemSolicitacao(texto) {

        if (mensagemSolicitacao) {
            mensagemSolicitacao.textContent = texto;
        }

    }


    /* =================================================
       VERIFICA LEAFLET
    ================================================= */

    if (typeof L === "undefined") {

        console.error("Leaflet não foi carregado.");

        mostrarMensagem(
            "Erro ao carregar o mapa. Verifique sua conexão com a internet."
        );

        return;
    }


    /* =================================================
       INICIA MAPA
    ================================================= */

    function iniciarMapa() {

        if (!mapaElemento) {
            return;
        }

        try {

            mapa = L.map("mapa");

            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            ).addTo(mapa);

            mapa.setView(
                [-23.5505, -46.6333],
                12
            );

            setTimeout(function () {

                if (mapa) {
                    mapa.invalidateSize();
                }

            }, 500);

        } catch (erro) {

            console.error(
                "Erro ao iniciar mapa:",
                erro
            );

            mostrarMensagem(
                "Não foi possível iniciar o mapa."
            );
        }
    }


    /* =================================================
       MOSTRAR LOCAL NO MAPA
    ================================================= */

    function mostrarLocalNoMapa(latitude, longitude) {

        if (!mapa) {
            return;
        }

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            isNaN(latitude) ||
            isNaN(longitude)
        ) {
            return;
        }


        /* Remove marcador anterior */

        if (marcadorUsuario) {

            mapa.removeLayer(
                marcadorUsuario
            );

        }


        /* Cria marcador */

        marcadorUsuario = L.marker(
            [
                latitude,
                longitude
            ]
        )
            .addTo(mapa)
            .bindPopup(
                "<strong>Local da corrida</strong>"
            );


        /* Remove círculo anterior */

        if (circuloBusca) {

            mapa.removeLayer(
                circuloBusca
            );

        }


        /* Cria círculo */

        circuloBusca = L.circle(
            [
                latitude,
                longitude
            ],
            {
                radius: 5000
            }
        ).addTo(mapa);


        /* Centraliza mapa */

        mapa.setView(
            [
                latitude,
                longitude
            ],
            15
        );

    }


    /* =================================================
       BUSCAR ENDEREÇO
    ================================================= */

    async function procurarEndereco(endereco) {

        if (!endereco || endereco.length < 3) {

            mostrarMensagem(
                "Digite pelo menos 3 caracteres."
            );

            return;
        }


        mostrarMensagem(
            "Procurando endereço..."
        );


        if (sugestoes) {

            sugestoes.innerHTML =
                '<div class="sugestao">' +
                '<i class="bi bi-search"></i>' +
                ' Procurando endereço...' +
                '</div>';

        }


        try {

            const url =
                "https://nominatim.openstreetmap.org/search" +
                "?format=json" +
                "&q=" +
                encodeURIComponent(endereco) +
                "&limit=5" +
                "&countrycodes=br" +
                "&addressdetails=1";


            const resposta = await fetch(url, {
                headers: {
                    "Accept": "application/json"
                }
            });


            if (!resposta.ok) {

                throw new Error(
                    "Erro HTTP " + resposta.status
                );

            }


            const resultados =
                await resposta.json();


            if (sugestoes) {
                sugestoes.innerHTML = "";
            }


            if (
                !resultados ||
                resultados.length === 0
            ) {

                mostrarMensagem(
                    "Nenhum endereço encontrado."
                );

                return;
            }


            resultados.forEach(function (resultado) {

                const div =
                    document.createElement("div");

                div.className = "sugestao";


                const icone =
                    document.createElement("i");

                icone.className =
                    "bi bi-geo-alt-fill";


                div.appendChild(icone);

                div.appendChild(
                    document.createTextNode(
                        " " + resultado.display_name
                    )
                );


                div.addEventListener(
                    "click",
                    function () {

                        selecionarEndereco(
                            resultado
                        );

                    }
                );


                if (sugestoes) {

                    sugestoes.appendChild(
                        div
                    );

                }

            });


            mostrarMensagem(
                "Selecione um dos endereços encontrados."
            );


        } catch (erro) {

            console.error(
                "Erro ao procurar endereço:",
                erro
            );

            mostrarMensagem(
                "Não foi possível buscar o endereço."
            );

        }

    }


    /* =================================================
       SELECIONAR ENDEREÇO
    ================================================= */

    function selecionarEndereco(resultado) {

        latitudeAtual =
            parseFloat(resultado.lat);

        longitudeAtual =
            parseFloat(resultado.lon);


        if (
            isNaN(latitudeAtual) ||
            isNaN(longitudeAtual)
        ) {

            mostrarMensagem(
                "O endereço encontrado possui coordenadas inválidas."
            );

            return;
        }


        if (origem) {

            origem.value =
                resultado.display_name;

        }


        if (sugestoes) {

            sugestoes.innerHTML = "";

        }


        mostrarLocalNoMapa(
            latitudeAtual,
            longitudeAtual
        );


        mostrarMensagem(
            "Endereço localizado com sucesso."
        );


        atualizarResumo();


        buscarPetshops(
            latitudeAtual,
            longitudeAtual
        );

    }


    /* =================================================
       BOTÃO BUSCAR ENDEREÇO
    ================================================= */

    if (buscarEndereco) {

        buscarEndereco.addEventListener(
            "click",
            function () {

                if (!origem) {
                    return;
                }


                const endereco =
                    origem.value.trim();


                if (!endereco) {

                    mostrarMensagem(
                        "Digite um endereço primeiro."
                    );

                    origem.focus();

                    return;
                }


                procurarEndereco(
                    endereco
                );

            }
        );

    }


    /* =================================================
       BUSCA AUTOMÁTICA
    ================================================= */

    if (origem) {

        origem.addEventListener(
            "input",
            function () {

                clearTimeout(
                    temporizadorBusca
                );


                const texto =
                    origem.value.trim();


                if (texto.length < 3) {

                    if (sugestoes) {
                        sugestoes.innerHTML = "";
                    }

                    return;
                }


                temporizadorBusca =
                    setTimeout(
                        function () {

                            procurarEndereco(
                                texto
                            );

                        },
                        800
                    );

            }
        );

    }


    /* =================================================
       GEOLOCALIZAÇÃO
    ================================================= */

    if (usarLocal) {

        usarLocal.addEventListener(
            "click",
            function () {

                if (!navigator.geolocation) {

                    mostrarMensagem(
                        "Seu navegador não possui suporte à localização."
                    );

                    return;
                }


                mostrarMensagem(
                    "Obtendo sua localização..."
                );


                usarLocal.disabled = true;


                navigator.geolocation.getCurrentPosition(

                    async function (posicao) {

                        latitudeAtual =
                            posicao.coords.latitude;

                        longitudeAtual =
                            posicao.coords.longitude;


                        mostrarLocalNoMapa(
                            latitudeAtual,
                            longitudeAtual
                        );


                        mostrarMensagem(
                            "Localização encontrada. Buscando endereço..."
                        );


                        await obterEnderecoGPS(
                            latitudeAtual,
                            longitudeAtual
                        );


                        buscarPetshops(
                            latitudeAtual,
                            longitudeAtual
                        );


                        usarLocal.disabled = false;

                    },


                    function (erro) {

                        console.error(
                            "Erro GPS:",
                            erro
                        );


                        usarLocal.disabled = false;


                        if (erro.code === 1) {

                            mostrarMensagem(
                                "Permissão de localização recusada."
                            );

                        } else if (erro.code === 2) {

                            mostrarMensagem(
                                "Não foi possível encontrar sua localização."
                            );

                        } else if (erro.code === 3) {

                            mostrarMensagem(
                                "A localização demorou demais para responder."
                            );

                        } else {

                            mostrarMensagem(
                                "Erro ao obter localização."
                            );

                        }

                    },

                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }

                );

            }
        );

    }


    /* =================================================
       ENDEREÇO PELO GPS
    ================================================= */

    async function obterEnderecoGPS(
        latitude,
        longitude
    ) {

        try {

            const url =
                "https://nominatim.openstreetmap.org/reverse" +
                "?format=json" +
                "&lat=" +
                latitude +
                "&lon=" +
                longitude +
                "&zoom=18" +
                "&addressdetails=1";


            const resposta =
                await fetch(url, {
                    headers: {
                        "Accept": "application/json"
                    }
                });


            if (!resposta.ok) {

                throw new Error(
                    "Erro no reverse geocoding."
                );

            }


            const resultado =
                await resposta.json();


            if (
                resultado &&
                resultado.display_name
            ) {

                if (origem) {

                    origem.value =
                        resultado.display_name;

                }


                mostrarMensagem(
                    "Localização atual encontrada."
                );


                atualizarResumo();

            } else {

                mostrarMensagem(
                    "Localização encontrada, mas o endereço não foi identificado."
                );

            }


        } catch (erro) {

            console.error(
                "Erro ao obter endereço:",
                erro
            );

            mostrarMensagem(
                "Localização encontrada, mas não foi possível obter o endereço."
            );

        }

    }


    /* =================================================
       CALCULAR DISTÂNCIA
    ================================================= */

    function calcularDistancia(
        lat1,
        lon1,
        lat2,
        lon2
    ) {

        const R = 6371;


        const dLat =
            (lat2 - lat1) *
            Math.PI / 180;


        const dLon =
            (lon2 - lon1) *
            Math.PI / 180;


        const a =
            Math.sin(dLat / 2) *
            Math.sin(dLat / 2) +

            Math.cos(
                lat1 * Math.PI / 180
            ) *

            Math.cos(
                lat2 * Math.PI / 180
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


    /* =================================================
       LIMPAR MARCADORES
    ================================================= */

    function limparMarcadores() {

        marcadoresPetshops.forEach(
            function (marcador) {

                if (mapa) {

                    mapa.removeLayer(
                        marcador
                    );

                }

            }
        );


        marcadoresPetshops = [];

    }


    /* =================================================
       BUSCAR PETSHOPS / VETERINÁRIOS
    ================================================= */

    async function buscarPetshops(
        latitude,
        longitude
    ) {

        if (
            latitude === null ||
            longitude === null
        ) {

            return;

        }


        if (petshop) {

            petshop.disabled = true;

            petshop.innerHTML =
                '<option value="">' +
                'Procurando locais próximos...' +
                '</option>';

        }


        if (distanciaPetshop) {

            distanciaPetshop.textContent =
                "Procurando estabelecimentos próximos...";

        }


        limparMarcadores();


        try {

            const raio = 5000;


            const consulta = `
                [out:json][timeout:25];

                (
                    node["shop"="pet"]
                    (around:${raio},${latitude},${longitude});

                    way["shop"="pet"]
                    (around:${raio},${latitude},${longitude});

                    node["amenity"="veterinary"]
                    (around:${raio},${latitude},${longitude});

                    way["amenity"="veterinary"]
                    (around:${raio},${latitude},${longitude});
                );

                out center;
            `;


            const url =
                "https://overpass-api.de/api/interpreter?data=" +
                encodeURIComponent(consulta);


            const resposta =
                await fetch(url);


            if (!resposta.ok) {

                throw new Error(
                    "Erro ao consultar Overpass."
                );

            }


            const dados =
                await resposta.json();


            const locais = [];


            dados.elements.forEach(
                function (elemento) {

                    let lat =
                        elemento.lat;

                    let lon =
                        elemento.lon;


                    if (elemento.center) {

                        lat =
                            elemento.center.lat;

                        lon =
                            elemento.center.lon;

                    }


                    if (
                        typeof lat !== "number" ||
                        typeof lon !== "number"
                    ) {

                        return;

                    }


                    const tags =
                        elemento.tags || {};


                    const nome =
                        tags.name ||
                        "Estabelecimento para pets";


                    const distancia =
                        calcularDistancia(
                            latitude,
                            longitude,
                            lat,
                            lon
                        );


                    const categoria =
                        tags.amenity === "veterinary"
                            ? "Clínica veterinária"
                            : "Pet shop";


                    locais.push({

                        nome: nome,

                        latitude: lat,

                        longitude: lon,

                        distancia: distancia,

                        categoria: categoria

                    });

                }
            );


            locais.sort(
                function (a, b) {

                    return (
                        a.distancia -
                        b.distancia
                    );

                }
            );


            preencherPetshops(
                locais
            );


            mostrarPetshopsNoMapa(
                locais
            );


        } catch (erro) {

            console.error(
                "Erro ao buscar petshops:",
                erro
            );


            if (petshop) {

                petshop.disabled = false;

                petshop.innerHTML =
                    '<option value="">' +
                    'Não foi possível buscar os locais' +
                    '</option>';

            }


            if (distanciaPetshop) {

                distanciaPetshop.textContent =
                    "Não foi possível buscar estabelecimentos próximos.";

            }

        }

    }


    /* =================================================
       PREENCHER PETSHOPS
    ================================================= */

    function preencherPetshops(locais) {

        if (!petshop) {
            return;
        }


        petshop.innerHTML = "";


        if (locais.length === 0) {

            petshop.innerHTML =
                '<option value="">' +
                'Nenhum local encontrado em até 5 km' +
                '</option>';


            petshop.disabled = false;


            if (distanciaPetshop) {

                distanciaPetshop.textContent =
                    "Nenhum pet shop ou clínica veterinária foi encontrado próximo ao endereço.";

            }


            atualizarResumo();

            return;
        }


        locais.forEach(
            function (local, indice) {

                const option =
                    document.createElement("option");


                option.value =
                    local.nome;


                option.textContent =
                    local.nome +
                    " — " +
                    local.distancia.toFixed(2) +
                    " km";


                option.dataset.latitude =
                    local.latitude;


                option.dataset.longitude =
                    local.longitude;


                option.dataset.distancia =
                    local.distancia;


                option.dataset.categoria =
                    local.categoria;


                petshop.appendChild(
                    option
                );


                if (indice === 0) {

                    option.selected = true;

                }

            }
        );


        petshop.disabled = false;


        const maisProximo =
            locais[0];


        if (distanciaPetshop) {

            distanciaPetshop.textContent =
                "Mais próximo: " +
                maisProximo.nome +
                " — " +
                maisProximo.distancia.toFixed(2) +
                " km";

        }


        atualizarResumo();

    }


    /* =================================================
       MARCADORES DOS PETSHOPS
    ================================================= */

    function mostrarPetshopsNoMapa(locais) {

        if (!mapa) {
            return;
        }


        locais.forEach(
            function (local) {

                const marcador =
                    L.marker(
                        [
                            local.latitude,
                            local.longitude
                        ]
                    )
                    .addTo(mapa);


                marcador.bindPopup(
                    "<strong>" +
                    escaparHTML(local.nome) +
                    "</strong><br>" +
                    escaparHTML(local.categoria) +
                    "<br>" +
                    local.distancia.toFixed(2) +
                    " km"
                );


                marcadoresPetshops.push(
                    marcador
                );

            }
        );

    }


    /* =================================================
       ESCAPAR HTML
    ================================================= */

    function escaparHTML(texto) {

        const div =
            document.createElement("div");


        div.textContent =
            texto;


        return div.innerHTML;

    }


    /* =================================================
       PETSHOP ALTERADO
    ================================================= */

    if (petshop) {

        petshop.addEventListener(
            "change",
            function () {

                const option =
                    petshop.options[
                        petshop.selectedIndex
                    ];


                if (!option) {
                    return;
                }


                const lat =
                    parseFloat(
                        option.dataset.latitude
                    );


                const lon =
                    parseFloat(
                        option.dataset.longitude
                    );


                const distancia =
                    parseFloat(
                        option.dataset.distancia
                    );


                if (
                    !isNaN(lat) &&
                    !isNaN(lon) &&
                    mapa
                ) {

                    mapa.setView(
                        [
                            lat,
                            lon
                        ],
                        15
                    );


                    marcadoresPetshops.forEach(
                        function (marcador) {

                            const posicao =
                                marcador.getLatLng();


                            if (
                                Math.abs(
                                    posicao.lat - lat
                                ) < 0.000001 &&

                                Math.abs(
                                    posicao.lng - lon
                                ) < 0.000001
                            ) {

                                marcador.openPopup();

                            }

                        }
                    );

                }


                if (
                    distanciaPetshop &&
                    !isNaN(distancia)
                ) {

                    distanciaPetshop.textContent =
                        "Distância: " +
                        distancia.toFixed(2) +
                        " km";

                }


                atualizarResumo();

            }
        );

    }


    /* =================================================
       ATUALIZAR RESUMO
    ================================================= */

    function atualizarResumo() {

        if (resumoPet) {

            resumoPet.textContent =
                pet && pet.value
                    ? pet.options[
                        pet.selectedIndex
                    ].text
                    : "Não informado";

        }


        if (resumoOrigem) {

            resumoOrigem.textContent =
                origem &&
                origem.value.trim()
                    ? origem.value
                    : "Não informado";

        }


        if (resumoPetshop) {

            resumoPetshop.textContent =
                petshop &&
                petshop.value
                    ? petshop.options[
                        petshop.selectedIndex
                    ].text
                    : "Não informado";

        }


        if (resumoData) {

            resumoData.textContent =
                data && data.value
                    ? formatarData(data.value)
                    : "Não informada";

        }


        if (resumoHorario) {

            resumoHorario.textContent =
                horario &&
                horario.value
                    ? horario.value
                    : "Não informado";

        }


        if (resumoTipo) {

            resumoTipo.textContent =
                tipo && tipo.value
                    ? tipo.options[
                        tipo.selectedIndex
                    ].text
                    : "Não informado";

        }


        calcularValor();

    }


    /* =================================================
       FORMATAR DATA
    ================================================= */

    function formatarData(dataOriginal) {

        const partes =
            dataOriginal.split("-");


        if (partes.length !== 3) {

            return dataOriginal;

        }


        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );

    }


    /* =================================================
       CALCULAR VALOR
    ================================================= */

    function calcularValor() {

        let valor = 15;


        if (
            petshop &&
            petshop.value
        ) {

            valor += 10;

        }


        if (
            tipo &&
            tipo.value
        ) {

            if (
                tipo.value === "Veterinário"
            ) {

                valor += 5;

            }


            if (
                tipo.value === "Banho e tosa"
            ) {

                valor += 3;

            }

        }


        if (valorCorrida) {

            valorCorrida.textContent =
                "R$ " +
                valor
                    .toFixed(2)
                    .replace(".", ",");

        }


        return valor;

    }


    /* =================================================
       EVENTOS DO FORMULÁRIO
    ================================================= */

    if (pet) {

        pet.addEventListener(
            "change",
            atualizarResumo
        );

    }


    if (data) {

        data.addEventListener(
            "change",
            atualizarResumo
        );

    }


    if (horario) {

        horario.addEventListener(
            "change",
            atualizarResumo
        );

    }


    if (tipo) {

        tipo.addEventListener(
            "change",
            atualizarResumo
        );

    }


    if (observacoes) {

        observacoes.addEventListener(
            "input",
            atualizarResumo
        );

    }


    /* =================================================
       SOLICITAR CORRIDA
    ================================================= */

    if (solicitarCorrida) {

        solicitarCorrida.addEventListener(
            "click",
            function () {

                mostrarMensagemSolicitacao("");


                if (!pet.value) {

                    mostrarMensagemSolicitacao(
                        "Selecione um pet."
                    );

                    pet.focus();

                    return;

                }


                if (
                    !origem.value.trim()
                ) {

                    mostrarMensagemSolicitacao(
                        "Informe o endereço de origem."
                    );

                    origem.focus();

                    return;

                }


                if (
                    !petshop.value
                ) {

                    mostrarMensagemSolicitacao(
                        "Selecione o destino."
                    );

                    petshop.focus();

                    return;

                }


                if (
                    !data.value
                ) {

                    mostrarMensagemSolicitacao(
                        "Selecione a data."
                    );

                    data.focus();

                    return;

                }


                if (
                    !horario.value
                ) {

                    mostrarMensagemSolicitacao(
                        "Selecione o horário."
                    );

                    horario.focus();

                    return;

                }


                if (
                    !tipo.value
                ) {

                    mostrarMensagemSolicitacao(
                        "Selecione o tipo de serviço."
                    );

                    tipo.focus();

                    return;

                }


                const valor =
                    calcularValor();


                mostrarMensagemSolicitacao(
                    "Corrida solicitada com sucesso! " +
                    "Valor estimado: R$ " +
                    valor
                        .toFixed(2)
                        .replace(".", ",") +
                    "."
                );

            }
        );

    }


    /* =================================================
       DATA MÍNIMA
    ================================================= */

    if (data) {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");


        const dia =
            String(
                hoje.getDate()
            ).padStart(2, "0");


        data.min =
            ano +
            "-" +
            mes +
            "-" +
            dia;

    }


    /* =================================================
       FECHAR SUGESTÕES
    ================================================= */

    document.addEventListener(
        "click",
        function (evento) {

            if (
                sugestoes &&
                origem &&
                evento.target !== origem &&
                !sugestoes.contains(
                    evento.target
                ) &&
                evento.target !== buscarEndereco
            ) {

                sugestoes.innerHTML = "";

            }

        }
    );


    /* =================================================
       INICIALIZAÇÃO
    ================================================= */

    iniciarMapa();

    atualizarResumo();


    console.log(
        "Taxi-Dog: corrida carregada corretamente."
    );

});