import express from "express";
import cors from "cors";
import aiRoutes from "./src/routes/expeditionAIRoutes.js";

const app = express();
const corsOptions = {
    origin: "https://pay.openwatersyndicate.com",
    optionsSuccessStatus: 200 // For legacy browsers
};
// Enable CORS for all routes
app.use(cors(corsOptions));

app.use(express.json());
app.use("/api/ai", aiRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));