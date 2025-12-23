--
-- PostgreSQL database dump
--

\restrict DOhoiqMO09DoPInsTj1P8CQlAtHufOZRrFWIybSVrddAGsdLNcWVFhWkzbWm3fu

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-22 18:28:20

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5278 (class 1262 OID 16388)
-- Name: wellness; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE wellness WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE wellness OWNER TO postgres;

\unrestrict DOhoiqMO09DoPInsTj1P8CQlAtHufOZRrFWIybSVrddAGsdLNcWVFhWkzbWm3fu
\connect wellness
\restrict DOhoiqMO09DoPInsTj1P8CQlAtHufOZRrFWIybSVrddAGsdLNcWVFhWkzbWm3fu

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 244 (class 1259 OID 16837)
-- Name: access_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_log (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    action character varying(255) NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    accessed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.access_log OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16521)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    clinician_id integer NOT NULL,
    appointment_time timestamp without time zone NOT NULL,
    status character varying(20),
    CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16649)
-- Name: billing_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_accounts (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    insurance_provider character varying(255),
    policy_number character varying(255)
);


ALTER TABLE public.billing_accounts OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16749)
-- Name: clinician_clinics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinician_clinics (
    clinician_id integer NOT NULL,
    clinic_id integer NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date
);


ALTER TABLE public.clinician_clinics OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16492)
-- Name: clinicians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinicians (
    id integer NOT NULL,
    user_id integer NOT NULL,
    supervisor_id integer,
    specialty character varying(255),
    active boolean DEFAULT true
);


ALTER TABLE public.clinicians OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16510)
-- Name: clinics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinics (
    clinic_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    address1 character varying(255),
    address2 character varying(255),
    city character varying(100),
    state character varying(50),
    zip character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.clinics OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16796)
-- Name: fmri_scans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fmri_scans (
    id bigint NOT NULL,
    patient_id bigint NOT NULL,
    scan_date timestamp without time zone NOT NULL,
    scan_location character varying(255),
    findings_summary text,
    radiologist_id bigint,
    file_reference character varying(512)
);


ALTER TABLE public.fmri_scans OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16665)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    billing_account_id integer NOT NULL,
    amount_due numeric(10,2),
    due_date date,
    paid boolean DEFAULT false,
    CONSTRAINT invoices_amount_due_check CHECK ((amount_due >= (0)::numeric))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16688)
-- Name: medication_adherence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medication_adherence (
    patient_id integer NOT NULL,
    medication_id integer NOT NULL,
    taken_at timestamp without time zone NOT NULL,
    dose_taken boolean
);


ALTER TABLE public.medication_adherence OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16679)
-- Name: medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    dosage_form character varying(100)
);


ALTER TABLE public.medications OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16626)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    message text NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16563)
-- Name: patient_clinician; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_clinician (
    patient_id integer NOT NULL,
    clinician_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.patient_clinician OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16476)
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date_of_birth date,
    gender character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ethnicity character varying(100),
    address_line_1 character varying(255),
    address_line_2 character varying(255),
    state character varying(100),
    zip character varying(11),
    city character varying(100),
    CONSTRAINT patients_date_of_birth_check CHECK ((date_of_birth <= CURRENT_DATE)),
    CONSTRAINT patients_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16816)
-- Name: pet_scans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pet_scans (
    id bigint NOT NULL,
    patient_id bigint NOT NULL,
    scan_date timestamp without time zone NOT NULL,
    tracer_used character varying(100) NOT NULL,
    findings_summary text,
    radiologist_id bigint,
    file_reference character varying(512)
);


ALTER TABLE public.pet_scans OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16611)
-- Name: psyconnect; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.psyconnect (
    id bigint NOT NULL,
    patient_id bigint NOT NULL,
    assessment_type character varying(255) NOT NULL,
    score integer NOT NULL,
    assessed_at timestamp without time zone NOT NULL
);


ALTER TABLE public.psyconnect OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16440)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16707)
-- Name: scale_instruments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scale_instruments (
    id bigint NOT NULL,
    instrument_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    domain character varying(100) NOT NULL,
    score_type character varying(50) NOT NULL,
    min_score integer NOT NULL,
    max_score integer NOT NULL,
    risk_threshold_moderate integer,
    risk_threshold_severe integer,
    interpretation_rules jsonb NOT NULL,
    min_retake_interval_days integer,
    clinically_validated boolean DEFAULT true NOT NULL,
    fhir_loinc_code character varying(50),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_score_range CHECK ((min_score < max_score)),
    CONSTRAINT scale_instruments_min_retake_interval_days_check CHECK ((min_retake_interval_days >= 0)),
    CONSTRAINT scale_instruments_score_type_check CHECK (((score_type)::text = ANY ((ARRAY['integer'::character varying, 'decimal'::character varying, 'boolean'::character varying])::text[])))
);


ALTER TABLE public.scale_instruments OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16706)
-- Name: scale_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.scale_instruments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.scale_instruments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 16768)
-- Name: therapy_homework; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.therapy_homework (
    id bigint NOT NULL,
    patient_id bigint NOT NULL,
    session_id bigint NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date date NOT NULL,
    homework_type character varying(100) NOT NULL,
    description text,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone,
    CONSTRAINT chk_completed_timestamp CHECK ((((completed = false) AND (completed_at IS NULL)) OR ((completed = true) AND (completed_at IS NOT NULL))))
);


ALTER TABLE public.therapy_homework OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16543)
-- Name: therapy_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.therapy_sessions (
    id bigint NOT NULL,
    appointment_id integer NOT NULL,
    clinic_id bigint,
    notes text,
    duration_minutes integer,
    CONSTRAINT therapy_sessions_duration_minutes_check CHECK ((duration_minutes > 0))
);


ALTER TABLE public.therapy_sessions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16451)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role_id integer NOT NULL,
    manager_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16581)
-- Name: vitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vitals (
    id bigint NOT NULL,
    patient_id bigint NOT NULL,
    heart_rate integer,
    blood_pressure character varying(20),
    recorded_at timestamp without time zone NOT NULL,
    CONSTRAINT vitals_heart_rate_check CHECK (((heart_rate >= 30) AND (heart_rate <= 220)))
);


ALTER TABLE public.vitals OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16596)
-- Name: welltrack; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.welltrack (
    id bigint NOT NULL,
    patient_id bigint,
    mood_score integer,
    stress_level integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT welltrack_mood_score_check CHECK (((mood_score >= 1) AND (mood_score <= 10))),
    CONSTRAINT welltrack_stress_level_check CHECK (((stress_level >= 1) AND (stress_level <= 10)))
);


