
/* =====================================================
   TAXI-DOG
   SOS2 - SOLICITAÇÃO DE SOCORRO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =================================================
           ELEMENTOS
        ================================================= */

        const pet =
            document.getElementById("pet");

        const origem =
            document.getElementById("origem");

        const destino =
            document.getElementById("destino");

        const tipoDestino =
            document.getElementById("tipoDestino");

        const mapaElemento =
            document.getElementById("mapa");

        const solicitarCorrida =
            document.getElementById("solicitarCorrida");

        const mensagemSolicitacao =
            document.getElementById("mensagemSolicitacao");

        const valorCorrida =
            document.getElementById("valorCorrida");


        /* =================================================
           RESUMO
        ================================================= */

        const resumoPet =
            document.getElementById("resumoPet");

        const resumoOrigem =
            document.getElementById("resumoOrigem");

        const resumoDestino =
            document.getElementById("resumoDestino");

        const valorResumo =
            document.getElementById("valorResumo");


        /* =================================================
           DADOS RECEBIDOS DA SOS
        ================================================= */

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const origemTexto =
            parametros.get("origem") || "";


        const latOrigem =
            parseFloat(
                parametros.get("latOrigem")
            );


        const lonOrigem =
            parseFloat(
                parametros.get("lonOrigem")
            );


        const destinoTexto =
            parametros.get("destino") || "";


        const destinoTipo =
            parametros.get("tipoDestino") || "";


        const latDestino =
            parseFloat(
                parametros.get("latDestino")
            );


        const lonDestino =
            parseFloat(
                parametros.get("lonDestino")
            );


        /* =================================================
           MAPA
        ================================================= */

        let mapa = null;

        let marcadorOrigem = null;

        let marcadorDestino = null;

        let linhaRota = null;


        /* =================================================
           MENSAGEM
        ================================================= */

        function mostrarMensagem(texto) {

            if (mensagemSolicitacao) {

                mensagemSolicitacao.textContent =
                    texto;

            }

        }


        /* =================================================
           VERIFICAR DADOS
        ================================================= */

        const origemValida =
            !isNaN(latOrigem) &&
            !isNaN(lonOrigem);


        const destinoValido =
            !isNaN(latDestino) &&
            !isNaN(lonDestino);


        if (!origemTexto) {

            mostrarMensagem(
                "Não foi possível identificar o local de partida."
            );

        }


        if (!destinoTexto) {

            mostrarMensagem(
                "Não foi possível identificar o destino."
            );

        }


        /* =================================================
           PREENCHER CAMPOS
        ================================================= */

        if (origem) {

            origem.value =
                origemTexto ||
                "Local não informado";

        }


        if (destino) {

            destino.value =
                destinoTexto ||
                "Destino não informado";

        }


        if (tipoDestino) {

            tipoDestino.textContent =
                destinoTipo
                    ? destinoTipo
                    : "";

        }


        /* =================================================
           ATUALIZAR RESUMO
        ================================================= */

        function atualizarResumo() {

            if (resumoPet) {

                if (
                    pet &&
                    pet.value
                ) {

                    resumoPet.textContent =
                        pet.options[
                            pet.selectedIndex
                        ].text;

                }
                else {

                    resumoPet.textContent =
                        "Não informado";

                }

            }


            if (resumoOrigem) {

                resumoOrigem.textContent =
                    origemTexto ||
                    "Não informado";

            }


            if (resumoDestino) {

                resumoDestino.textContent =
                    destinoTexto ||
                    "Não informado";

            }

        }


        /* =================================================
           CALCULAR ROTA PELAS RUAS
        ================================================= */

        async function calcularRotaPelasRuas() {

            if (
                !origemValida ||
                !destinoValido ||
                !mapa
            ) {

                return;

            }


            /*
                OSRM utiliza longitude,latitude.

                Importante:
                Leaflet utiliza [latitude, longitude],
                mas a API do OSRM utiliza
                longitude,latitude.
            */

            const url =
                "https://router.project-osrm.org/route/v1/driving/" +
                lonOrigem +
                "," +
                latOrigem +
                ";" +
                lonDestino +
                "," +
                latDestino +
                "?overview=full&geometries=geojson";


            try {

                const resposta =
                    await fetch(url);


                if (!resposta.ok) {

                    throw new Error(
                        "Erro ao consultar a rota."
                    );

                }


                const dados =
                    await resposta.json();


                if (
                    !dados.routes ||
                    dados.routes.length === 0
                ) {

                    throw new Error(
                        "Nenhuma rota encontrada."
                    );

                }


                const rota =
                    dados.routes[0];


                /*
                    Remove a linha anterior,
                    caso exista.
                */

                if (linhaRota) {

                    mapa.removeLayer(
                        linhaRota
                    );

                }


                /*
                    Converte as coordenadas
                    recebidas pelo OSRM.

                    OSRM:
                    [longitude, latitude]

                    Leaflet:
                    [latitude, longitude]
                */

                const coordenadas =
                    rota.geometry.coordinates.map(
                        function (coordenada) {

                            return [
                                coordenada[1],
                                coordenada[0]
                            ];

                        }
                    );


                /*
                    Desenha a rota seguindo
                    as ruas.
                */

                linhaRota =
                    L.polyline(
                        coordenadas,
                        {
                            color: "red",
                            weight: 3,
                            opacity: 0.9
                        }
                    )
                    .addTo(mapa);


                /*
                    Enquadra a rota inteira
                    dentro do mapa.
                */

                mapa.fitBounds(
                    linhaRota.getBounds(),
                    {
                        padding: [
                            40,
                            40
                        ]
                    }
                );


                /*
                    Mostra a distância
                    aproximada da rota.
                */

                const distanciaKm =
                    (
                        rota.distance /
                        1000
                    ).toFixed(2);


                console.log(
                    "Distância da rota:",
                    distanciaKm,
                    "km"
                );


            }
            catch (erro) {

                console.error(
                    "Erro ao calcular rota:",
                    erro
                );


                /*
                    Caso o serviço de rota
                    não esteja disponível,
                    mantém uma linha reta
                    como alternativa.
                */

                if (linhaRota) {

                    mapa.removeLayer(
                        linhaRota
                    );

                }


                linhaRota =
                    L.polyline(
                        [
                            [
                                latOrigem,
                                lonOrigem
                            ],

                            [
                                latDestino,
                                lonDestino
                            ]
                        ],
                        {
                            color: "red",
                            weight: 5,
                            opacity: 0.8,
                            dashArray: "10, 10"
                        }
                    )
                    .addTo(mapa);


                mostrarMensagem(
                    "Não foi possível calcular a rota pelas ruas."
                );

            }

        }


        /* =================================================
           INICIAR MAPA
        ================================================= */
        

        function iniciarMapa() {

            if (!mapaElemento) {

                return;

            }


            mapa =
                L.map(
                    "mapa"
                );


            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,

                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            )
            .addTo(mapa);


            /* ==========================================
               ORIGEM + DESTINO
            =========================================== */

            if (
                origemValida &&
                destinoValido
            ) {

                marcadorOrigem =
                    L.marker(
                        [
                            latOrigem,
                            lonOrigem
                        ]
                    )
                    .addTo(mapa)
                    .bindPopup(
                        "<strong>📍 Local de partida</strong>"
                    );


                marcadorDestino =
                    L.marker(
                        [
                            latDestino,
                            lonDestino
                        ]
                    )
                    .addTo(mapa)
                    .bindPopup(
                        "<strong>🏥 " +
                        escaparHTML(
                            destinoTexto
                        ) +
                        "</strong>"
                    );


                /*
                    Primeiro enquadra os dois
                    pontos no mapa.
                */

                const limites =
                    L.latLngBounds(
                        [
                            [
                                latOrigem,
                                lonOrigem
                            ],

                            [
                                latDestino,
                                lonDestino
                            ]
                        ]
                    );


                mapa.fitBounds(
                    limites,
                    {
                        padding: [
                            40,
                            40
                        ]
                    }
                );


                /*
                    Depois calcula a rota real
                    seguindo as ruas.
                */

                calcularRotaPelasRuas();

            }


            /* ==========================================
               SOMENTE ORIGEM
            =========================================== */

            else if (origemValida) {

                marcadorOrigem =
                    L.marker(
                        [
                            latOrigem,
                            lonOrigem
                        ]
                    )
                    .addTo(mapa)
                    .bindPopup(
                        "<strong>📍 Local de partida</strong>"
                    )
                    .openPopup();


                mapa.setView(
                    [
                        latOrigem,
                        lonOrigem
                    ],
                    15
                );

            }


            /* ==========================================
               SOMENTE DESTINO
            =========================================== */

            else if (destinoValido) {

                marcadorDestino =
                    L.marker(
                    [
                        latDestino,
                        lonDestino
                    ],
                    {
            icon: iconeDestinoVermelho
                    }
                    )
                    .addTo(mapa)
                    .bindPopup(
                        "<strong>🏥 " +
                        escaparHTML(
                            destinoTexto
                        ) +
                        "</strong>"
                    )
                    .openPopup();


                mapa.setView(
                    [
                        latDestino,
                        lonDestino
                    ],
                    15
                );

            }


            /* ==========================================
               CORRIGIR TAMANHO DO LEAFLET
            =========================================== */

            setTimeout(
                function () {

                    if (mapa) {

                        mapa.invalidateSize();

                    }

                },
                300
            );

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
                Math.PI /
                180;


            const dLon =
                (lon2 - lon1) *
                Math.PI /
                180;


            const a =
                Math.sin(
                    dLat / 2
                ) *
                Math.sin(
                    dLat / 2
                ) +

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

                Math.sin(
                    dLon / 2
                ) *

                Math.sin(
                    dLon / 2
                );


            const c =
                2 *
                Math.atan2(
                    Math.sqrt(a),
                    Math.sqrt(1 - a)
                );


            return R * c;

        }


        /* =================================================
           CALCULAR VALOR
        ================================================= */

        function calcularValor() {

            /*
                Valor base do socorro.
            */

            let valor = 15;


            /*
                Acrescenta um pequeno valor
                de acordo com a distância.
            */

            if (
                origemValida &&
                destinoValido
            ) {

                const distancia =
                    calcularDistancia(
                        latOrigem,
                        lonOrigem,
                        latDestino,
                        lonDestino
                    );


                valor +=
                    distancia * 2;

            }


            return valor;

        }


        /* =================================================
           MOSTRAR VALOR
        ================================================= */

        function mostrarValor() {

            const valor =
                calcularValor();


            const valorFormatado =
                "R$ " +
                valor
                    .toFixed(2)
                    .replace(
                        ".",
                        ","
                    );


            if (valorCorrida) {

                valorCorrida.textContent =
                    valorFormatado;

            }


            if (valorResumo) {

                valorResumo.textContent =
                    valorFormatado;

            }

        }


        /* =================================================
           ESCAPAR HTML
        ================================================= */

        function escaparHTML(texto) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                texto;


            return div.innerHTML;

        }
        /* =================================================
   ÍCONE VERMELHO DO DESTINO
================================================= */

