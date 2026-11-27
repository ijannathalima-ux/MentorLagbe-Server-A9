import express from 'express';
import cors from 'cors';
import "dotenv/config";
import { MongoClient } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());


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

const connectClient = await connectToMongoDB();
const db = connectClient?.db("mentor-lagbe");

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;

const JWKS = createRemoteJWKSet(
  new URL(`${BETTER_AUTH_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      msg: "Unauthorized!",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      msg: "Unauthorized!",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: BETTER_AUTH_URL,
      audience: BETTER_AUTH_URL,
    });

    if (!payload.sub) {
      return res.status(401).send({
        msg: "Invalid user token!",
      });
    }

    req.user = {
      id: payload.sub,
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    return res.status(401).send({
      msg: "Invalid or expired token!",
    });
  }
};


app.get('/tuitions', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        message: "Database not connected"
      });
    }

    const { search, subject, classLevel, mode, limit } = req.query;

    const query = {
      approvalStatus: "approved",
      isActive: true,
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    if (subject) {
      query.subject = subject;
    }

    if (classLevel) {
      query.classLevel = classLevel;
    }

    if (mode) {
      query.mode = mode;
    }

    const parsedLimit =
      Number(limit) > 0
        ? Math.min(Number(limit), 50)
        : 20;

    const tuitions = await db
      .collection("tuitions")
      .find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit)
      .toArray();

    res.status(200).json({ tuitions });

  } catch (err) {
    console.dir(err);

    res.status(500).json({
      message: "Failed to fetch tuitions"
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});