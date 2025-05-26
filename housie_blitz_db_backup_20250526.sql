--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: xtestnet
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO xtestnet;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: xtestnet
--

CREATE TABLE public.games (
    id integer NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    ticket_price numeric(36,18) NOT NULL,
    token_currency character varying(10) DEFAULT 'DEGEN'::character varying NOT NULL,
    rake_percentage numeric(5,2) DEFAULT 10 NOT NULL,
    prize_pool numeric(36,18) DEFAULT 0 NOT NULL,
    numbers_called jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.games OWNER TO xtestnet;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: xtestnet
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_id_seq OWNER TO xtestnet;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xtestnet
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: xtestnet
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


ALTER TABLE public.pgmigrations OWNER TO xtestnet;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: xtestnet
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pgmigrations_id_seq OWNER TO xtestnet;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xtestnet
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: xtestnet
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    game_id integer NOT NULL,
    ticket_data jsonb NOT NULL,
    is_winner boolean DEFAULT false,
    winning_pattern character varying(255),
    purchased_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tickets OWNER TO xtestnet;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: xtestnet
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tickets_id_seq OWNER TO xtestnet;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xtestnet
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: xtestnet
--

CREATE TABLE public.users (
    id integer NOT NULL,
    fid bigint,
    wallet_address character varying(42),
    username character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO xtestnet;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: xtestnet
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO xtestnet;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xtestnet
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: winnings; Type: TABLE; Schema: public; Owner: xtestnet
--

CREATE TABLE public.winnings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    game_id integer NOT NULL,
    ticket_id integer NOT NULL,
    amount_won numeric(36,18) NOT NULL,
    token_currency character varying(10) DEFAULT 'DEGEN'::character varying NOT NULL,
    pattern character varying(50) NOT NULL,
    claimed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payout_tx_hash character varying(66),
    payout_status character varying(20) DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.winnings OWNER TO xtestnet;

--
-- Name: winnings_id_seq; Type: SEQUENCE; Schema: public; Owner: xtestnet
--

CREATE SEQUENCE public.winnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.winnings_id_seq OWNER TO xtestnet;

--
-- Name: winnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xtestnet
--

ALTER SEQUENCE public.winnings_id_seq OWNED BY public.winnings.id;


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: winnings id; Type: DEFAULT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.winnings ALTER COLUMN id SET DEFAULT nextval('public.winnings_id_seq'::regclass);


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: xtestnet
--

COPY public.games (id, scheduled_at, status, ticket_price, token_currency, rake_percentage, prize_pool, numbers_called, created_at, updated_at) FROM stdin;
1	2025-06-04 14:00:00+02	live	10.000000000000000000	DEGEN	10.00	10.000000000000000000	[35]	2025-05-24 16:19:37.198721+02	2025-05-24 16:20:32.52919+02
8	2025-06-12 12:00:00+02	finished	10.000000000000000000	DEGEN	10.00	18.000000000000000000	[28, 74, 45, 21, 58, 66, 86, 5, 80, 63, 15, 62, 7, 14, 34, 17, 65, 3, 73, 72, 53, 79, 78, 22, 75, 61, 31, 19, 35, 47, 64, 2, 30, 77, 71, 87, 56, 43, 20, 49, 50, 26, 39, 33, 59, 70, 81, 27, 54, 83, 29, 32, 12, 40, 76, 4, 68, 1, 41, 46, 44, 42, 90, 60, 82, 89, 13, 23, 24, 84, 57, 16, 67, 8, 25, 38, 88, 85, 69, 11, 36, 52, 10, 37, 51, 18, 48, 9, 55, 6]	2025-05-24 18:50:37.152562+02	2025-05-24 22:33:17.409705+02
3	2025-06-06 12:00:00+02	finished	20.000000000000000000	DEGEN	10.00	20.000000000000000000	[90]	2025-05-24 16:36:20.114366+02	2025-05-24 16:37:33.333822+02
7	2025-06-11 14:00:00+02	finished	10.000000000000000000	DEGEN	10.00	9.000000000000000000	[12, 57, 71, 47, 79, 69, 31, 68, 64, 32, 34, 82, 10, 14, 21, 46, 49, 89, 55, 77, 23, 48, 81, 41, 44, 3, 18, 35, 50, 36, 16, 60, 74, 63, 84, 56, 45, 58, 27, 25, 87, 9, 75, 39, 61, 24, 70, 15, 11, 53, 22, 28, 26, 17, 33, 37, 19, 51, 7, 38, 88, 29, 78, 8]	2025-05-24 18:19:12.785751+02	2025-05-24 18:31:33.599811+02
6	2025-06-10 12:00:00+02	finished	10.000000000000000000	DEGEN	10.00	9.000000000000000000	[]	2025-05-24 18:10:58.180126+02	2025-05-24 18:32:04.050648+02
5	2025-06-09 12:00:00+02	finished	30.000000000000000000	DEGEN	10.00	0.000000000000000000	[2, 6, 16, 22, 26, 30, 32, 49, 52, 54, 62, 65, 66, 73, 77, 85, 86]	2025-05-24 17:33:19.143585+02	2025-05-24 18:32:16.828085+02
4	2025-06-08 12:00:00+02	finished	25.000000000000000000	DEGEN	10.00	0.000000000000000000	[3, 6, 7, 9, 11, 12, 15, 22, 35, 36, 53, 62, 66, 68, 70, 71, 77, 80, 81, 83, 86]	2025-05-24 17:16:19.749786+02	2025-05-24 18:32:28.932622+02
10	2025-07-01 17:30:00+02	scheduled	12.000000000000000000	DEGEN	5.00	11.400000000000000355	[]	2025-05-24 22:35:09.865583+02	2025-05-24 22:46:12.222148+02
9	2025-07-01 16:00:00+02	scheduled	5.000000000000000000	DEGEN	10.00	13.500000000000000000	[]	2025-05-24 22:34:53.80983+02	2025-05-24 23:01:42.531108+02
11	2025-07-02 12:00:00+02	scheduled	10.000000000000000000	DEGEN	10.00	9.000000000000000000	[]	2025-05-24 23:07:23.769702+02	2025-05-24 23:07:48.899745+02
2	2025-06-05 12:00:00+02	finished	15.000000000000000000	DEGEN	10.00	13.500000000000000000	[36, 27, 37, 81, 83, 61, 55, 82, 58, 87, 7, 29, 74, 51, 42, 54, 20, 26, 9, 39, 40, 23, 4, 70, 21, 34, 65, 43, 47, 62, 46, 89, 25, 10, 85, 68, 6, 38, 18, 45, 76, 59, 44, 16, 75, 69, 52, 90, 22, 73, 50, 14, 1, 8, 71, 28, 17, 35, 78, 33, 57, 64, 24, 80, 19, 60, 3, 86, 88, 13, 77, 32, 49, 30, 11, 53, 41, 66, 2, 12, 67, 31, 63, 56, 79, 84]	2025-05-24 16:24:59.980438+02	2025-05-24 23:44:45.960458+02
\.


--
-- Data for Name: pgmigrations; Type: TABLE DATA; Schema: public; Owner: xtestnet
--

COPY public.pgmigrations (id, name, run_on) FROM stdin;
1	1748094116061_initial-schema	2025-05-24 15:45:59.390398
2	1748117660871_alter-tickets-winning-pattern-length	2025-05-24 22:17:05.28797
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: xtestnet
--

COPY public.tickets (id, user_id, game_id, ticket_data, is_winner, winning_pattern, purchased_at) FROM stdin;
1	101	1	{"rows": [[6, 11, null, 33, null, 51, 60, null, null], [null, null, 22, 39, null, 52, 69, 75, null], [7, 17, null, null, 41, null, null, null, 81]]}	f	\N	2025-05-24 16:20:14.060049+02
2	102	3	{"rows": [[7, 13, 26, null, null, 56, 62, null, null], [8, 14, null, 33, 46, null, null, null, 84], [5, 15, null, 37, 41, null, null, 71, null]]}	f	\N	2025-05-24 16:36:43.343629+02
3	105	6	{"rows": [[5, null, null, null, null, null, 66, 70, 83], [null, null, 23, 30, null, 52, 62, null, 86], [8, 12, 22, null, 44, 51, null, null, null]]}	f	\N	2025-05-24 18:11:17.054105+02
4	106	7	{"rows": [[8, 17, 28, null, 44, null, 60, null, null], [null, 12, 20, 32, null, null, null, 72, 83], [7, null, 29, 38, null, 52, null, 77, null]]}	t	TOP_LINE	2025-05-24 18:19:43.041575+02
6	106	8	{"rows": [[null, null, null, null, 49, 53, 67, 71, 88], [null, null, null, 37, null, 54, 64, null, 84], [8, 16, 20, null, 40, 52, null, null, null]]}	f	\N	2025-05-24 18:54:45.88154+02
12	106	2	{"rows": [[null, null, 29, 34, null, 53, 64, 73, null], [6, 12, null, null, 45, null, null, null, 84], [4, 14, 20, null, 46, 54, null, null, null]]}	t	BOTTOM_LINE,TOP_LINE,EARLY_FIVE,MIDDLE_LINE,FULL_HOUSE	2025-05-24 23:33:43.02613+02
5	106	8	{"rows": [[2, null, null, 34, null, 56, null, 70, 90], [8, null, 26, 32, 49, null, null, null, 85], [4, 18, null, 37, null, 55, 68, null, null]]}	t	EARLY_FIVE,TOP_LINE,MIDDLE_LINE,BOTTOM_LINE,FULL_HOUSE	2025-05-24 18:53:08.196276+02
7	106	9	{"rows": [[null, 14, null, null, 43, 56, 61, 75, null], [7, null, 27, null, null, 59, null, 79, 89], [null, 12, null, 37, 45, null, 68, 74, null]]}	f	\N	2025-05-24 22:45:58.187787+02
8	106	10	{"rows": [[3, null, 20, 38, 47, null, 66, null, null], [null, null, 25, null, null, null, 67, 72, 89], [5, 10, 27, 39, null, 59, null, null, null]]}	f	\N	2025-05-24 22:46:12.222148+02
9	106	9	{"rows": [[null, 19, 23, null, null, 59, 63, 74, null], [null, null, 28, null, 45, 52, null, 77, 83], [8, null, null, 39, 49, 55, 65, null, null]]}	f	\N	2025-05-24 22:46:21.239067+02
10	106	9	{"rows": [[null, null, null, null, 44, null, 69, 74, 80], [3, 12, 25, 35, null, 50, null, null, null], [8, null, 26, null, null, null, 64, 75, 82]]}	f	\N	2025-05-24 23:01:42.531108+02
11	106	11	{"rows": [[null, null, 26, null, null, null, 63, 75, 88], [null, 12, 20, 33, 48, null, null, 73, null], [2, null, 25, 34, 46, 51, null, null, null]]}	f	\N	2025-05-24 23:07:48.899745+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: xtestnet
--

COPY public.users (id, fid, wallet_address, username, created_at, updated_at) FROM stdin;
101	\N	\N	testuser_101	2025-05-24 16:20:14.05492+02	2025-05-24 16:20:14.05492+02
102	\N	\N	testuser_102	2025-05-24 16:36:43.339222+02	2025-05-24 16:36:43.339222+02
104	\N	\N	testuser_104	2025-05-24 17:26:48.779013+02	2025-05-24 17:26:48.779013+02
105	\N	\N	testuser_105	2025-05-24 18:11:17.048791+02	2025-05-24 18:11:17.048791+02
106	\N	\N	testuser_106	2025-05-24 18:19:43.038972+02	2025-05-24 18:19:43.038972+02
\.


--
-- Data for Name: winnings; Type: TABLE DATA; Schema: public; Owner: xtestnet
--

COPY public.winnings (id, user_id, game_id, ticket_id, amount_won, token_currency, pattern, claimed_at, payout_tx_hash, payout_status) FROM stdin;
1	106	7	4	0.299999999999999989	DEGEN	TOP_LINE	2025-05-24 18:30:53.537103+02	\N	pending
2	106	8	5	0.179999999999999993	DEGEN	EARLY_FIVE	2025-05-24 21:08:31.906338+02	\N	pending
3	106	8	5	0.599999999999999978	DEGEN	TOP_LINE	2025-05-24 21:09:42.285196+02	\N	pending
4	106	8	5	0.599999999999999978	DEGEN	MIDDLE_LINE	2025-05-24 21:10:08.839328+02	\N	pending
5	106	8	5	0.599999999999999978	DEGEN	BOTTOM_LINE	2025-05-24 22:09:51.508871+02	\N	pending
7	106	8	5	7.200000000000000178	DEGEN	FULL_HOUSE	2025-05-24 22:18:07.613534+02	\N	pending
8	106	2	12	0.450000000000000011	DEGEN	BOTTOM_LINE	2025-05-24 23:39:34.906576+02	\N	pending
9	106	2	12	0.450000000000000011	DEGEN	TOP_LINE	2025-05-24 23:40:55.761502+02	\N	pending
10	106	2	12	0.135000000000000009	DEGEN	EARLY_FIVE	2025-05-24 23:40:57.889771+02	\N	pending
11	106	2	12	0.450000000000000011	DEGEN	MIDDLE_LINE	2025-05-24 23:41:51.770842+02	\N	pending
12	106	2	12	5.400000000000000355	DEGEN	FULL_HOUSE	2025-05-24 23:42:14.698159+02	\N	pending
\.


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: xtestnet
--

SELECT pg_catalog.setval('public.games_id_seq', 11, true);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: xtestnet
--

SELECT pg_catalog.setval('public.pgmigrations_id_seq', 2, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: xtestnet
--

SELECT pg_catalog.setval('public.tickets_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: xtestnet
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: winnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: xtestnet
--

SELECT pg_catalog.setval('public.winnings_id_seq', 12, true);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_fid_key; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_fid_key UNIQUE (fid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);


--
-- Name: winnings winnings_pkey; Type: CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.winnings
    ADD CONSTRAINT winnings_pkey PRIMARY KEY (id);


--
-- Name: games_status_index; Type: INDEX; Schema: public; Owner: xtestnet
--

CREATE INDEX games_status_index ON public.games USING btree (status);


--
-- Name: tickets_game_id_index; Type: INDEX; Schema: public; Owner: xtestnet
--

CREATE INDEX tickets_game_id_index ON public.tickets USING btree (game_id);


--
-- Name: tickets_user_id_index; Type: INDEX; Schema: public; Owner: xtestnet
--

CREATE INDEX tickets_user_id_index ON public.tickets USING btree (user_id);


--
-- Name: winnings_game_id_index; Type: INDEX; Schema: public; Owner: xtestnet
--

CREATE INDEX winnings_game_id_index ON public.winnings USING btree (game_id);


--
-- Name: winnings_user_id_index; Type: INDEX; Schema: public; Owner: xtestnet
--

CREATE INDEX winnings_user_id_index ON public.winnings USING btree (user_id);


--
-- Name: games set_timestamp_games; Type: TRIGGER; Schema: public; Owner: xtestnet
--

CREATE TRIGGER set_timestamp_games BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: users set_timestamp_users; Type: TRIGGER; Schema: public; Owner: xtestnet
--

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: tickets tickets_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: winnings winnings_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.winnings
    ADD CONSTRAINT winnings_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: winnings winnings_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.winnings
    ADD CONSTRAINT winnings_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: winnings winnings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xtestnet
--

ALTER TABLE ONLY public.winnings
    ADD CONSTRAINT winnings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

