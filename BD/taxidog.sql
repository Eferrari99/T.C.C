CREATE DATABASE Taxi_Dog;
USE Taxi_Dog;

drop table pet;
drop table usuarios;

-- Tabela de usuários
CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(11) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL
);

INSERT INTO USUARIOS
(nome_usuario, data_nascimento, telefone, email, senha_hash)
VALUES
('João Silva', '2005-03-15', '11987654321', 'joao.silva@email.com', 'hash_joao_123'),
('Maria Oliveira', '2004-07-22', '11976543210', 'maria.oliveira@email.com', 'hash_maria_456'),
('Carlos Santos', '2006-01-10', '11965432109', 'carlos.santos@email.com', 'hash_carlos_789'),
('Ana Souza', '2003-11-05', '11954321098', 'ana.souza@email.com', 'hash_ana_321'),
('Lucas Ferreira', '2005-09-18', '11943210987', 'lucas.ferreira@email.com', 'hash_lucas_654'),
('Beatriz Costa', '2004-12-30', '11932109876', 'beatriz.costa@email.com', 'hash_beatriz_987');


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

USE Taxi_Dog;

-- =========================================
-- PETS
-- =========================================

INSERT INTO PETS
(id_dono, nome_pet, sexo_pet, raca_pet, comorbidades_pet)
VALUES
(1, 'Rex', 'Macho', 'Labrador', 'Nenhuma'),
(1, 'Mel', 'Fêmea', 'Poodle', 'Alergia de pele'),
(2, 'Thor', 'Macho', 'Golden Retriever', 'Nenhuma'),
(3, 'Luna', 'Fêmea', 'Shih-tzu', 'Problema respiratório'),
(4, 'Nina', 'Fêmea', 'Yorkshire', 'Nenhuma'),
(5, 'Bob', 'Macho', 'Bulldogue Francês', 'Alergia alimentar'),
(6, 'Maya', 'Fêmea', 'Border Collie', 'Nenhuma');


-- =========================================
-- LOJAS
-- =========================================

INSERT INTO LOJAS
(id_gerente, telefone_loja, associacao_loja, cnpj_loja, nome_loja, endereco_loja)
VALUES
(1, '1133334444', 'Pet Shop', '12.345.678/0001-01',
 'Pet Mania', 'Rua das Flores, 120 - São Paulo - SP'),

(2, '1144445555', 'Clínica Veterinária', '23.456.789/0001-02',
 'Vet Saúde Animal', 'Av. Paulista, 850 - São Paulo - SP'),

(3, '1155556666', 'Pet Shop', '34.567.890/0001-03',
 'Mundo Pet', 'Rua Augusta, 450 - São Paulo - SP'),

(4, '1166667777', 'Banho e Tosa', '45.678.901/0001-04',
 'Pet Fashion', 'Rua Vergueiro, 700 - São Paulo - SP');


-- =========================================
-- PRODUTOS
-- =========================================

INSERT INTO PRODUTOS
(id_loja, nome_produto, preco_produto)
VALUES
(1, 'Ração Premier Adultos 15kg', 189.90),
(1, 'Brinquedo Bola para Cachorro', 29.90),
(1, 'Coleira Ajustável', 45.50),

(2, 'Consulta Veterinária', 120.00),
(2, 'Vacina V10', 95.00),
(2, 'Vermífugo', 35.90),

(3, 'Ração Golden 15kg', 159.90),
(3, 'Petisco Natural', 24.90),
(3, 'Cama para Cachorro', 119.90),

(4, 'Banho Pequeno Porte', 60.00),
(4, 'Tosa Higiênica', 45.00),
(4, 'Banho + Tosa', 95.00);


-- =========================================
-- PEDIDOS
-- =========================================

INSERT INTO PEDIDOS
(data_pedido, valor_pedido, id_usuario, id_loja)
VALUES
('2026-09-01', 219.80, 1, 1),
('2026-09-02', 120.00, 2, 2),
('2026-09-03', 184.80, 3, 3),
('2026-09-04', 95.00, 4, 4),
('2026-09-05', 159.90, 5, 3),
('2026-09-06', 75.40, 6, 1),
('2026-09-07', 130.90, 1, 2),
('2026-09-08', 95.00, 2, 4);


-- =========================================
-- ITENS_PRODUTO
-- =========================================

INSERT INTO ITENS_PRODUTO
(id_pedido, id_produto, quantidade)
VALUES
-- Pedido 1
(1, 1, 1),
(1, 2, 1),

-- Pedido 2
(2, 4, 1),

-- Pedido 3
(3, 7, 1),
(3, 8, 1),

-- Pedido 4
(4, 12, 1),

-- Pedido 5
(5, 7, 1),

-- Pedido 6
(6, 2, 1),
(6, 3, 1),

-- Pedido 7
(7, 5, 1),
(7, 6, 1),

-- Pedido 8
(8, 12, 1);
SELECT * FROM USUARIOS;
SELECT * FROM PETS;
SELECT * FROM LOJAS;
SELECT * FROM PEDIDOS;
SELECT * FROM ITENS_PRODUTO;
SELECT * FROM PRODUTOS