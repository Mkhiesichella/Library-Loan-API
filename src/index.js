import express from "express";
import dotenv from "dotenv";
import memberRoutes from "./routes/memberRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Library Loan API",
    status: "running",
    endpoints: ["/members", "/books", "/loans", "/loans?status=Terlambat"],
  });
});

app.use("/members", memberRoutes);
app.use("/books", bookRoutes);
app.use("/loans", loanRoutes);

// 404 untuk route yang tidak ada
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// Error handler (mis. JSON body tidak valid)
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 400 ? "Body JSON tidak valid" : err.message,
  });
});

// Di Vercel, app diekspor sebagai handler; secara lokal dijalankan dengan listen
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
