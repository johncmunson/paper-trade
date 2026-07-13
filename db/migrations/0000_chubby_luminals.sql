CREATE TABLE "account_activities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "account_activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"investor_id" text NOT NULL,
	"type" text NOT NULL,
	"amount_cents" bigint,
	"ticker" text,
	"quantity" bigint,
	"price_cents" bigint,
	"total_cents" bigint,
	"cost_basis_cents" bigint,
	"realized_gain_loss_cents" bigint,
	"quote_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_activities_type_valid" CHECK ("account_activities"."type" in ('starting_cash', 'cash_deposit', 'cash_withdrawal', 'buy_fill', 'sell_fill')),
	CONSTRAINT "account_activities_amount_non_negative" CHECK ("account_activities"."amount_cents" is null or "account_activities"."amount_cents" >= 0),
	CONSTRAINT "account_activities_ticker_canonical" CHECK ("account_activities"."ticker" is null or ("account_activities"."ticker" <> '' and "account_activities"."ticker" = upper(btrim("account_activities"."ticker")))),
	CONSTRAINT "account_activities_quantity_positive" CHECK ("account_activities"."quantity" is null or "account_activities"."quantity" > 0),
	CONSTRAINT "account_activities_price_positive" CHECK ("account_activities"."price_cents" is null or "account_activities"."price_cents" > 0),
	CONSTRAINT "account_activities_total_non_negative" CHECK ("account_activities"."total_cents" is null or "account_activities"."total_cents" >= 0),
	CONSTRAINT "account_activities_cost_basis_non_negative" CHECK ("account_activities"."cost_basis_cents" is null or "account_activities"."cost_basis_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"investor_id" text PRIMARY KEY NOT NULL,
	"available_cash_cents" bigint NOT NULL,
	"realized_gain_loss_cents" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_available_cash_non_negative" CHECK ("accounts"."available_cash_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"investor_id" text NOT NULL,
	"key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_investor_id_key_pk" PRIMARY KEY("investor_id","key"),
	CONSTRAINT "idempotency_keys_response_status_valid" CHECK ("idempotency_keys"."response_status" between 100 and 599)
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"investor_id" text NOT NULL,
	"ticker" text NOT NULL,
	"quantity" bigint NOT NULL,
	"total_cost_basis_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positions_investor_id_ticker_pk" PRIMARY KEY("investor_id","ticker"),
	CONSTRAINT "positions_ticker_canonical" CHECK ("positions"."ticker" <> '' and "positions"."ticker" = upper(btrim("positions"."ticker"))),
	CONSTRAINT "positions_quantity_positive" CHECK ("positions"."quantity" > 0),
	CONSTRAINT "positions_cost_basis_non_negative" CHECK ("positions"."total_cost_basis_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "account_activities" ADD CONSTRAINT "account_activities_investor_id_accounts_investor_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."accounts"("investor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_investor_id_accounts_investor_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."accounts"("investor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_investor_id_accounts_investor_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."accounts"("investor_id") ON DELETE cascade ON UPDATE no action;