const iconeDestinoVermelho =
L.icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

    iconSize: [
        41,
        41
    ],

    iconAnchor: [
        12,
        41
    ],

    popupAnchor: [
        1,
        -34
    ],

    shadowSize: [
        41,
        41
    ]
});


        /* =================================================
           ALTERAÇÃO DO PET
        ================================================= */

        if (pet) {

            pet.addEventListener(
                "change",
                function () {

                    atualizarResumo();

                }
            );

        }


        /* =================================================
           SOLICITAR SOCORRO
        ================================================= */

        if (solicitarCorrida) {

            solicitarCorrida.addEventListener(
                "click",
                function () {

                    mostrarMensagem("");


                    /* ==================================
                       VERIFICAR PET
                    =================================== */

                    if (
                        !pet ||
                        !pet.value
                    ) {

                        mostrarMensagem(
                            "Selecione o pet antes de solicitar o socorro."
                        );


                        if (pet) {

                            pet.focus();

                        }


                        return;

                    }


                    /* ==================================
                       VERIFICAR ORIGEM
                    =================================== */

                    if (
                        !origemValida
                    ) {

                        mostrarMensagem(
                            "O local de partida não foi identificado."
                        );

                        return;

                    }


                    /* ==================================
                       VERIFICAR DESTINO
                    =================================== */

                    if (
                        !destinoValido
                    ) {

                        mostrarMensagem(
                            "O destino não foi identificado."
                        );

                        return;

                    }


                    /* ==================================
                       VALOR
                    =================================== */

                    const valor =
                        calcularValor();


                    const valorFormatado =
                        valor
                            .toFixed(2)
                            .replace(
                                ".",
                                ","
                            );


                    /* ==================================
                       SUCESSO
                    =================================== */

                    mostrarMensagem(
                        "Socorro solicitado com sucesso! " +
                        "Valor estimado: R$ " +
                        valorFormatado +
                        "."
                    );


                    solicitarCorrida.disabled =
                        true;


                    solicitarCorrida.innerHTML = `

                        <i class="bi bi-check-circle-fill"></i>

                        Socorro solicitado

                    `;

                }
            );

        }


        /* =================================================
           INICIALIZAÇÃO
        ================================================= */

        atualizarResumo();

        mostrarValor();
        
        iniciarMapa();


        console.log(
            "Taxi-Dog: SOS2 carregada corretamente."
        );

    }
);