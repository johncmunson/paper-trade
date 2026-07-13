# Use a simplified market calendar

Paper Trade treats weekdays from 9:30 AM through 4:00 PM America/New_York as market hours, without exchange holidays or early closes; local development may bypass the check entirely. Financial Datasets does not provide market status, and a full exchange-calendar integration is disproportionate for the take-home simulation, so production-grade calendar accuracy is an explicit future upgrade.
