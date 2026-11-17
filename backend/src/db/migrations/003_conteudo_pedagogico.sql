-- Estrutura para o conteúdo pedagógico completo e para a carga sincronizável.
-- Requer MySQL 8.0.19+ ou MariaDB 10.2+ (DROP CONSTRAINT).

-- 1) Objetivo de aprendizagem de cada aula.
ALTER TABLE topics ADD COLUMN objective TEXT NULL AFTER summary;

-- 2) Novos tipos de seção da aula: explicação, fórmulas, exemplo e resumo
--    ("conceito" e "dica" continuam aceitos por compatibilidade).
ALTER TABLE topic_sections DROP CONSTRAINT chk_sections_kind;
ALTER TABLE topic_sections ADD CONSTRAINT chk_sections_kind
  CHECK (kind IN ('explicacao', 'formulas', 'exemplo', 'resumo', 'conceito', 'dica'));

-- 3) Questões com identificador estável (code), dificuldade e situação.
--    active = 0: questão arquivada (fora dos novos exercícios, mas preservada no histórico).
--    content_hash: detecta se enunciado/alternativas/gabarito mudaram na carga.
ALTER TABLE questions
  ADD COLUMN code         VARCHAR(40) NULL AFTER topic_id,
  ADD COLUMN difficulty   VARCHAR(10) NOT NULL DEFAULT 'medio' AFTER explanation,
  ADD COLUMN active       TINYINT(1)  NOT NULL DEFAULT 1 AFTER difficulty,
  ADD COLUMN content_hash CHAR(64)    NULL AFTER active,
  ADD UNIQUE KEY uq_questions_code (code),
  ADD CONSTRAINT chk_questions_difficulty CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  ADD CONSTRAINT chk_questions_active CHECK (active IN (0, 1));

-- 4) Questões sorteadas em cada tentativa. Assim o histórico mostra exatamente
--    as questões que o aluno recebeu, mesmo que o conteúdo mude depois.
CREATE TABLE attempt_questions (
  attempt_id  INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  position    INT          NOT NULL,
  PRIMARY KEY (attempt_id, question_id),
  KEY idx_attempt_questions_question (question_id),
  CONSTRAINT fk_attempt_questions_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_questions_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tentativas anteriores a esta migration usaram todas as questões do assunto.
INSERT INTO attempt_questions (attempt_id, question_id, position)
SELECT a.id, q.id, q.position
FROM attempts a JOIN questions q ON q.topic_id = a.topic_id;
