const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: 'D:/qbatch/Project/proj/src/images',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
  }),
});

const Product = require('../Models/productModel'); 
const Reservation = require('../Models/Reservation.js');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    let query = {};

    if (req.query.similar) {
      const searchQuery = req.query.searchQuery || '';
      query = { $text: { $search: searchQuery } };
    }

    const products = await Product.find(query);
    const totalCount = await Product.countDocuments(query);

    if (!req.query.similar) {
      const startIndex = skip;
      const endIndex = skip + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);
      res.status(200).json({ totalCount, products: paginatedProducts });
    } else {
      res.status(200).json({ totalCount, products });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching the products' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, color, stock } = req.body;
    const image = req.file.filename;

    if (!stock) {
      return res.status(400).json({ error: 'Stock is required' });
    }

    const newProduct = new Product({
      title,
      description,
      price,
      image: `http://localhost:5000/images/${image}`,
      color,
      stock, 
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'An error occurred while creating the product' });
  }
});

router.put('/updateStock', async (req, res) => {
  try {
    const { products } = req.body;

    console.log(products);

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    for (const productData of products) {
      const { productId, newStock } = productData;

      if (!productId || newStock === undefined) {
        return res.status(400).json({ error: 'Invalid product data' });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      product.stock = newStock;
      await product.save();
    }

    res.status(200).json({ message: 'Stocks updated successfully' });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: 'An error occurred while updating product stock' });
  }
});

router.post("/checkStock", async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const updatedCart = await Promise.all(
      products.map(async (product) => {
        const foundProduct = await Product.findById(product._id);
        if (foundProduct) {
          return {
            ...product,
            stock: foundProduct.stock,
          };
        } else {
          return product;
        }
      })
    );

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error checking product stock:", error);
    res.status(500).json({ error: "An error occurred while checking product stock" });
  }
});

router.get('/count', async (req, res) => {
  try {
    const totalCount = await Product.countDocuments({});
    res.json({ totalCount });
  } catch (error) {
    console.error('Error fetching total products count:', error);
    res.status(500).json({ error: 'Error fetching total products count' });
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query;

  try {
    const foundProducts = await Product.find({
      title: { $regex: new RegExp(query, 'i') }, 
    });

    const totalCount = await Product.countDocuments({
      title: { $regex: new RegExp(query, 'i') },
    });

    res.json({ totalCount, products: foundProducts });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Error searching products' });
  }
});

router.post('/reserve', async (req, res) => {
  try {
    const { userEmail, products } = req.body;

    if (!userEmail || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid reservation data' });
    }

    // Iterate through each product in the array and process the reservation
    for (const productData of products) {
      const { productId, quantity } = productData;

      if (!productId || !quantity) {
        return res.status(400).json({ error: 'Invalid product data in the reservation' });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (quantity > product.stock) {
        return res.status(400).json({ error: 'Insufficient stock for reservation' });
      }

      const newReservation = new Reservation({
        userEmail: userEmail,
        product: productId,
        quantity: quantity,
      });

      await newReservation.save();

      product.stock -= quantity;
      await product.save();
    }

    res.status(201).json({ message: 'Reservation successful' });
  } catch (error) {
    console.error('Error making reservation:', error);
    res.status(500).json({ error: 'An error occurred while making the reservation' });
  }
});
router.put('/updateR', async (req, res) => {
  try {
    const { email, productId, quantity } = req.body;

    if (!email || !productId || !quantity) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const reservation = await Reservation.findOne({
      userEmail: email,
      product: productId,
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    const oldQuantity = reservation.quantity;
    reservation.quantity = quantity;
    await reservation.save();

    const quantityDifference = oldQuantity - quantity;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.stock += quantityDifference;
    await product.save();

    res.json({ message: 'Reservation updated successfully', reservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'An error occurred while updating the reservation' });
  }
});



router.delete('/clearReservations/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const reservations = await Reservation.find({ userEmail: email });

    if (reservations.length === 0) {
      return res.status(200).json({ message: 'No reservations found for the email' });
    }

    for (const reservation of reservations) {
      const product = await Product.findById(reservation.product);

      if (!product) {
        console.log(`Product not found for reservation with id: ${reservation._id}`);
        continue; 
      }
      product.stock += reservation.quantity;
      await product.save();

      await reservation.deleteOne();
    }

    res.status(200).json({ message: 'Reservations cleared and product stocks updated successfully' });
  } catch (error) {
    console.error('Error clearing reservations and updating stock:', error);
    res.status(500).json({ error: 'An error occurred while clearing reservations and updating stock' });
  }
});




router.delete('/clearReservationsO/:email', async (req, res) => {
  try {
    const { email } = req.params;

    
    const reservations = await Reservation.find({ userEmail: email });

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'No reservations found for the email' });
    }

   
    for (const reservation of reservations) {
      await reservation.deleteOne();
    }

    res.status(200).json({ message: 'Reservations cleared successfully' });
  } catch (error) {
    console.error('Error clearing reservations:', error);
    res.status(500).json({ error: 'An error occurred while clearing reservations' });
  }
});



module.exports = router;
