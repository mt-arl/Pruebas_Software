require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/route');
const gradesRoutes = require('./routes/gradesRoutes');
const subjectRoutes = require('./routes/subjectRoutes'); 

const app = express();

// Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch(console.error);

// Rutas
app.use('/', routes);
app.use('/api/grades', gradesRoutes);
app.use('/api/subjects', subjectRoutes); 


// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

