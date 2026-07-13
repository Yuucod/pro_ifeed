CREATE DATABASE IF NOT EXISTS ifeed
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ifeed;

CREATE TABLE usuario (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  password VARCHAR(128) NOT NULL,
  last_login DATETIME NULL,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  date_joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  matricula VARCHAR(30) NULL UNIQUE,
  tipo_usuario ENUM('ALUNO','ADMIN') NOT NULL DEFAULT 'ALUNO',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE aluno (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  curso VARCHAR(100) NOT NULL DEFAULT 'Não informado',
  CONSTRAINT fk_aluno_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE administrador (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  cargo VARCHAR(100) NOT NULL DEFAULT 'Administrador',
  CONSTRAINT fk_administrador_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refeicao (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('A','J','L') NOT NULL COMMENT 'A=Almoço, J=Jantar, L=Lanche',
  data_refeicao DATE NOT NULL,
  turno ENUM('M','V','N') NOT NULL COMMENT 'M=Manhã, V=Vespertino, N=Noturno',
  campus VARCHAR(150) NOT NULL DEFAULT 'IFRN Campus Canguaretama',
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  observacoes TEXT NULL,
  status ENUM('RASCUNHO','PUBLICADO','ENCERRADA','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
  administrador_id BIGINT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refeicao_administrador FOREIGN KEY (administrador_id) REFERENCES administrador(id) ON DELETE SET NULL,
  CONSTRAINT ck_refeicao_horario CHECK (horario_inicio < horario_fim),
  INDEX idx_refeicao_data (data_refeicao),
  INDEX idx_refeicao_tipo (tipo),
  INDEX idx_refeicao_turno (turno),
  INDEX idx_refeicao_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE item_refeicao (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  refeicao_id BIGINT NOT NULL,
  tipo_item ENUM('PRATO_PRINCIPAL','ACOMPANHAMENTO','SALADA','BEBIDA') NOT NULL,
  nome VARCHAR(150) NOT NULL,
  ordem SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_item_refeicao FOREIGN KEY (refeicao_id) REFERENCES refeicao(id) ON DELETE CASCADE,
  CONSTRAINT uk_item_refeicao_nome UNIQUE (refeicao_id, tipo_item, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  aluno_id BIGINT NOT NULL,
  refeicao_id BIGINT NOT NULL,
  nota SMALLINT UNSIGNED NOT NULL,
  sabor SMALLINT UNSIGNED NOT NULL,
  temperatura SMALLINT UNSIGNED NOT NULL,
  quantidade SMALLINT UNSIGNED NOT NULL,
  variedade SMALLINT UNSIGNED NOT NULL,
  comentario TEXT NULL,
  sugestao TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE RESTRICT,
  CONSTRAINT fk_feedback_refeicao FOREIGN KEY (refeicao_id) REFERENCES refeicao(id) ON DELETE RESTRICT,
  CONSTRAINT uk_feedback_aluno_refeicao UNIQUE (aluno_id, refeicao_id),
  CONSTRAINT ck_feedback_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT ck_feedback_sabor CHECK (sabor BETWEEN 1 AND 5),
  CONSTRAINT ck_feedback_temperatura CHECK (temperatura BETWEEN 1 AND 5),
  CONSTRAINT ck_feedback_quantidade CHECK (quantidade BETWEEN 1 AND 5),
  CONSTRAINT ck_feedback_variedade CHECK (variedade BETWEEN 1 AND 5),
  INDEX idx_feedback_criado (criado_em),
  INDEX idx_feedback_nota (nota)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE analise_feedback (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  feedback_id BIGINT NOT NULL UNIQUE,
  administrador_id BIGINT NOT NULL,
  status_analise ENUM('VISUALIZADO','EM_ANALISE','RESOLVIDO','IGNORADO') NOT NULL DEFAULT 'VISUALIZADO',
  observacao_admin TEXT NULL,
  visualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_analise_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
  CONSTRAINT fk_analise_administrador FOREIGN KEY (administrador_id) REFERENCES administrador(id) ON DELETE RESTRICT,
  INDEX idx_analise_status (status_analise),
  INDEX idx_analise_visualizado (visualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW vw_media_refeicao AS
SELECT
  r.id AS refeicao_id,
  r.tipo,
  r.data_refeicao,
  COUNT(f.id) AS total_feedbacks,
  ROUND(AVG(f.nota), 2) AS media_nota,
  ROUND(AVG(f.sabor), 2) AS media_sabor,
  ROUND(AVG(f.temperatura), 2) AS media_temperatura,
  ROUND(AVG(f.quantidade), 2) AS media_quantidade,
  ROUND(AVG(f.variedade), 2) AS media_variedade
FROM refeicao r
LEFT JOIN feedback f ON f.refeicao_id = r.id
GROUP BY r.id, r.tipo, r.data_refeicao;

CREATE OR REPLACE VIEW vw_feedback_admin AS
SELECT
  f.id AS feedback_id,
  u.nome AS aluno,
  u.matricula,
  r.tipo,
  r.data_refeicao,
  f.nota,
  f.sabor,
  f.temperatura,
  f.quantidade,
  f.variedade,
  f.comentario,
  f.sugestao,
  f.criado_em
FROM feedback f
INNER JOIN aluno a ON a.id = f.aluno_id
INNER JOIN usuario u ON u.id = a.usuario_id
INNER JOIN refeicao r ON r.id = f.refeicao_id;
