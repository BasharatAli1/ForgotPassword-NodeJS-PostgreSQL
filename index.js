
const sendEmail = require("./utils/email");

const envs = require("./env.vars.json");

const crypto = require("crypto");
const Pool = require('pg').Pool
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const PORT = process.env.PORT || 3000
const cors = require('cors');

const pool = new Pool({
  user: envs.user,
  host: envs.host,
  database: envs.database,
  password: envs.password,
  port: envs.passwordport,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
});

app.post('/api/forgot', (req, response) => {
  
  const email_address = req.query.email_address
  
  let expiry = Date.now() + 0; // unix time
  pool.query('SELECT id FROM users WHERE email_address = $1', [email_address], (error, results) => {
    if (error) {
      console.log("error", error);
      response_object = {
        "Message": "Error search user",
        "ResponseCode": "400",
        "Status": true,
        "Data": error
      }
      return response.status(400).json(response_object);
    }
    else if(results.rowCount > 0) {
      console.log("Agent Found\n");
      pool.query('SELECT token FROM token WHERE email_address = $1 AND expiry > $2', [email_address, expiry], (error, results) => {
        if (error) {
          console.log("error", error);
          
          response_object = {
            "Message": "Error in search Token",
            "ResponseCode": "400",
            "Status": true,
            "Data": error
          }
          return response.status(400).json(response_object);

        }
        else if(results.rowCount > 0) {
          console.log("Token Found\n");

          const link = `http://localhost:3000/api/reset/${email_address}/${results.rows[0].token}`;
          response_object = {
            "Message": "Existing token found",
            "ResponseCode": response.statusCode,
            "Status": true,
            "Data": results.rows[0]
          }
          sendEmail(email_address, link);
          return response.status(200).json(response_object);

        }
        else {
          console.log("Token not Found\n");
          
          let token = crypto.randomBytes(32).toString("hex");
          console.log("token", token);
          let expiry = Date.now() + 3600000; // 1 hour
          console.log("expiry", expiry);
          
          pool.query('INSERT INTO token (email_address, token, expiry) \ VALUES ($1, $2, $3) RETURNING id ', [email_address, token, expiry],  (error, results) => {
            if (error) {
              //throw error
              console.log(error);
              response_object = {
                "Message": "Error in Add New Token",
                "ResponseCode": "400",
                "Status": true,
                "Data": error
              }
              return response.status(400).json(response_object);
            }
            else if(results.rowCount > 0) {
              // console.log(results);
              
              const link = `http://localhost:3000/api/reset/${email_address}/${token}`;
              response_object = {
                "Message": "New Token generated",
                "ResponseCode": response.statusCode,
                "Status": true,
                "Data": results.rows[0]
              }
              sendEmail(email_address, link);
              return response.status(200).json(response_object);
            }
          });
        }
      });
    }
    else {
      console.log("User not found against mail:", email_address)
  
      response_object = {
        "Message": "User Not Found for email provided",
        "ResponseCode": "404",
        "Status": true,
        "Data": {
          "message" : "User email is wrong"
        }
      }
      return response.status(404).json(response_object)
    }
  });

});

app.post('/api/reset/:userMail/:token', (req, response) => {
  
  pool.query('CREATE TABLE IF NOT EXISTS token (id SERIAL PRIMARY KEY, email_address VARCHAR(200), token VARCHAR(200), expiry TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())', (error, results) => {
    
    if (error) {
      console.log("error IF NOT EXISTS:", error);
    }
    else {
      console.log("results IF NOT EXISTS:", results, "\n\n\n");
    }

  });

  const email_address = req.params.userMail;
  const token = req.params.token;
  let password = req.body.password;
  
  let expiry = Date.now() + 0; 

  console.log("email_address:", email_address);
  console.log("token:", token);
  console.log("expiry:", expiry);
  console.log("password:", password);

  pool.query('SELECT token FROM token WHERE email_address = $1 AND expiry > $2', [email_address, expiry], (error, results) => {
    if (error) {
      console.log("error", error);
      
      response_object = {
        "Message": "Error in search Token",
        "ResponseCode": "400",
        "Status": true,
        "Data": error
      }
      return response.status(400).json(response_object);

    }
    else if(results.rowCount > 0) {
      
      pool.query('SELECT id FROM users WHERE email_address = $1', [email_address], (error, results) => {
        if (error) {
          console.log("error", error);
          response_object = {
            "Message": "Error search user",
            "ResponseCode": "400",
            "Status": true,
            "Data": error
          }
          return response.status(400).json(response_object);
        }
        else if(results.rowCount > 0) {
          let id = results.rows[0].id;
          // Update from database
          pool.query('UPDATE users SET password = $1 WHERE id = $2', [password, id],  (err, results) => {
            if (err) {
              console.log(err)
            
              response_object = {
                "Message": "Error in updating Agent",
                "ResponseCode": "400",
                "Status": true,
                "Data": err
              }
              
              return response.status(400).json(response_object)
            }
            else if(results.rowCount > 0) {
              console.log("Agent updated with Agent ID:", id);

              response_object = {
                "Message": "Agent details updated",
                "ResponseCode": response.statusCode,
                "Status": true,
                "Data": {
                  "id": id
                }
              }

              return response.status(200).json(response_object);
            }
            else {
              console.log("Agent not found against ID:", id)
          
              response_object = {
                "Message": "Agent Not Found for ID provided",
                "ResponseCode": "404",
                "Status": true,
                "Data": {
                  "message" : "Agent ID is wrong"
                }
              }

              return response.status(200).json(response_object)
            }
          });
        }
        else {
          response_object = {
            "Message": "User not found",
            "ResponseCode": "404",
            "Status": true,
            "Data": {
              "message" : "User not found for email provided"
            }
          }
          return response.status(404).json(response_object)
        }
      });
      
    }
    else {
      response_object = {
        "Message": "Password reset token is invalid or has expired",
        "ResponseCode": "404",
        "Status": true,
        "Data": {
          "message" : "Token is invalid or has expired"
        }
      }
      return response.status(404).json(response_object)
    }
  });

});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
