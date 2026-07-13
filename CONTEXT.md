# Paper Trade

Paper Trade is the private brokerage context for Wealth Manager. It simulates long-term investing through cash brokerage accounts without owning investor identity or investment strategy.

## Language

**Investor**:
A person using Wealth Manager for whom Paper Trade maintains a brokerage account.
_Avoid_: User, customer, account holder

**Brokerage Account**:
An investor's simulated, cash-only brokerage relationship. Each investor has one brokerage account.
_Avoid_: Portfolio, wallet

**Tradable Security**:
A US-listed stock or ETF available for simulated trading. Bond exposure is available through bond ETFs; individual bonds are not tradable securities.
_Avoid_: Instrument, asset, bond

**Ticker**:
The canonical uppercase exchange symbol used to identify a tradable security.
_Avoid_: Symbol, security ID

**Market Order**:
A request to buy or sell a tradable security immediately during Paper Trade's weekday session from 9:30 AM through 4:00 PM America/New_York. It is filled synchronously or rejected rather than held for later execution.
_Avoid_: Trade, pending order

**Cash Deposit**:
An immediate simulated addition of USD cash to a brokerage account.
_Avoid_: Bank transfer, credit

**Cash Withdrawal**:
An immediate simulated removal of USD cash from a brokerage account, limited by the account's available cash.
_Avoid_: Bank transfer, debit

**Available Cash**:
The brokerage account's full USD cash balance, including proceeds from completed sales. Paper Trade does not distinguish settled from unsettled cash.
_Avoid_: Buying power, settled cash

**Fill**:
The complete execution of a market order for a positive whole-share quantity at the current quoted price, rounded to the nearest cent. It changes cash and the corresponding position immediately without fees, spread, or slippage.
_Avoid_: Execution, partial fill

**Position**:
The whole shares of one tradable security held in a brokerage account, together with their weighted-average cost basis.
_Avoid_: Holding, investment, tax lot

**Realized Gain or Loss**:
The difference between sale proceeds and the weighted-average cost basis of the shares sold.
_Avoid_: Taxable gain, return

**Account Activity**:
An immutable record of starting cash, a cash deposit, a cash withdrawal, or a fill that changed a brokerage account.
_Avoid_: Transaction, event log
