CREATE TABLE IF NOT EXISTS ocr_corrections (
    id VARCHAR PRIMARY KEY,
    source_type VARCHAR NOT NULL,
    noisy_signature VARCHAR NOT NULL,
    raw_name VARCHAR NOT NULL,
    raw_email VARCHAR NOT NULL,
    corrected_name VARCHAR NOT NULL,
    corrected_email VARCHAR NOT NULL,
    player_id VARCHAR,
    confidence DOUBLE NOT NULL DEFAULT 1.0,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_ocr_corrections_signature
ON ocr_corrections(source_type, noisy_signature);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ocr_corrections_signature_value
ON ocr_corrections(source_type, noisy_signature, corrected_name, corrected_email);

CREATE INDEX IF NOT EXISTS idx_ocr_corrections_updated_at
ON ocr_corrections(updated_at DESC);
