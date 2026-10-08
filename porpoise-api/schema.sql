BEGIN;
CREATE TABLE IF NOT EXISTS porpoise_download_counts (
  stance text PRIMARY KEY CHECK (stance IN ('archivist','challenger','confidante','drafter','explorer','panic-room')),
  downloads bigint NOT NULL DEFAULT 0 CHECK (downloads >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO porpoise_download_counts (stance)
VALUES ('archivist'), ('challenger'), ('confidante'), ('drafter'), ('explorer'), ('panic-room')
ON CONFLICT (stance) DO NOTHING;
COMMIT;
