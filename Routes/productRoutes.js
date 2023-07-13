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

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);
    console.log('Fetched products:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching the products' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, color } = req.body;
    const image = req.file.filename;

    const newProduct = new Product({
      title,
      description,
      price,
      image: `http://localhost:5000/images/${image}`,
      color,
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'An error occurred while creating the product' });
  }
});

module.exports = router;
