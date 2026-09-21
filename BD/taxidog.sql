CREATE DATABASE Taxi_Dog;
USE Taxi_Dog;

-- Tabela de usuários
CREATE TABLE USUARIOS (
    id_usuario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(11) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,
    -- Adicione mais colunas conforme necessário
);

-- Tabela de pets
CREATE TABLE PETS (
    id_pet INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_dono INT NOT NULL,
    nome_pet VARCHAR(100) NOT NULL,
    sexo_pet VARCHAR(20) NOT NULL,
    raca_pet VARCHAR(100) NOT NULL,
    comorbidades_pet VARCHAR(200) NOT NULL,
    FOREIGN KEY (id_dono) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela de lojas
CREATE TABLE LOJAS (
    id_loja INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_gerente INT NOT NULL,
    telefone_loja VARCHAR(11) NOT NULL,
    associacao_loja VARCHAR(100) NOT NULL,
    cnpj_loja VARCHAR(100) NOT NULL,
    nome_loja VARCHAR(100),
    endereco_loja VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_gerente) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela de produtos
CREATE TABLE PRODUTOS (
    id_produto INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_loja INT NOT NULL,
    nome_produto VARCHAR(255),
    preco_produto DECIMAL(10, 2),
    FOREIGN KEY (id_loja) REFERENCES LOJAS(id_loja) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela de pedidos
CREATE TABLE PEDIDOS (
    id_pedido INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    data_pedido DATE,
    valor_pedido DECIMAL(10, 2),
    id_usuario INT,
    id_loja INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario),
    FOREIGN KEY (id_loja) REFERENCES LOJAS(id_loja)
);

-- Tabela de itens de produto
CREATE TABLE ITENS_PRODUTO (
    id_item INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT,
    FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto) ON DELETE CASCADE ON UPDATE CASCADE
);