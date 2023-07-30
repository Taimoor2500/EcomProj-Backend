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

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { title, description, price, color, stock } = req.body;
    const image = req.file ? `http://localhost:5000/images/${req.file.filename}` : undefined;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product with the provided fields
    if (title) {
      product.title = title;
    }

    if (description) {
      product.description = description;
    }

    if (price) {
      product.price = price;
    }

    if (color) {
      product.color = color;
    }

    if (stock) {
      product.stock = stock;
    }

    if (image) {
      product.image = image;
    }

    // Save the updated product
    const updatedProduct = await product.save();

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'An error occurred while updating the product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
console.log(productId);
    
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    
    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'An error occurred while deleting the product' });
  }
});

module.exports = router;
