import app from "./api/index.ts";

const PORT = parseInt(process.env.PORT || '3001');

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