ALTER TABLE public.welltrack OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16595)
-- Name: welltrack_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.welltrack ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.welltrack_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5272 (class 0 OID 16837)
-- Dependencies: 244
-- Data for Name: access_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.access_log VALUES (1, 7, 'LOGIN', '192.168.1.10', 'Mozilla/5.0', '2025-10-02 08:55:00');
INSERT INTO public.access_log VALUES (2, 8, 'VIEW_RECORD', '192.168.1.11', 'Mozilla/5.0', '2025-10-03 09:10:00');
INSERT INTO public.access_log VALUES (3, 9, 'MESSAGE_SENT', '192.168.1.12', 'Chrome/118.0', '2025-10-04 14:05:00');
INSERT INTO public.access_log VALUES (4, 10, 'LOGIN', '192.168.1.13', 'Safari/17.0', '2025-10-05 10:20:00');
INSERT INTO public.access_log VALUES (5, 11, 'UPDATE_RECORD', '192.168.1.14', 'Mozilla/5.0', '2025-10-06 15:15:00');
INSERT INTO public.access_log VALUES (6, 12, 'LOGOUT', '192.168.1.15', 'Chrome/118.0', '2025-10-07 09:45:00');
INSERT INTO public.access_log VALUES (7, 13, 'LOGIN', '192.168.1.16', 'Mozilla/5.0', '2025-10-08 12:30:00');
INSERT INTO public.access_log VALUES (8, 14, 'VIEW_RECORD', '192.168.1.17', 'Safari/17.0', '2025-10-09 16:10:00');
INSERT INTO public.access_log VALUES (9, 15, 'MESSAGE_SENT', '192.168.1.18', 'Chrome/118.0', '2025-10-10 10:05:00');
INSERT INTO public.access_log VALUES (10, 16, 'LOGIN', '192.168.1.19', 'Mozilla/5.0', '2025-10-11 08:50:00');
INSERT INTO public.access_log VALUES (11, 17, 'UPDATE_RECORD', '192.168.1.20', 'Chrome/118.0', '2025-10-12 14:25:00');
INSERT INTO public.access_log VALUES (12, 18, 'LOGOUT', '192.168.1.21', 'Safari/17.0', '2025-10-13 11:40:00');
INSERT INTO public.access_log VALUES (13, 19, 'LOGIN', '192.168.1.22', 'Mozilla/5.0', '2025-10-14 15:55:00');
INSERT INTO public.access_log VALUES (14, 20, 'VIEW_RECORD', '192.168.1.23', 'Chrome/118.0', '2025-10-15 08:35:00');
INSERT INTO public.access_log VALUES (15, 21, 'MESSAGE_SENT', '192.168.1.24', 'Mozilla/5.0', '2025-10-16 13:50:00');
INSERT INTO public.access_log VALUES (16, 22, 'LOGIN', '192.168.1.25', 'Safari/17.0', '2025-10-17 10:15:00');
INSERT INTO public.access_log VALUES (17, 23, 'UPDATE_RECORD', '192.168.1.26', 'Chrome/118.0', '2025-10-18 09:55:00');
INSERT INTO public.access_log VALUES (18, 24, 'LOGOUT', '192.168.1.27', 'Mozilla/5.0', '2025-10-19 14:10:00');
INSERT INTO public.access_log VALUES (19, 25, 'LOGIN', '192.168.1.28', 'Chrome/118.0', '2025-10-20 11:25:00');
INSERT INTO public.access_log VALUES (20, 26, 'VIEW_RECORD', '192.168.1.29', 'Mozilla/5.0', '2025-10-21 16:45:00');
INSERT INTO public.access_log VALUES (21, 27, 'MESSAGE_SENT', '192.168.1.30', 'Safari/17.0', '2025-10-22 10:05:00');
INSERT INTO public.access_log VALUES (22, 28, 'LOGIN', '192.168.1.31', 'Chrome/118.0', '2025-10-23 09:20:00');
INSERT INTO public.access_log VALUES (23, 29, 'UPDATE_RECORD', '192.168.1.32', 'Mozilla/5.0', '2025-10-24 13:40:00');
INSERT INTO public.access_log VALUES (24, 30, 'LOGOUT', '192.168.1.33', 'Safari/17.0', '2025-10-25 15:55:00');


