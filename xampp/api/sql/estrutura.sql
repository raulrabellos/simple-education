-- Estrutura do banco da versão XAMPP do Simple Education.
-- Gerado a partir da versão Node (branch main) com "npm run content:export-sql".
-- Executado automaticamente por xampp/api/instalar.php no primeiro acesso.

CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `school_year` tinyint(3) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  CONSTRAINT `chk_users_school_year` CHECK (`school_year` is null or `school_year` between 1 and 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id_hash` char(64) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_hash`),
  KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subjects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `position` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subjects_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `topics` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `subject_id` int(10) unsigned NOT NULL,
  `slug` varchar(80) NOT NULL,
  `school_year` tinyint(3) unsigned NOT NULL,
  `title` varchar(120) NOT NULL,
  `summary` varchar(255) NOT NULL,
  `objective` text DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `search_text` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_topics_slug` (`slug`),
  KEY `idx_topics_subject_year` (`subject_id`,`school_year`,`position`),
  CONSTRAINT `fk_topics_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_topics_school_year` CHECK (`school_year` between 1 and 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `topic_sections` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int(10) unsigned NOT NULL,
  `position` int(11) NOT NULL,
  `kind` varchar(10) NOT NULL,
  `title` varchar(120) NOT NULL,
  `body` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sections_topic` (`topic_id`,`position`),
  CONSTRAINT `fk_sections_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_sections_kind` CHECK (`kind` in ('explicacao','formulas','exemplo','resumo','conceito','dica'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int(10) unsigned NOT NULL,
  `code` varchar(40) DEFAULT NULL,
  `position` int(11) NOT NULL,
  `statement` text NOT NULL,
  `explanation` text NOT NULL,
  `difficulty` varchar(10) NOT NULL DEFAULT 'medio',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `content_hash` char(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_questions_code` (`code`),
  KEY `idx_questions_topic` (`topic_id`,`position`),
  CONSTRAINT `fk_questions_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_questions_difficulty` CHECK (`difficulty` in ('facil','medio','dificil')),
  CONSTRAINT `chk_questions_active` CHECK (`active` in (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `question_options` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(10) unsigned NOT NULL,
  `letter` char(1) NOT NULL,
  `text` varchar(255) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_options_letter` (`question_id`,`letter`),
  CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_options_letter` CHECK (`letter` in ('A','B','C','D','E')),
  CONSTRAINT `chk_options_correct` CHECK (`is_correct` in (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `topic_id` int(10) unsigned NOT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `finished_at` datetime DEFAULT NULL,
  `total_questions` int(10) unsigned NOT NULL,
  `correct_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_attempts_user` (`user_id`,`started_at`),
  KEY `fk_attempts_topic` (`topic_id`),
  KEY `idx_attempts_user_topic` (`user_id`,`topic_id`),
  CONSTRAINT `fk_attempts_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attempt_answers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` int(10) unsigned NOT NULL,
  `question_id` int(10) unsigned NOT NULL,
  `option_id` int(10) unsigned NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `answered_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_answers_attempt_question` (`attempt_id`,`question_id`),
  KEY `fk_answers_question` (`question_id`),
  KEY `fk_answers_option` (`option_id`),
  CONSTRAINT `fk_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_option` FOREIGN KEY (`option_id`) REFERENCES `question_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lesson_completions` (
  `user_id` int(10) unsigned NOT NULL,
  `topic_id` int(10) unsigned NOT NULL,
  `completed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`topic_id`),
  KEY `fk_completions_topic` (`topic_id`),
  CONSTRAINT `fk_completions_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_completions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attempt_questions` (
  `attempt_id` int(10) unsigned NOT NULL,
  `question_id` int(10) unsigned NOT NULL,
  `position` int(11) NOT NULL,
  PRIMARY KEY (`attempt_id`,`question_id`),
  KEY `idx_attempt_questions_question` (`question_id`),
  CONSTRAINT `fk_attempt_questions_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempt_questions_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL,
  `email` varchar(120) NOT NULL,
  `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_login_attempts` (`ip`,`email`,`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
