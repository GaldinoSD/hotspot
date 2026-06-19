-- Tabelas do sistema OTA (lado Master - publicar updates)

CREATE TABLE IF NOT EXISTS updates (
  id VARCHAR(20) PRIMARY KEY,
  descricao TEXT NOT NULL,
  changelog TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS update_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  update_id VARCHAR(20) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  action VARCHAR(20) DEFAULT 'update',
  file_content LONGTEXT,
  FOREIGN KEY (update_id) REFERENCES updates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS update_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  update_id VARCHAR(20) NOT NULL,
  sql_content TEXT NOT NULL,
  ordem INT DEFAULT 1,
  FOREIGN KEY (update_id) REFERENCES updates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_snapshots (
  file_path VARCHAR(500) PRIMARY KEY,
  md5_hash VARCHAR(32),
  snapshot_date DATETIME
);

CREATE TABLE IF NOT EXISTS schema_snapshots (
  table_name VARCHAR(100) PRIMARY KEY,
  columns_json JSON,
  indexes_json JSON,
  create_sql TEXT
);

-- Tabelas do lado Aluno (consumir updates)

CREATE TABLE IF NOT EXISTS applied_updates (
  id VARCHAR(20) PRIMARY KEY,
  descricao TEXT,
  aplicado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS update_apply_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  update_id VARCHAR(50),
  step VARCHAR(50),
  status VARCHAR(20),
  message TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
