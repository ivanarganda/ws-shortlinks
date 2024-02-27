const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const axios = require('axios');
const mysql = require('mysql');

const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow requests from all origins

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection configuration with connection pooling
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'srv936.hstgr.io',
  user: 'u263299673_linkshort',
  password: 'Admin1234*!',
  database: 'u263299673_linshort'
});

// Function to execute SQL queries with retry logic
const executeQuery = (query) => {
  return new Promise((resolve, reject) => {
    pool.query(query, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Endpoint to fetch login users
app.get('/api/users/:email?', async (req, res) => {
  try {
    let email = req.query.email;
    let query = `SELECT * FROM users WHERE email ='${email}'`;
    const results = await executeQuery(query);
    res.json(results);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to register user
app.post('/api/users/', async (req, res) => {
  try {
    let jsonData = req.body;
    let name = jsonData.name, email = jsonData.email, password = jsonData.password !== '' ? jsonData.password : '', picture = jsonData.picture;
    let query = `insert into users ( name , email , password , picture ) values ( '${name}' , '${email}' , '${password}', '${picture}' )`;

    await executeQuery(query);
    res.json({ message: 'User registered successfully' });

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login user endpoint
app.post('/api/login/', async (req, res) => {
  try {
    let jsonData = req.body
    let email = jsonData.email, password = jsonData.password;
    let query = `SELECT * FROM users WHERE email = '${email}'`;
    const results = await executeQuery(query);

    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
    } else{
       if (results[0].password === password) {
         res.json({ message: results });
       } else {
         res.status(401).json({ error: 'Incorrect password' });
       }
    }

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Register user endpoint
app.post('/api/register/', async (req, res) => {
  try {
      let jsonData = req.body;
      let name = jsonData.name, email = jsonData.email, password = jsonData.password, picture = jsonData.picture;

      // Check if the user already exists
      let query = `SELECT * FROM users WHERE email = '${email}'`;
      const existingUser = await executeQuery(query);

      if (existingUser.length > 0) {
          // User already exists
          res.status(401).json({ error: 'User already exists' });
          return;
      }

      // If user does not exist, proceed with registration
      query = `INSERT INTO users (name, email, password, picture) VALUES ('${name}', '${email}', '${password}', '${picture}')`;
      await executeQuery(query);
      res.json({ message: 'User registered successfully' });

  } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to fetch data from the database urls
app.get('/api/urls/:short_like?/:idUser?', async (req, res) => {
  try {
    // Execute a sample SQL query
    let short_like = req.query.short_like;
    let idUser = req.query.idUser;

    let query = `SELECT * FROM urls ${short_like ? `where short like '%${short_like}%' or description like '%${short_like}%'` : ''}`;

    if ( idUser !== undefined && idUser != 0 ){
      query = `SELECT 
        urlsusers.idUrl as id, 
        urlsusers.idUser as idUser, 
        users.name , 
        urls.url , 
        urls.short , 
        urls.description 
      FROM urlsusers left join users on urlsusers.idUser = users.id 
      right join urls on urlsusers.idUrl = urls.id   
      WHERE urlsusers.idUser = ${idUser} ${short_like ? `and ( short like '%${short_like}%' or description like '%${short_like}%' )` : ''}`;
    }
    
    const results = await executeQuery(query);
    res.json(results);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch data from the database urls
app.get('/api/redirect_url/:idUrl?', async (req, res) => {
  try {
    // Execute a sample SQL query
    let idUrl = req.query.idUrl;

    let query = `SELECT * FROM urls WHERE id=${idUrl}`;

    const results = await executeQuery(query);
    res.json(results);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Check if url saved
app.get('/api/savedUrl/:idUrl?/:idUser?', async (req, res) => {
  try {
    // Execute a sample SQL query
    let idUrl = req.query.idUrl;
    let idUser = req.query.idUser;

    let query = `SELECT urlsusers.idUrl as idUrl ,urlsusers.idUser as idUser FROM urlsusers WHERE idUrl=${idUrl} and idUser=${idUser}`;
    
    const results = await executeQuery(query);
    res.json(results);

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to register short
app.post('/api/urls', async (req, res) => {
  try {
    // Execute a sample SQL query
    let jsonData = req.body;
    let url = jsonData.url , short = jsonData.short , description = jsonData.description;
    let query = `insert into urls ( url , short , description ) values ( '${url}' , '${short}' , '${description}' )`;

    await executeQuery(query);
    res.json({ message: 'Short registered successfully' });

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to save short to myurls
app.post('/api/saveUrls', async (req, res) => {
  try {
    // Execute a sample SQL query
    let jsonData = req.body;
    let idUrl = jsonData.idUrl , idUser = jsonData.idUser;
    let query = `insert into urlsusers ( idUser , idUrl , registered , updated ) values ( ${idUser} , ${idUrl} , now() , now() )`;

    await executeQuery(query);
    res.json({ message: 'URL saved successfully' });

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to delete short of user
app.delete( '/api/urls/:idUrl?/:idUser?', async(req,res)=>{
  try {
    // Execute a sample SQL query
    let idUrl = req.query.idUrl , idUser = req.query.idUser;
    let query = `delete from urlsusers where idUrl=${idUrl} and idUser=${idUser}`;

    await executeQuery(query);

    res.json({ message: 'Short deleted successfully' });

  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/urls/shortUrls', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS'); // Allow specified methods
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Allow specified headers
  // Your route logic here
  res.status(200).json(req.body.param);
});

app.post('/urls/generateShort',( req , res )=>{
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Allow specified headers

  const generateRandomString = (length)=> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result; 
  }

  const generatedStrings = [];
 
  const generateUniqueString = (length)=> {
    let uniqueString;
    do {
      uniqueString = generateRandomString(length);
    } while (generatedStrings.includes(uniqueString));
    generatedStrings.push(uniqueString); // Add the new unique string to the array
    return uniqueString;
  }
  
  let url = req.body.url;
 
  let segmentPath = url.split('://')[1].slice(0,2);

  let uniquePath = `/${segmentPath}/${generateUniqueString(6)}`;

  res.status(200).json(uniquePath);        

})

// Middleware to allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Ruta para el proxy
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Must provide a URL');
  }

  try {
    const response = await axios.get(url);
    res.send(response.data);
  } catch (error) {
    if (error.response) {
      // If the request was made and the server responded with a status code
      res.status(error.response.status).send(error.response.statusText);
    } else if (error.request) {
      // If the request was made but no response was received
      res.status(500).send('Error: No response received from server');
    } else {
      // If something else happened while setting up the request
      res.status(500).send('Error: Request setup failed');
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
