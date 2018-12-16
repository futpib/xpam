
CREATE TABLE inline_result
       ( id text PRIMARY KEY
       , data jsonb
       );

CREATE TABLE inline_result_lru
       ( session_id bigint NOT NULL references session(id)
       , inline_result_id text NOT NULL references inline_result(id)
       , last_chosen_at timestamp NOT NULL DEFAULT NOW()
       , UNIQUE (session_id, inline_result_id)
       );
