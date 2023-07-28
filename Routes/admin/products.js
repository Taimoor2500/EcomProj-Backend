const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../../Models/productModel');


const upload = multer({
  storage: multer.diskStorage({
    destination: 'D:/qbatch/Project/proj/src/images',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
  }),
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

router.get('/', async (req, res) => {
  const productsPerPage = 8; 
  const page = parseInt(req.query.page) || 1; 

  try {
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / productsPerPage);

   
    const skip = (page - 1) * productsPerPage;
    const limit = productsPerPage;

   
    const products = await Product.find({}).skip(skip).limit(limit);

    res.json({ products, count: totalProducts, totalPages }); 
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
