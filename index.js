const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./Routes/productRoutes'); 
const orderRoutes = require('./Routes/orderRoutes');
const loginRoutes = require('./Routes/loginRoute');
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect('mongodb://127.0.0.1/Ecom', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(5000, () => {
      console.log('Server is running on port 5000');
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/login', loginRoutes);



