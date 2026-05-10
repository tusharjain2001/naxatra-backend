import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Naxatra backend listening on port ${port}`);
});
