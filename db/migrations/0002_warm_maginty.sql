ALTER TABLE "account_activities" ADD CONSTRAINT "account_activities_required_fields" CHECK ((
        "account_activities"."type" in ('starting_cash', 'cash_deposit', 'cash_withdrawal')
        and "account_activities"."amount_cents" is not null
      ) or (
        "account_activities"."type" = 'buy_fill'
        and "account_activities"."ticker" is not null
        and "account_activities"."quantity" is not null
        and "account_activities"."price_cents" is not null
        and "account_activities"."total_cents" is not null
        and "account_activities"."quote_timestamp" is not null
      ) or (
        "account_activities"."type" = 'sell_fill'
        and "account_activities"."ticker" is not null
        and "account_activities"."quantity" is not null
        and "account_activities"."price_cents" is not null
        and "account_activities"."total_cents" is not null
        and "account_activities"."cost_basis_cents" is not null
        and "account_activities"."realized_gain_loss_cents" is not null
        and "account_activities"."quote_timestamp" is not null
      ));