--
-- TOC entry 5254 (class 0 OID 16521)
-- Dependencies: 226
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.appointments VALUES (1, 7, 1, '2025-10-02 09:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (2, 8, 2, '2025-10-03 10:30:00', 'completed');
INSERT INTO public.appointments VALUES (3, 9, 3, '2025-10-04 14:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (4, 10, 4, '2025-10-05 11:00:00', 'completed');
INSERT INTO public.appointments VALUES (5, 11, 1, '2025-10-06 15:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (6, 12, 2, '2025-10-07 09:30:00', 'completed');
INSERT INTO public.appointments VALUES (7, 13, 3, '2025-10-08 13:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (8, 14, 4, '2025-10-09 16:00:00', 'completed');
INSERT INTO public.appointments VALUES (9, 15, 1, '2025-10-10 10:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (10, 16, 2, '2025-10-11 09:00:00', 'completed');
INSERT INTO public.appointments VALUES (11, 17, 3, '2025-10-12 14:30:00', 'scheduled');
INSERT INTO public.appointments VALUES (12, 18, 4, '2025-10-13 11:15:00', 'completed');
INSERT INTO public.appointments VALUES (13, 19, 1, '2025-10-14 15:45:00', 'scheduled');
INSERT INTO public.appointments VALUES (14, 20, 2, '2025-10-15 08:30:00', 'completed');
INSERT INTO public.appointments VALUES (15, 21, 3, '2025-10-16 13:45:00', 'scheduled');
INSERT INTO public.appointments VALUES (16, 22, 4, '2025-10-17 10:20:00', 'completed');
INSERT INTO public.appointments VALUES (17, 23, 1, '2025-10-18 09:50:00', 'scheduled');
INSERT INTO public.appointments VALUES (18, 24, 2, '2025-10-19 14:10:00', 'completed');
INSERT INTO public.appointments VALUES (19, 25, 3, '2025-10-20 11:40:00', 'scheduled');
INSERT INTO public.appointments VALUES (20, 26, 4, '2025-10-21 16:20:00', 'completed');
INSERT INTO public.appointments VALUES (21, 24, 1, '2025-10-22 10:10:00', 'scheduled');
INSERT INTO public.appointments VALUES (22, 25, 2, '2025-10-23 09:40:00', 'completed');
INSERT INTO public.appointments VALUES (23, 23, 3, '2025-10-24 13:20:00', 'scheduled');
INSERT INTO public.appointments VALUES (24, 3, 4, '2025-10-25 15:30:00', 'completed');
INSERT INTO public.appointments VALUES (25, 3, 1, '2025-10-26 11:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (26, 3, 2, '2025-10-27 14:45:00', 'completed');
INSERT INTO public.appointments VALUES (27, 7, 3, '2025-11-01 09:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (28, 8, 4, '2025-11-02 10:30:00', 'completed');
INSERT INTO public.appointments VALUES (29, 9, 1, '2025-11-03 14:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (30, 10, 2, '2025-11-04 11:00:00', 'completed');
INSERT INTO public.appointments VALUES (31, 11, 3, '2025-11-05 15:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (32, 12, 4, '2025-11-06 09:30:00', 'completed');
INSERT INTO public.appointments VALUES (33, 13, 1, '2025-11-07 13:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (34, 14, 2, '2025-11-08 16:00:00', 'completed');
INSERT INTO public.appointments VALUES (35, 15, 3, '2025-11-09 10:00:00', 'scheduled');
INSERT INTO public.appointments VALUES (36, 16, 4, '2025-11-10 09:00:00', 'completed');
INSERT INTO public.appointments VALUES (37, 17, 1, '2025-11-11 14:30:00', 'scheduled');
INSERT INTO public.appointments VALUES (38, 18, 2, '2025-11-12 11:15:00', 'completed');
INSERT INTO public.appointments VALUES (39, 19, 3, '2025-11-13 15:45:00', 'scheduled');
INSERT INTO public.appointments VALUES (40, 20, 4, '2025-11-14 08:30:00', 'completed');
INSERT INTO public.appointments VALUES (41, 21, 1, '2025-11-15 13:45:00', 'scheduled');
INSERT INTO public.appointments VALUES (42, 22, 2, '2025-11-16 10:20:00', 'completed');
INSERT INTO public.appointments VALUES (43, 23, 3, '2025-11-17 09:50:00', 'scheduled');
INSERT INTO public.appointments VALUES (44, 24, 4, '2025-11-18 14:10:00', 'completed');


--
-- TOC entry 5262 (class 0 OID 16649)
-- Dependencies: 234
-- Data for Name: billing_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5268 (class 0 OID 16749)
-- Dependencies: 240
-- Data for Name: clinician_clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinician_clinics VALUES (1, 1, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (2, 2, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (3, 3, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (4, 4, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (5, 1, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (6, 2, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (7, 3, '2025-12-22', NULL);
INSERT INTO public.clinician_clinics VALUES (8, 4, '2025-12-22', NULL);


--
-- TOC entry 5252 (class 0 OID 16492)
-- Dependencies: 224
-- Data for Name: clinicians; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinicians VALUES (1, 3, NULL, 'Psychiatry', true);
INSERT INTO public.clinicians VALUES (2, 4, NULL, 'Clinical Psychology', true);
INSERT INTO public.clinicians VALUES (3, 5, NULL, 'Family Medicine', true);
INSERT INTO public.clinicians VALUES (4, 6, NULL, 'Behavioral Health Counseling', true);
INSERT INTO public.clinicians VALUES (5, 7, NULL, 'Addiction Medicine', true);
INSERT INTO public.clinicians VALUES (6, 9, NULL, 'Neuropsychology', true);
INSERT INTO public.clinicians VALUES (7, 12, NULL, 'Child & Adolescent Psychiatry', true);
INSERT INTO public.clinicians VALUES (8, 15, NULL, 'Geriatric Psychiatry', true);


--
-- TOC entry 5253 (class 0 OID 16510)
-- Dependencies: 225
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinics VALUES (1, 'Mountain Health Clinic', '500 Wellness Way', 'Suite 200', 'Denver', 'CO', '80210', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (2, 'Aurora Behavioral Health Center', '1200 Harmony Rd', NULL, 'Aurora', 'CO', '80012', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (3, 'Lakewood Family Wellness', '742 Evergreen St', 'Building B', 'Lakewood', 'CO', '80226', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (4, 'Boulder Mind & Body Clinic', '88 Canyon Blvd', NULL, 'Boulder', 'CO', '80302', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (5, 'Colorado Springs Mental Health Center', '2300 Pikes Peak Ave', 'Suite 310', 'Colorado Springs', 'CO', '80903', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (6, 'Fort Collins Integrated Care', '915 Timberline Rd', NULL, 'Fort Collins', 'CO', '80524', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (7, 'Greeley Community Health Clinic', '410 Maple Ave', NULL, 'Greeley', 'CO', '80631', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (8, 'Pueblo Behavioral Services', '1600 Riverwalk Dr', 'Suite 120', 'Pueblo', 'CO', '81003', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (9, 'Loveland Wellness Center', '300 Orchard Pl', NULL, 'Loveland', 'CO', '80538', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (10, 'Thornton Mental Health Clinic', '7800 Grant St', 'Suite 150', 'Thornton', 'CO', '80229', '2025-12-22 18:03:37.747215');
INSERT INTO public.clinics VALUES (11, 'Arvada Holistic Care Center', '6400 Wadsworth Blvd', NULL, 'Arvada', 'CO', '80003', '2025-12-22 18:03:37.747215');


--
-- TOC entry 5270 (class 0 OID 16796)
-- Dependencies: 242
-- Data for Name: fmri_scans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fmri_scans VALUES (1, 7, '2025-03-12 09:00:00', 'Denver Imaging Center', 'Normal resting-state connectivity.', 1, 'fmri_007_01.dcm');
INSERT INTO public.fmri_scans VALUES (2, 8, '2025-03-15 10:30:00', 'Aurora Neuro Lab', 'Mild hypoactivity in prefrontal cortex.', 2, 'fmri_008_01.dcm');
INSERT INTO public.fmri_scans VALUES (3, 9, '2025-03-18 14:00:00', 'Denver Imaging Center', 'No abnormalities detected.', 3, 'fmri_009_01.dcm');
INSERT INTO public.fmri_scans VALUES (4, 10, '2025-03-20 11:15:00', 'Lakewood MRI Center', 'Increased amygdala activation noted.', 4, 'fmri_010_01.dcm');
INSERT INTO public.fmri_scans VALUES (5, 11, '2025-03-22 13:45:00', 'Denver Imaging Center', 'Normal structural and functional findings.', 1, 'fmri_011_01.dcm');
INSERT INTO public.fmri_scans VALUES (6, 12, '2025-03-25 09:20:00', 'Aurora Neuro Lab', 'Mild connectivity reduction in DMN.', 2, 'fmri_012_01.dcm');
INSERT INTO public.fmri_scans VALUES (7, 13, '2025-03-27 15:10:00', 'Denver Imaging Center', 'Findings consistent with anxiety-related hyperactivation.', 3, 'fmri_013_01.dcm');
INSERT INTO public.fmri_scans VALUES (8, 14, '2025-03-29 10:05:00', 'Lakewood MRI Center', 'Normal cortical thickness and activity.', 4, 'fmri_014_01.dcm');
INSERT INTO public.fmri_scans VALUES (9, 15, '2025-04-01 09:40:00', 'Denver Imaging Center', 'Slight asymmetry in temporal lobe activity.', 1, 'fmri_015_01.dcm');
INSERT INTO public.fmri_scans VALUES (10, 16, '2025-04-03 11:55:00', 'Aurora Neuro Lab', 'Normal functional connectivity.', 2, 'fmri_016_01.dcm');
INSERT INTO public.fmri_scans VALUES (11, 17, '2025-04-05 14:25:00', 'Denver Imaging Center', 'Mild hyperactivation in limbic regions.', 3, 'fmri_017_01.dcm');
INSERT INTO public.fmri_scans VALUES (12, 18, '2025-04-07 16:00:00', 'Lakewood MRI Center', 'No significant abnormalities.', 4, 'fmri_018_01.dcm');


--
-- TOC entry 5263 (class 0 OID 16665)
-- Dependencies: 235
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5265 (class 0 OID 16688)
-- Dependencies: 237
-- Data for Name: medication_adherence; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5264 (class 0 OID 16679)
-- Dependencies: 236
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5261 (class 0 OID 16626)
-- Dependencies: 233
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.messages VALUES (1, 7, 3, 'Hi doctor, I wanted to follow up on my last session.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (2, 3, 7, 'Thanks for reaching out. Let me know what concerns you have.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (3, 8, 4, 'I completed the homework assignment you gave me.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (4, 4, 8, 'Great work. We will review it in our next session.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (5, 9, 3, 'I am experiencing increased anxiety this week.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (6, 3, 9, 'Thank you for letting me know. Try the grounding exercise we discussed.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (7, 10, 4, 'Can we reschedule my appointment for next week?', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (8, 4, 10, 'Yes, I can move it to Thursday afternoon if that works.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (9, 11, 3, 'I have a question about my medication dosage.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (10, 3, 11, 'Please schedule a quick check‑in so we can review it safely.', '2025-12-22 18:16:26.662118');
INSERT INTO public.messages VALUES (11, 12, 4, 'Thank you for your support during our last session.', '2025-12-22 18:16:26.662118');


--
-- TOC entry 5256 (class 0 OID 16563)
-- Dependencies: 228
-- Data for Name: patient_clinician; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5251 (class 0 OID 16476)
-- Dependencies: 223
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.patients VALUES (1, 7, '1990-03-12', 'male', '2025-12-22 17:59:59.1022', 'Hispanic', '101 Oak St', NULL, 'CO', '80205', 'Denver');
INSERT INTO public.patients VALUES (2, 8, '1987-07-22', 'female', '2025-12-22 17:59:59.1022', 'White', '202 Pine Ave', 'Unit 3', 'CO', '80206', 'Denver');
INSERT INTO public.patients VALUES (3, 9, '1995-11-05', 'male', '2025-12-22 17:59:59.1022', 'Latino', '303 Maple Dr', NULL, 'CO', '80012', 'Aurora');
INSERT INTO public.patients VALUES (4, 10, '1992-01-18', 'female', '2025-12-22 17:59:59.1022', 'Asian', '404 Birch Ln', NULL, 'CO', '80226', 'Lakewood');
INSERT INTO public.patients VALUES (5, 11, '1984-09-30', 'male', '2025-12-22 17:59:59.1022', 'Black', '505 Cedar Ct', 'Apt 2A', 'CO', '80207', 'Denver');
INSERT INTO public.patients VALUES (6, 12, '1998-06-14', 'female', '2025-12-22 17:59:59.1022', 'White', '606 Walnut St', NULL, 'CO', '80013', 'Aurora');
INSERT INTO public.patients VALUES (7, 13, '1991-12-02', 'male', '2025-12-22 17:59:59.1022', 'Hispanic', '707 Chestnut Blvd', NULL, 'CO', '80211', 'Denver');
INSERT INTO public.patients VALUES (8, 14, '1989-04-25', 'female', '2025-12-22 17:59:59.1022', 'Black', '808 Spruce St', 'Suite 5', 'CO', '80209', 'Denver');
INSERT INTO public.patients VALUES (9, 15, '1993-02-10', 'male', '2025-12-22 17:59:59.1022', 'White', '909 Aspen Way', NULL, 'CO', '80227', 'Lakewood');
INSERT INTO public.patients VALUES (10, 16, '1997-08-19', 'female', '2025-12-22 17:59:59.1022', 'Asian', '111 Elm St', NULL, 'CO', '80203', 'Denver');
INSERT INTO public.patients VALUES (11, 17, '1986-05-07', 'male', '2025-12-22 17:59:59.1022', 'White', '222 Fir Ave', NULL, 'CO', '80014', 'Aurora');
INSERT INTO public.patients VALUES (12, 18, '1994-10-29', 'female', '2025-12-22 17:59:59.1022', 'Hispanic', '333 Poplar Dr', 'Unit 7', 'CO', '80220', 'Denver');
INSERT INTO public.patients VALUES (13, 19, '1988-03-03', 'male', '2025-12-22 17:59:59.1022', 'Black', '444 Redwood Ln', NULL, 'CO', '80221', 'Denver');
INSERT INTO public.patients VALUES (14, 20, '1996-07-16', 'female', '2025-12-22 17:59:59.1022', 'White', '555 Cypress Ct', NULL, 'CO', '80015', 'Aurora');
INSERT INTO public.patients VALUES (15, 21, '1983-11-11', 'male', '2025-12-22 17:59:59.1022', 'Asian', '666 Dogwood St', NULL, 'CO', '80210', 'Denver');
INSERT INTO public.patients VALUES (16, 22, '1999-09-09', 'female', '2025-12-22 17:59:59.1022', 'Hispanic', '777 Magnolia Ave', NULL, 'CO', '80228', 'Lakewood');
INSERT INTO public.patients VALUES (17, 23, '1990-12-21', 'male', '2025-12-22 17:59:59.1022', 'White', '888 Willow Blvd', NULL, 'CO', '80212', 'Denver');
INSERT INTO public.patients VALUES (18, 24, '1985-02-27', 'female', '2025-12-22 17:59:59.1022', 'Black', '999 Alder St', NULL, 'CO', '80016', 'Aurora');
INSERT INTO public.patients VALUES (19, 25, '1992-06-06', 'male', '2025-12-22 17:59:59.1022', 'White', '1212 Beech Ct', NULL, 'CO', '80204', 'Denver');
INSERT INTO public.patients VALUES (20, 26, '1998-01-14', 'female', '2025-12-22 17:59:59.1022', 'Asian', '1313 Hickory St', NULL, 'CO', '80218', 'Denver');
INSERT INTO public.patients VALUES (21, 27, '1987-10-08', 'male', '2025-12-22 17:59:59.1022', 'Hispanic', '1414 Olive Ave', NULL, 'CO', '80017', 'Aurora');
INSERT INTO public.patients VALUES (22, 28, '1991-04-04', 'female', '2025-12-22 17:59:59.1022', 'White', '1515 Palm Dr', NULL, 'CO', '80222', 'Denver');
INSERT INTO public.patients VALUES (23, 29, '1993-08-23', 'male', '2025-12-22 17:59:59.1022', 'Black', '1616 Sycamore St', NULL, 'CO', '80232', 'Lakewood');
INSERT INTO public.patients VALUES (24, 30, '1989-12-19', 'female', '2025-12-22 17:59:59.1022', 'Asian', '1717 Tamarack Ln', NULL, 'CO', '80230', 'Denver');
INSERT INTO public.patients VALUES (25, 31, '1997-03-28', 'male', '2025-12-22 17:59:59.1022', 'White', '1818 Cottonwood Ct', NULL, 'CO', '80011', 'Aurora');
INSERT INTO public.patients VALUES (26, 32, '1994-05-15', 'female', '2025-12-22 17:59:59.1022', 'Hispanic', '1919 Juniper St', NULL, 'CO', '80216', 'Denver');
INSERT INTO public.patients VALUES (27, 33, '1986-09-01', 'male', '2025-12-22 17:59:59.1022', 'White', '2020 Laurel Ave', NULL, 'CO', '80223', 'Denver');


--
-- TOC entry 5271 (class 0 OID 16816)
-- Dependencies: 243
-- Data for Name: pet_scans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pet_scans VALUES (1, 19, '2025-05-10 09:00:00', 'FDG', 'Normal metabolic activity.', 1, 'pet_019_01.dcm');
INSERT INTO public.pet_scans VALUES (2, 20, '2025-05-12 10:45:00', 'FDOPA', 'Reduced uptake in frontal regions.', 2, 'pet_020_01.dcm');
INSERT INTO public.pet_scans VALUES (3, 21, '2025-05-14 13:20:00', 'FDG', 'Normal whole-brain metabolic profile.', 3, 'pet_021_01.dcm');
INSERT INTO public.pet_scans VALUES (4, 22, '2025-05-16 15:00:00', 'Amyloid tracer', 'No amyloid deposition detected.', 4, 'pet_022_01.dcm');
INSERT INTO public.pet_scans VALUES (5, 23, '2025-05-18 09:30:00', 'FDG', 'Mild hypometabolism in parietal regions.', 1, 'pet_023_01.dcm');
INSERT INTO public.pet_scans VALUES (6, 24, '2025-05-20 11:10:00', 'FDOPA', 'Normal dopaminergic activity.', 2, 'pet_024_01.dcm');
INSERT INTO public.pet_scans VALUES (7, 25, '2025-05-22 14:40:00', 'FDG', 'No abnormal metabolic patterns.', 3, 'pet_025_01.dcm');


--
-- TOC entry 5260 (class 0 OID 16611)
-- Dependencies: 232
-- Data for Name: psyconnect; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5249 (class 0 OID 16440)
-- Dependencies: 221
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES (1, 'patient', 'Standard patient user');
INSERT INTO public.roles VALUES (2, 'clinician', 'Licensed healthcare provider');
INSERT INTO public.roles VALUES (3, 'admin', 'System administrator with full privileges');
INSERT INTO public.roles VALUES (4, 'therapist', 'Mental health therapist providing counseling services');
INSERT INTO public.roles VALUES (5, 'nurse', 'Clinical nursing staff member');
INSERT INTO public.roles VALUES (6, 'researcher', 'User with access to anonymized research datasets');
INSERT INTO public.roles VALUES (7, 'care_coordinator', 'Staff responsible for patient care coordination');
INSERT INTO public.roles VALUES (8, 'technician', 'Imaging or lab technician with limited system access');


--
-- TOC entry 5267 (class 0 OID 16707)
-- Dependencies: 239
-- Data for Name: scale_instruments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.scale_instruments VALUES (1, 'PHQ-9', 'Patient Health Questionnaire-9', 'Nine-item depression severity scale commonly used in primary care and psychiatry.', 'depression', 'integer', 0, 27, 10, 20, '{"0-4": "Minimal depression", "5-9": "Mild depression", "10-14": "Moderate depression", "15-19": "Moderately severe depression", "20-27": "Severe depression"}', 14, true, '44249-1', true, '2025-12-22 17:21:19.303543');
INSERT INTO public.scale_instruments VALUES (2, 'GAD-7', 'Generalized Anxiety Disorder 7-item Scale', 'Seven-item anxiety screening tool for generalized anxiety disorder.', 'anxiety', 'integer', 0, 21, 10, 15, '{"0-4": "Minimal anxiety", "5-9": "Mild anxiety", "10-14": "Moderate anxiety", "15-21": "Severe anxiety"}', 14, true, '69737-5', true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (3, 'PSS-10', 'Perceived Stress Scale', 'Measures perceived stress over the past month.', 'stress', 'integer', 0, 40, 14, 27, '{"0-13": "Low stress", "14-26": "Moderate stress", "27-40": "High perceived stress"}', 30, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (4, 'HAM-D', 'Hamilton Depression Rating Scale', 'Clinician-rated assessment of depression severity.', 'depression', 'integer', 0, 52, 17, 24, '{"0-7": "Normal", "24+": "Severe depression", "8-16": "Mild depression", "17-23": "Moderate depression"}', 30, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (5, 'MADRS', 'Montgomery–Åsberg Depression Rating Scale', 'Clinician-rated scale sensitive to treatment changes in depression.', 'depression', 'integer', 0, 60, 20, 35, '{"0-6": "Normal", "7-19": "Mild depression", "20-34": "Moderate depression", "35-60": "Severe depression"}', 30, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (6, 'AUDIT', 'Alcohol Use Disorders Identification Test', 'Screens for excessive drinking and alcohol use disorders.', 'substance_use', 'integer', 0, 40, 8, 20, '{"0-7": "Low risk", "8-15": "Hazardous use", "16-19": "Harmful use", "20-40": "Possible dependence"}', 90, true, '75626-2', true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (7, 'DAST-10', 'Drug Abuse Screening Test', 'Assesses drug use problems excluding alcohol.', 'substance_use', 'integer', 0, 10, 3, 6, '{"0": "No problems", "1-2": "Low level", "3-5": "Moderate level", "6-10": "Substantial level"}', 90, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (8, 'PSQI', 'Pittsburgh Sleep Quality Index', 'Measures sleep quality and disturbances over a one-month period.', 'sleep', 'integer', 0, 21, 6, 10, '{"0-5": "Good sleep quality", "6-21": "Poor sleep quality"}', 30, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (9, 'MoCA', 'Montreal Cognitive Assessment', 'Brief screening tool for mild cognitive impairment.', 'cognition', 'integer', 0, 30, 18, 25, '{"<18": "Severe impairment", "18-25": "Mild cognitive impairment", "26-30": "Normal cognition"}', 180, true, NULL, true, '2025-12-22 17:21:31.839797');
INSERT INTO public.scale_instruments VALUES (10, 'PCL-5', 'PTSD Checklist for DSM-5', 'Self-report measure assessing PTSD symptoms.', 'trauma', 'integer', 0, 80, 31, 50, '{"0-30": "Below threshold", "31-49": "Probable PTSD", "50-80": "Severe PTSD"}', 30, true, '89160-7', true, '2025-12-22 17:21:31.839797');


--
-- TOC entry 5269 (class 0 OID 16768)
-- Dependencies: 241
-- Data for Name: therapy_homework; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.therapy_homework VALUES (1, 7, 1, '2025-12-22 18:14:44.707167', '2025-10-05', 'CBT Thought Log', 'Record automatic thoughts once per day.', false, NULL);
INSERT INTO public.therapy_homework VALUES (2, 8, 2, '2025-12-22 18:14:44.707167', '2025-10-06', 'Behavioral Activation', 'Schedule two enjoyable activities this week.', true, '2025-10-05 00:00:00');
INSERT INTO public.therapy_homework VALUES (3, 9, 3, '2025-12-22 18:14:44.707167', '2025-10-07', 'Mindfulness Practice', 'Practice 10 minutes of mindful breathing daily.', false, NULL);
INSERT INTO public.therapy_homework VALUES (4, 10, 4, '2025-12-22 18:14:44.707167', '2025-10-08', 'DBT Emotion Regulation', 'Track emotions using the DBT diary card.', true, '2025-10-07 00:00:00');
INSERT INTO public.therapy_homework VALUES (5, 11, 5, '2025-12-22 18:14:44.707167', '2025-10-09', 'Sleep Hygiene Log', 'Record bedtime, wake time, and sleep quality.', false, NULL);
INSERT INTO public.therapy_homework VALUES (6, 12, 6, '2025-12-22 18:14:44.707167', '2025-10-10', 'CBT Cognitive Restructuring', 'Challenge three negative thoughts using evidence.', true, '2025-10-09 00:00:00');
INSERT INTO public.therapy_homework VALUES (7, 13, 7, '2025-12-22 18:14:44.707167', '2025-10-11', 'Interpersonal Effectiveness', 'Practice DEAR MAN in one real conversation.', false, NULL);
INSERT INTO public.therapy_homework VALUES (8, 14, 8, '2025-12-22 18:14:44.707167', '2025-10-12', 'Exposure Practice', 'Complete one low‑level exposure from hierarchy.', true, '2025-10-11 00:00:00');
INSERT INTO public.therapy_homework VALUES (9, 15, 9, '2025-12-22 18:14:44.707167', '2025-10-13', 'Grounding Skills', 'Use 5‑4‑3‑2‑1 grounding once per day.', false, NULL);
INSERT INTO public.therapy_homework VALUES (10, 16, 10, '2025-12-22 18:14:44.707167', '2025-10-14', 'Values Clarification', 'Write a one‑page reflection on personal values.', true, '2025-10-13 00:00:00');
INSERT INTO public.therapy_homework VALUES (11, 17, 11, '2025-12-22 18:14:44.707167', '2025-10-15', 'Anxiety Tracking', 'Track anxiety spikes and triggers for 3 days.', false, NULL);
INSERT INTO public.therapy_homework VALUES (12, 18, 12, '2025-12-22 18:14:44.707167', '2025-10-16', 'DBT Distress Tolerance', 'Practice STOP skill during moments of stress.', true, '2025-10-15 00:00:00');
INSERT INTO public.therapy_homework VALUES (13, 19, 13, '2025-12-22 18:14:44.707167', '2025-10-17', 'Grief Reflection', 'Write about one memory and associated emotions.', false, NULL);
INSERT INTO public.therapy_homework VALUES (14, 20, 14, '2025-12-22 18:14:44.707167', '2025-10-18', 'Progress Review', 'List three improvements noticed this month.', true, '2025-10-17 00:00:00');
INSERT INTO public.therapy_homework VALUES (15, 21, 15, '2025-12-22 18:14:44.707167', '2025-10-19', 'Distress Tolerance', 'Use TIP skill during emotional surges.', false, NULL);
INSERT INTO public.therapy_homework VALUES (16, 22, 1, '2025-12-22 18:14:44.707167', '2025-10-20', 'CBT Thought Log', 'Identify and record cognitive distortions.', true, '2025-10-19 00:00:00');
INSERT INTO public.therapy_homework VALUES (17, 23, 2, '2025-12-22 18:14:44.707167', '2025-10-21', 'Mindfulness Practice', 'Complete 5‑minute body scan daily.', false, NULL);
INSERT INTO public.therapy_homework VALUES (18, 24, 3, '2025-12-22 18:14:44.707167', '2025-10-22', 'Behavioral Activation', 'Plan and complete one meaningful activity.', true, '2025-10-21 00:00:00');


--
-- TOC entry 5255 (class 0 OID 16543)
-- Dependencies: 227
-- Data for Name: therapy_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.therapy_sessions VALUES (1, 1, NULL, 'Focused on initial rapport building and treatment goals.', 60);
INSERT INTO public.therapy_sessions VALUES (2, 3, NULL, 'Reviewed cognitive distortions and introduced CBT framework.', 50);
INSERT INTO public.therapy_sessions VALUES (3, 5, NULL, 'Discussed recent stressors and practiced grounding techniques.', 45);
INSERT INTO public.therapy_sessions VALUES (4, 7, NULL, 'Explored emotional triggers and coping strategies.', 55);
INSERT INTO public.therapy_sessions VALUES (5, 9, NULL, 'Introduced mindfulness breathing exercises.', 40);
INSERT INTO public.therapy_sessions VALUES (6, 11, NULL, 'Reviewed homework and identified progress barriers.', 50);
INSERT INTO public.therapy_sessions VALUES (7, 13, NULL, 'Processed interpersonal conflict and communication patterns.', 60);
INSERT INTO public.therapy_sessions VALUES (8, 15, NULL, 'Worked on reframing negative automatic thoughts.', 45);
INSERT INTO public.therapy_sessions VALUES (9, 17, NULL, 'Explored trauma-related symptoms and stabilization skills.', 55);
INSERT INTO public.therapy_sessions VALUES (10, 19, NULL, 'Reviewed sleep hygiene and behavioral activation steps.', 50);
INSERT INTO public.therapy_sessions VALUES (11, 21, NULL, 'Discussed anxiety triggers and practiced exposure hierarchy planning.', 60);
INSERT INTO public.therapy_sessions VALUES (12, 23, NULL, 'Focused on emotional regulation using DBT techniques.', 45);
INSERT INTO public.therapy_sessions VALUES (13, 25, NULL, 'Explored grief responses and coping mechanisms.', 50);
INSERT INTO public.therapy_sessions VALUES (14, 27, NULL, 'Reviewed progress and adjusted treatment plan.', 55);
INSERT INTO public.therapy_sessions VALUES (15, 29, NULL, 'Introduced distress tolerance skills for crisis moments.', 60);


--
-- TOC entry 5250 (class 0 OID 16451)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 'jeffrey.mason@wellnesstechagency.org', 'Jeffrey Mason', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (2, 'sarah.smith@wellnesstechagency.org', 'Sarah Smith', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (3, 'michael.johnson@wellnesstechagency.org', 'Michael Johnson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (4, 'emily.williams@wellnesstechagency.org', 'Emily Williams', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (5, 'david.brown@wellnesstechagency.org', 'David Brown', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (6, 'jessica.jones@wellnesstechagency.org', 'Jessica Jones', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (7, 'daniel.miller@wellnesstechagency.org', 'Daniel Miller', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (8, 'ashley.davis@wellnesstechagency.org', 'Ashley Davis', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (9, 'christopher.garcia@wellnesstechagency.org', 'Christopher Garcia', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (10, 'amanda.rodriguez@wellnesstechagency.org', 'Amanda Rodriguez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (11, 'joshua.martinez@wellnesstechagency.org', 'Joshua Martinez', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (12, 'megan.hernandez@wellnesstechagency.org', 'Megan Hernandez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (13, 'ryan.lopez@wellnesstechagency.org', 'Ryan Lopez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (14, 'stephanie.gonzalez@wellnesstechagency.org', 'Stephanie Gonzalez', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (15, 'andrew.wilson@wellnesstechagency.org', 'Andrew Wilson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (16, 'nicole.anderson@wellnesstechagency.org', 'Nicole Anderson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (17, 'kevin.thomas@wellnesstechagency.org', 'Kevin Thomas', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (18, 'lauren.taylor@wellnesstechagency.org', 'Lauren Taylor', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (19, 'brian.moore@wellnesstechagency.org', 'Brian Moore', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (20, 'rachel.jackson@wellnesstechagency.org', 'Rachel Jackson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (21, 'justin.martin@wellnesstechagency.org', 'Justin Martin', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (22, 'victoria.lee@wellnesstechagency.org', 'Victoria Lee', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (23, 'eric.perez@wellnesstechagency.org', 'Eric Perez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (24, 'katherine.thompson@wellnesstechagency.org', 'Katherine Thompson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (25, 'steven.white@wellnesstechagency.org', 'Steven White', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (26, 'hannah.harris@wellnesstechagency.org', 'Hannah Harris', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (27, 'patrick.sanchez@wellnesstechagency.org', 'Patrick Sanchez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (28, 'olivia.clark@wellnesstechagency.org', 'Olivia Clark', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (29, 'tyler.ramirez@wellnesstechagency.org', 'Tyler Ramirez', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (30, 'samantha.lewis@wellnesstechagency.org', 'Samantha Lewis', 2, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (31, 'brandon.robinson@wellnesstechagency.org', 'Brandon Robinson', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (32, 'melissa.walker@wellnesstechagency.org', 'Melissa Walker', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (33, 'jacob.young@wellnesstechagency.org', 'Jacob Young', 1, NULL, '2025-12-22 17:59:36.087645');
INSERT INTO public.users VALUES (34, 'alexandra.king@wellnesstechagency.org', 'Alexandra King', 3, NULL, '2025-12-22 17:59:36.087645');


--
-- TOC entry 5257 (class 0 OID 16581)
-- Dependencies: 229
-- Data for Name: vitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vitals VALUES (1, 7, 72, '118/76', '2025-10-02 09:15:00');
INSERT INTO public.vitals VALUES (2, 8, 80, '122/78', '2025-10-03 10:40:00');
INSERT INTO public.vitals VALUES (3, 9, 68, '115/74', '2025-10-04 14:10:00');
INSERT INTO public.vitals VALUES (4, 10, 75, '120/80', '2025-10-05 11:05:00');
INSERT INTO public.vitals VALUES (5, 11, 82, '130/85', '2025-10-06 15:10:00');
INSERT INTO public.vitals VALUES (6, 12, 70, '117/76', '2025-10-07 09:35:00');
INSERT INTO public.vitals VALUES (7, 13, 78, '125/82', '2025-10-08 13:05:00');
INSERT INTO public.vitals VALUES (8, 14, 73, '119/79', '2025-10-09 16:05:00');
INSERT INTO public.vitals VALUES (9, 15, 88, '135/88', '2025-10-10 10:05:00');
INSERT INTO public.vitals VALUES (10, 16, 65, '112/70', '2025-10-11 09:10:00');
INSERT INTO public.vitals VALUES (11, 17, 77, '124/81', '2025-10-12 14:35:00');
INSERT INTO public.vitals VALUES (12, 18, 71, '118/75', '2025-10-13 11:20:00');
INSERT INTO public.vitals VALUES (13, 19, 84, '132/86', '2025-10-14 15:50:00');
INSERT INTO public.vitals VALUES (14, 20, 69, '116/73', '2025-10-15 08:40:00');
INSERT INTO public.vitals VALUES (15, 21, 76, '121/80', '2025-10-16 13:55:00');
INSERT INTO public.vitals VALUES (16, 22, 74, '119/77', '2025-10-17 10:25:00');
INSERT INTO public.vitals VALUES (17, 23, 83, '129/84', '2025-10-18 09:55:00');
INSERT INTO public.vitals VALUES (18, 24, 67, '114/72', '2025-10-19 14:20:00');
INSERT INTO public.vitals VALUES (19, 15, 79, '126/83', '2025-10-20 11:45:00');
INSERT INTO public.vitals VALUES (20, 16, 72, '118/76', '2025-10-21 16:25:00');
INSERT INTO public.vitals VALUES (21, 17, 81, '131/87', '2025-10-22 10:20:00');
INSERT INTO public.vitals VALUES (22, 18, 66, '113/71', '2025-10-23 09:50:00');
INSERT INTO public.vitals VALUES (23, 19, 85, '134/89', '2025-10-24 13:30:00');
INSERT INTO public.vitals VALUES (24, 10, 74, '120/78', '2025-10-25 15:35:00');
INSERT INTO public.vitals VALUES (25, 11, 71, '117/74', '2025-10-26 11:10:00');
INSERT INTO public.vitals VALUES (26, 12, 90, '138/92', '2025-10-27 14:55:00');
INSERT INTO public.vitals VALUES (27, 7, 75, '121/79', '2025-11-02 09:20:00');
INSERT INTO public.vitals VALUES (28, 12, 82, '128/85', '2025-11-04 10:45:00');
INSERT INTO public.vitals VALUES (29, 19, 69, '115/72', '2025-11-06 08:55:00');


--
-- TOC entry 5259 (class 0 OID 16596)
-- Dependencies: 231
-- Data for Name: welltrack; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 238
-- Name: scale_instruments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scale_instruments_id_seq', 10, true);


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 230
-- Name: welltrack_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.welltrack_id_seq', 1, false);


--
-- TOC entry 5032 (class 2606 OID 16532)
-- Name: appointments appointments_clinician_id_appointment_time_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinician_id_appointment_time_key UNIQUE (clinician_id, appointment_time);


--
-- TOC entry 5034 (class 2606 OID 16530)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--a
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- TOC entry 5048 (class 2606 OID 16659)
-- Name: billing_accounts billing_accounts_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_patient_id_key UNIQUE (patient_id);


--
-- TOC entry 5050 (class 2606 OID 16657)
-- Name: billing_accounts billing_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 16757)
-- Name: clinician_clinics clinician_clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinician_clinics
    ADD CONSTRAINT clinician_clinics_pkey PRIMARY KEY (clinician_id, clinic_id);


--
-- TOC entry 5028 (class 2606 OID 16499)
-- Name: clinicians clinicians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicians
    ADD CONSTRAINT clinicians_pkey PRIMARY KEY (id);


--
-- TOC entry 5030 (class 2606 OID 16520)
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id);


--
-- TOC entry 5052 (class 2606 OID 16673)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 16695)
-- Name: medication_adherence medication_adherence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_adherence
    ADD CONSTRAINT medication_adherence_pkey PRIMARY KEY (patient_id, medication_id, taken_at);


--
-- TOC entry 5054 (class 2606 OID 16687)
-- Name: medications medications_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_name_key UNIQUE (name);


--
-- TOC entry 5056 (class 2606 OID 16685)
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- TOC entry 5046 (class 2606 OID 16638)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 16570)
-- Name: patient_clinician patient_clinician_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_clinician
    ADD CONSTRAINT patient_clinician_pkey PRIMARY KEY (patient_id, clinician_id);


--
-- TOC entry 5026 (class 2606 OID 16486)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- TOC entry 5072 (class 2606 OID 16849)
-- Name: access_log pk_access_log; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_log
    ADD CONSTRAINT pk_access_log PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 16805)
-- Name: fmri_scans pk_fmri_scans; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fmri_scans
    ADD CONSTRAINT pk_fmri_scans PRIMARY KEY (id);


--
-- TOC entry 5070 (class 2606 OID 16826)
-- Name: pet_scans pk_pet_scans; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pet_scans
    ADD CONSTRAINT pk_pet_scans PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 16784)
-- Name: therapy_homework pk_therapy_homework; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_homework
    ADD CONSTRAINT pk_therapy_homework PRIMARY KEY (id);


--
-- TOC entry 5044 (class 2606 OID 16620)
-- Name: psyconnect psyconnect_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psyconnect
    ADD CONSTRAINT psyconnect_pkey PRIMARY KEY (id);


--
-- TOC entry 5018 (class 2606 OID 16448)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 2606 OID 16450)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 5060 (class 2606 OID 16730)
-- Name: scale_instruments scale_instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scale_instruments
    ADD CONSTRAINT scale_instruments_pkey PRIMARY KEY (id);


--
-- TOC entry 5036 (class 2606 OID 16552)
-- Name: therapy_sessions therapy_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5062 (class 2606 OID 16732)
-- Name: scale_instruments uq_scale_instrument_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scale_instruments
    ADD CONSTRAINT uq_scale_instrument_code UNIQUE (instrument_code);


--
-- TOC entry 5022 (class 2606 OID 16465)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5024 (class 2606 OID 16463)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5040 (class 2606 OID 16589)
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 16605)
-- Name: welltrack welltrack_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welltrack
    ADD CONSTRAINT welltrack_pkey PRIMARY KEY (id);


--
-- TOC entry 5078 (class 2606 OID 16538)
-- Name: appointments appointments_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.clinicians(id);


--
-- TOC entry 5079 (class 2606 OID 16533)
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5089 (class 2606 OID 16660)
-- Name: billing_accounts billing_accounts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5093 (class 2606 OID 16763)
-- Name: clinician_clinics clinician_clinics_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinician_clinics
    ADD CONSTRAINT clinician_clinics_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 5094 (class 2606 OID 16758)
-- Name: clinician_clinics clinician_clinics_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinician_clinics
    ADD CONSTRAINT clinician_clinics_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.clinicians(id);


--
-- TOC entry 5076 (class 2606 OID 16505)
-- Name: clinicians clinicians_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicians
    ADD CONSTRAINT clinicians_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.clinicians(id);


--
-- TOC entry 5077 (class 2606 OID 16500)
-- Name: clinicians clinicians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicians
    ADD CONSTRAINT clinicians_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5101 (class 2606 OID 16850)
-- Name: access_log fk_access_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_log
    ADD CONSTRAINT fk_access_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5097 (class 2606 OID 16806)
-- Name: fmri_scans fk_fmri_patient; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fmri_scans
    ADD CONSTRAINT fk_fmri_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 16811)
-- Name: fmri_scans fk_fmri_radiologist; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fmri_scans
    ADD CONSTRAINT fk_fmri_radiologist FOREIGN KEY (radiologist_id) REFERENCES public.clinicians(id) ON DELETE SET NULL;


--
-- TOC entry 5095 (class 2606 OID 16785)
-- Name: therapy_homework fk_homework_patient; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_homework
    ADD CONSTRAINT fk_homework_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 16790)
-- Name: therapy_homework fk_homework_session; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_homework
    ADD CONSTRAINT fk_homework_session FOREIGN KEY (session_id) REFERENCES public.therapy_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 16827)
-- Name: pet_scans fk_pet_patient; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pet_scans
    ADD CONSTRAINT fk_pet_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 16832)
-- Name: pet_scans fk_pet_radiologist; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pet_scans
    ADD CONSTRAINT fk_pet_radiologist FOREIGN KEY (radiologist_id) REFERENCES public.clinicians(id) ON DELETE SET NULL;


--
-- TOC entry 5090 (class 2606 OID 16674)
-- Name: invoices invoices_billing_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES public.billing_accounts(id);


--
-- TOC entry 5091 (class 2606 OID 16701)
-- Name: medication_adherence medication_adherence_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_adherence
    ADD CONSTRAINT medication_adherence_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id);


--
-- TOC entry 5092 (class 2606 OID 16696)
-- Name: medication_adherence medication_adherence_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_adherence
    ADD CONSTRAINT medication_adherence_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5087 (class 2606 OID 16644)
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- TOC entry 5088 (class 2606 OID 16639)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 5082 (class 2606 OID 16576)
-- Name: patient_clinician patient_clinician_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_clinician
    ADD CONSTRAINT patient_clinician_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.clinicians(id);


--
-- TOC entry 5083 (class 2606 OID 16571)
-- Name: patient_clinician patient_clinician_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_clinician
    ADD CONSTRAINT patient_clinician_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5075 (class 2606 OID 16487)
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5086 (class 2606 OID 16621)
-- Name: psyconnect psyconnect_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psyconnect
    ADD CONSTRAINT psyconnect_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5080 (class 2606 OID 16553)
-- Name: therapy_sessions therapy_sessions_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- TOC entry 5081 (class 2606 OID 16558)
-- Name: therapy_sessions therapy_sessions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 5073 (class 2606 OID 16471)
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 5074 (class 2606 OID 16466)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 5084 (class 2606 OID 16590)
-- Name: vitals vitals_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5085 (class 2606 OID 16606)
-- Name: welltrack welltrack_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welltrack
    ADD CONSTRAINT welltrack_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 5278
-- Name: DATABASE wellness; Type: ACL; Schema: -; Owner: postgres
--

GRANT CONNECT ON DATABASE wellness TO wellness_app;
GRANT CONNECT ON DATABASE wellness TO wellness_readonly;


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE appointments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.appointments TO wellness_app;
GRANT SELECT ON TABLE public.appointments TO wellness_readonly;


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE billing_accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.billing_accounts TO wellness_app;
GRANT SELECT ON TABLE public.billing_accounts TO wellness_readonly;


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE clinicians; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicians TO wellness_app;
GRANT SELECT ON TABLE public.clinicians TO wellness_readonly;


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE clinics; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinics TO wellness_app;
GRANT SELECT ON TABLE public.clinics TO wellness_readonly;


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.invoices TO wellness_app;
GRANT SELECT ON TABLE public.invoices TO wellness_readonly;


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE medication_adherence; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.medication_adherence TO wellness_app;
GRANT SELECT ON TABLE public.medication_adherence TO wellness_readonly;


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE medications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.medications TO wellness_app;
GRANT SELECT ON TABLE public.medications TO wellness_readonly;


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.messages TO wellness_app;
GRANT SELECT ON TABLE public.messages TO wellness_readonly;


--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE patient_clinician; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.patient_clinician TO wellness_app;
GRANT SELECT ON TABLE public.patient_clinician TO wellness_readonly;


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE patients; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.patients TO wellness_app;
GRANT SELECT ON TABLE public.patients TO wellness_readonly;


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE psyconnect; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.psyconnect TO wellness_app;
GRANT SELECT ON TABLE public.psyconnect TO wellness_readonly;


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO wellness_app;
GRANT SELECT ON TABLE public.roles TO wellness_readonly;


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE therapy_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.therapy_sessions TO wellness_app;
GRANT SELECT ON TABLE public.therapy_sessions TO wellness_readonly;


--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO wellness_app;
GRANT SELECT ON TABLE public.users TO wellness_readonly;


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE vitals; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vitals TO wellness_app;
GRANT SELECT ON TABLE public.vitals TO wellness_readonly;


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE welltrack; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.welltrack TO wellness_app;
GRANT SELECT ON TABLE public.welltrack TO wellness_readonly;


-- Completed on 2025-12-22 18:28:20

--
-- PostgreSQL database dump complete
--

\unrestrict DOhoiqMO09DoPInsTj1P8CQlAtHufOZRrFWIybSVrddAGsdLNcWVFhWkzbWm3fu

