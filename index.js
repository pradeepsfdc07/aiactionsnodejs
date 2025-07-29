const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Home route
app.get('/', (req, res) => {
  res.send('Hello World! Your Node.js app is running.');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});