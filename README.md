# Flyfairly app

#### To test:
`curl -X POST http://localhost:8000/signup -H "Content-Type: application/x-www-form-urlencoded" -d "email=normanmailer@mailnesia.com"`
Follow the link in the email at [mailnesia](http://mailnesia.com/mailbox/normanmailer)
It contains a JWT expiring in 15 minutes. Using the JWT updates another in the cookie `jwt`, lasting for a 24 hours.
( ᵔ ᴥ ᵔ )
