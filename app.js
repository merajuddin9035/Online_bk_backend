require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Product = require('./product'); // Assuming the correct product schema
const authRoutes = require('./routes/Auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Check MongoDB URI in the environment
if (!process.env.MONGODB_URI) {
  console.error('MongoDB URI is not set in environment variables');
  process.exit(1); // Exit the process with failure if MongoDB URI is missing
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB', err));

// Authentication routes
app.use('/api/auth', authRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to OnlineBk API!');
});

// Create (POST) - Add a new product
app.post('/api/products', async (req, res) => {
  const { name, price, category, description } = req.body;

  // Basic validation
  if (!name || !price || !category || !description) {
    return res.status(400).json({ message: 'Name, price, category, and description are required' });
  }

  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error inserting product:', error);
    res.status(400).json({ message: 'Failed to insert product', error: error.message });
  }
});

// Get all products or filter by hotel (with pagination)
app.get('/api/products', async (req, res) => {
  const { hotel, page = 1, limit = 10 } = req.query; // Default pagination values

  let filter = {};
  if (hotel) {
    filter = { hotel };
  }

  try {
    const products = await Product.find(filter)
      .limit(limit * 1) // Convert limit to a number
      .skip((page - 1) * limit) // Pagination offset
      .exec();

    const count = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get best deals (assuming 'isBestDeal' is a field in your schema)
app.get('/api/best-deals', async (req, res) => {
  try {
    const bestDeals = await Product.find({ isBestDeal: true });
    res.status(200).json(bestDeals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch best deals', error: error.message });
  }
});

// Get featured products (assuming 'isFeatured' is a field in your schema)
app.get('/api/featured-products', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });
    res.status(200).json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured products', error: error.message });
  }
});

// Get a product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product details', error: error.message });
  }
});

// Update a product by ID
app.put('/api/products/:id', async (req, res) => {
  const { name, price, category, description } = req.body;

  // Ensure that the product update contains all the necessary fields
  if (!name || !price || !category || !description) {
    return res.status(400).json({ message: 'Name, price, category, and description are required for update' });
  }

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update product', error: error.message });
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ category });
    if (products.length === 0) {
      return res.status(404).json({ message: `No products found for category: ${category}` });
    }
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: `Failed to fetch products by category: ${category}`, error: error.message });
  }
});

// Add or update product rating
app.post('/api/products/:id/rate', async (req, res) => {
  const { newRating } = req.body;

  // Validate the rating value
  if (!newRating || newRating < 1 || newRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate new average rating
    const totalRating = (product.rating.averageRating * product.rating.numberOfRatings) + newRating;
    const updatedNumberOfRatings = product.rating.numberOfRatings + 1;
    const updatedAverageRating = totalRating / updatedNumberOfRatings;

    // Update product ratings
    product.rating.averageRating = updatedAverageRating;
    product.rating.numberOfRatings = updatedNumberOfRatings;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update rating', error: error.message });
  }
});

// Delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
