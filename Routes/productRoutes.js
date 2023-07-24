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

module.exports = router;
