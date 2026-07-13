# Keep Paper Trade private to Wealth Manager

Paper Trade is a server-to-server API for Wealth Manager, not a browser-facing or general-purpose brokerage API. Wealth Manager owns investor authentication and sends an opaque investor identifier under a shared service credential, avoiding duplicate identity data and authentication logic inside Paper Trade.
