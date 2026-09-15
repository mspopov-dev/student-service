import express from 'express';
import studentRoutes from './routes/studentRoutes.js';
const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use(studentRoutes);
app.use((reg,res) =>
    res.status(404).send('Not Found'))

export default app;