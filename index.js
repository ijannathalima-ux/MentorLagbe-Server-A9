import express from 'express';
import cors from 'cors'
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

connectToMongoDB()

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});