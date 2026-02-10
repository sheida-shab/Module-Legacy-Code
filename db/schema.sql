CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    password_salt BYTEA NOT NULL,
    password_scrypt BYTEA NOT NULL,
    UNIQUE(username)
);

CREATE TABLE blooms (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    send_timestamp TIMESTAMP NOT NULL
);

CREATE TABLE follows (
    id SERIAL PRIMARY KEY,
    follower INT NOT NULL REFERENCES users(id),
    followee INT NOT NULL REFERENCES users(id),
    UNIQUE(follower, followee)
);

CREATE TABLE hashtags (
    id SERIAL PRIMARY KEY,
    hashtag VARCHAR NOT NULL,
    bloom_id BIGINT NOT NULL REFERENCES blooms(id),
    UNIQUE(hashtag, bloom_id)
);

CREATE TABLE IF NOT EXISTS reblooms (
    id BIGSERIAL PRIMARY KEY,
    original_bloom_id BIGINT NOT NULL REFERENCES blooms(id),
    rebloomed_by INT NOT NULL REFERENCES users(id),
    rebloomed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_rebloom_per_user UNIQUE (original_bloom_id, rebloomed_by)
);

