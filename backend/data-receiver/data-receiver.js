const mongo = require('mongodb');

const host = 'localhost';
var url = process.env.MONGODB_URL;

const client = new mongo.MongoClient(url);

// Database Name
const dbName = 'quinck-bee';

const express = require('express')
const app = express()
app.use(express.json())
const port = 3000

app.get('/', (req, res) => {
  console.log("OK")
  res.send("request received")
  // switch (req.url) {
  //   case "/temperature":
      // setTemperature(26.4)
      //   .then(console.log)
      //   .catch(console.error)
  //     res.writeHead(200);
  //     res.end("temperature set");
  //     break
  //   case "/audio":
  //     res.writeHead(200);
  //     res.end("audio set");
  //     break
  //   default:
  //     res.writeHead(400);
  //     res.end("request is not valid");
  // }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



// async function main() {
//   // Use connect metmainhod to connect to the server
//   await client.connect();
//   console.log('Connected successfully to server');
//   const db = client.db(dbName);
//   const collection = db.collection('documents');

//   // the following code examples can be pasted here...

//   return 'done.';
// }

// main()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close());

// mongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//   db.close();
// });
// mongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db("quinck-bee-db");
//     dbo.createCollection("temperature", function(err, res) {
//       if (err) throw err;
//       console.log("Collection created!");
//       db.close();
//     });
//   });

// const requestListener = async function (req, res) {
//   console.log("OK");
//     switch (req.url) {
//         case "/temperature":
//             setTemperature(26.4)
//               .then(console.log)
//               .catch(console.error)
//               .finally(() => client.close());
//             res.writeHead(200);
//             res.end("temperature set");
//             break
//         case "/audio":
//             res.writeHead(200);
//             res.end("audio set");
//             break
//         default:
//             res.writeHead(400);
//             res.end("request is not valid");
//     }
// };

// const server = http.createServer(requestListener);
// server.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}`);
// });

async function setTemperature(value) {
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('temperature');

  const insertResult = await collection.insertOne({ timestamp: Date(), value: value });
  console.log('Inserted value =>', insertResult);

  return 'done.';
}
