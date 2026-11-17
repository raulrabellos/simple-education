-- Registro de "aula concluída": o aluno marca que estudou o conteúdo do assunto.
-- É independente dos exercícios (responder e acertar ficam em attempts/attempt_answers).

CREATE TABLE lesson_completions (
  user_id      INT UNSIGNED NOT NULL,
  topic_id     INT UNSIGNED NOT NULL,
  completed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, topic_id),
  CONSTRAINT fk_completions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_completions_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Acelera a busca da atividade do aluno por assunto.
CREATE INDEX idx_attempts_user_topic ON attempts (user_id, topic_id);
