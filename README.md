1. Set up elephantSQL for psql as a service 
- login here (https://customer.elephantsql.com/login)
- Docs here(https://www.elephantsql.com/docs/index.html)
2. Connect using `psql hostaddress` - get this from elephantSQL 
3. Create DB
  - Users
CREATE TABLE users( id SERIAL PRIMARY KEY, password VARCHAR(10), email_address VARCHAR(50));
4. Install git
5. Clone the repository using git clone https://github.com/BasharatAli1/ForgotPassword-NodeJS-PostgreSQL.git
6. Install NodeJs
7. npm install
8. npm start