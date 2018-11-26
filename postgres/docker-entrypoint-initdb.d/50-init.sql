
CREATE TABLE session
       ( id bigint PRIMARY KEY
       , data jsonb
       );

CREATE TABLE message
       ( id bigserial PRIMARY KEY
       , message_id bigint NOT NULL
       , from_id bigint NOT NULL references session(id)
       , chat_id bigint NOT NULL
       , data jsonb
       );

CREATE INDEX message_index ON message
       ( message_id
       , from_id
       , chat_id
       );

CREATE TABLE reply
       ( id bigserial PRIMARY KEY
       , reply_to_message_id bigint NOT NULL references message(id)
       , message_id bigint NOT NULL
       , from_id bigint NOT NULL references session(id)
       , chat_id bigint NOT NULL
       , data jsonb
       );

CREATE INDEX reply_index ON reply
       ( message_id
       , from_id
       , chat_id
       );

CREATE FUNCTION my_to_tsvector(text) RETURNS tsvector AS $$
SELECT to_tsvector('english', $1) ||
       to_tsvector('russian', $1) ||
       to_tsvector('simple', $1)
$$ LANGUAGE sql IMMUTABLE;

CREATE INDEX reply_ts_index ON reply USING GIN(my_to_tsvector(data->>'text'));
