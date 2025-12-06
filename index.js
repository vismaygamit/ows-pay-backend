import express from "express";
import cors from "cors";
import aiRoutes from "./src/routes/expeditionAIRoutes.js";

const app = express();
const corsOptions = {
    origin: ["https://pay.openwatersyndicate.com", "http://localhost:5173"], // Allow multiple origins
    optionsSuccessStatus: 200 // For legacy browsers
};
// Enable CORS for all routes
app.use(cors(corsOptions));

app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World from OWS Pay Backend!");
});

app.use("/api/ai", aiRoutes);

app.listen(3001, () => console.log("Server running on port 3000"));