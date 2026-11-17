-- Simple Education — estrutura inicial do banco (MySQL 8 / MariaDB 10.5+)
-- Datas gravadas em UTC (a conexão usa time_zone '+00:00').

CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- Opcional: a plataforma é aberta a qualquer pessoa, estudante ou não.
  school_year   TINYINT UNSIGNED NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_school_year CHECK (school_year IS NULL OR school_year BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guarda apenas o hash do token; o token puro fica só no cookie do navegador.
CREATE TABLE sessions (
  id_hash    CHAR(64)     NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_hash),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(80)  NOT NULL,
  name        VARCHAR(80)  NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  position    INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subjects_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topics (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id  INT UNSIGNED NOT NULL,
  slug        VARCHAR(80)  NOT NULL,
  school_year TINYINT UNSIGNED NOT NULL,
  title       VARCHAR(120) NOT NULL,
  summary     VARCHAR(255) NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  -- Texto sem acentos e em minúsculas, usado pela pesquisa.
  search_text TEXT         NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topics_slug (slug),
  KEY idx_topics_subject_year (subject_id, school_year, position),
  CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT chk_topics_school_year CHECK (school_year BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topic_sections (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id INT UNSIGNED NOT NULL,
  position INT          NOT NULL,
  kind     VARCHAR(10)  NOT NULL,
  title    VARCHAR(120) NOT NULL,
  body     TEXT         NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sections_topic (topic_id, position),
  CONSTRAINT fk_sections_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT chk_sections_kind CHECK (kind IN ('conceito', 'exemplo', 'dica'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id    INT UNSIGNED NOT NULL,
  position    INT          NOT NULL,
  statement   TEXT         NOT NULL,
  explanation TEXT         NOT NULL,
  PRIMARY KEY (id),
  KEY idx_questions_topic (topic_id, position),
  CONSTRAINT fk_questions_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_options (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id INT UNSIGNED NOT NULL,
  letter      CHAR(1)      NOT NULL,
  text        VARCHAR(255) NOT NULL,
  is_correct  TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_options_letter (question_id, letter),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT chk_options_letter CHECK (letter IN ('A', 'B', 'C', 'D', 'E')),
  CONSTRAINT chk_options_correct CHECK (is_correct IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempts (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  topic_id        INT UNSIGNED NOT NULL,
  started_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at     DATETIME     NULL,
  total_questions INT UNSIGNED NOT NULL,
  correct_count   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_attempts_user (user_id, started_at),
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempt_answers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id  INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  option_id   INT UNSIGNED NOT NULL,
  is_correct  TINYINT(1)   NOT NULL,
  answered_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_answers_attempt_question (attempt_id, question_id),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option FOREIGN KEY (option_id) REFERENCES question_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
