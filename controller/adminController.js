const User = require("../model/userModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Order = require("../model/orderModel");

const bcrypt = require("bcrypt");

const adminlogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log("Error:", error);
  }
};
// const verifylogin = async (req,res)=>{
//     const email = req.body.email
//     const password = req.body.password

//     // const admindata
// }

////////Admin home///////
const adminhome = async (req, res) => {
  const orderData = await Order.find({ status: { $ne: "cancelled" } });
  let SubTotal = 0;
  orderData.forEach(function (value) {
    SubTotal = SubTotal + value.totalAmount;
  });
  const cod = await Order.find({ paymentMethod: "cod" }).count();
  const online = await Order.find({ paymentMethod: "online" }).count();
  const totalOrder = await Order.find({ status: { $ne: "cancelled" } }).count();
  const totalUser = await User.find().count();
  const totalProducts = await Product.find().count();
  const date = new Date();
  const year = date.getFullYear();
  const currentYear = new Date(year, 0, 1);
  const salesByYear = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentYear },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%m", date: "$createdAt" } },
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let sales = [];
  for (i = 1; i < 13; i++) {
    let result = true;
    for (j = 0; j < salesByYear.length; j++) {
      result = false;
      if (salesByYear[j]._id == i) {
        sales.push(salesByYear[j]);
        break;
      } else {
        result = true;
      }
    }
    if (result) {
      sales.push({ _id: i, total: 0, count: 0 });
    }
  }
  let yearChart = [];
  for (i = 0; i < sales.length; i++) {
    yearChart.push(sales[i].total);
  }
  res.render("dashboard", {
    data: orderData,
    total: SubTotal,
    cod,
    online,
    totalOrder,
    totalUser,
    totalProducts,
    yearChart,
  });
};

const loadusers = async (req, res) => {
  try {
    const users = await User.find({});
    res.render("userlist", { users });
  } catch (error) {
    console.log("Error:", error);
  }
};

////////////// USER ACTIVE ///////////////////
const userActive = async (req, res) => {
  try {
    const id = req.query.id;

    const userstatus = await User.findOne({ _id: id });
    if (userstatus.status) {
      await User.updateOne({ _id: id }, { $set: { status: false } });
      req.session.user = null;
    } else {
      await User.updateOne({ _id: id }, { $set: { status: true } });
    }
    res.redirect("/admin/userslist");
  } catch (error) {
    console.log(error.message);
  }
};

/////////////////////////END///////////////////////

////////////////////////////////////Login//////////

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login");
        } else {
          req.session.admin = userData._id;
          res.redirect("/admin/adhome");
        }
      } else {
        res.render("login", { message: "Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//////////end////////////////

////////product load//////
const productsPage = async (req, res) => {
  try {
    const proData = await Product.find().populate("category");
    res.render("products", { products: proData });
  } catch (error) {
    console.log("Error:", error);
  }
};

// Add Products

const getAddProducts = async (req, res) => {
  try {
    res.render("addProducts");
  } catch (error) {
    console.log(error);
  }
};

//post add products
const postAddProducts = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const categoryId = await Category.findOne({ name: category });
    let image = [];
    for (let i = 0; i < req.files.length; i++) {
      image[i] = req.files[i].filename;
    }
    const newProduct = new Product({
      productname: name,
      image: image,
      description: description,
      quantity: req.body.quantity,
      price: Number(price),
      category: categoryId,
    });
    const save = await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

// const deleteProduct = async (req, res) => {
//   try {
//     const id = req.query.id;
//     const deletedProduct = await Product.findByIdAndDelete(id);
//     if (deletedProduct) {
//       res.redirect("/admin/products");
//     } else {
//       // Handle case where the product was not found or couldn't be deleted
//       res.status(404).send("Product not found");
//     }
//   } catch (error) {
//     console.log(error);
//     // Handle other errors that occurred during the deletion process
//     res.status(500).send("Internal server error");
//   }
// };

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id });
    if (product.deleted) {
      const updatedProduct = await Product.updateOne(
        { _id: id },
        { $set: { deleted: false } }
      );
      res.redirect("/admin/products");
    } else {
      const updatedProduct = await Product.updateOne(
        { _id: id },
        { $set: { deleted: true } }
      );
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const product = await Product.findById(id);
    // const category = await Category.find();

    res.render("editProduct", {
      product: product,
      image: product.image,
    });
    // console.log(product.image+"sdfgg");
  } catch (error) {
    console.log(error.message);
  }
};

  /////post edit product////
const postEditProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const { name, description, price, quantity, category } = req.body;
    let images = [];

    // Get the existing product
    const product = await Product.findById(id);

    if (!product) {
      // Handle case where product is not found
      return res.status(404).send("Product not found");
    }

    // Add the existing images to the images array
    images = product.image;

    // Add new images to the images array
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }

    const categoryId = await Category.findOne({ name: category });

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productname: name,
        image: images,
        description: description,
        price: price || product.price,
        quantity: quantity,
        category: categoryId || product.category,
      },
      { new: true }
    );

    if (updatedProduct) {
      res.redirect("/admin/products");
    } else {
      res.render("editProduct", { message: "Failed to update product" });
    }
  } catch (error) {
    console.log(error);
  }
};

///category///
const getCategory = async (req, res) => {
  const data = await Category.find();
  if (data) {
    res.render("category", { data: data });
  }
};

const getAddCategory = async (req, res) => {
  res.render("addCategory");
};

const postAddCategory = async (req, res) => {
  try {
    const Name = req.body.name;
    const data = await Category.findOne({
      name: Name,
    });
    if (data) {
      res.render("addCategory", {
        message: "category is already defined",
      });
    } else {
      const data1 = await new Category({
        name: Name,
      });
      const result = await data1.save();
      if (result) {
        res.redirect("/admin/category");
      } else {
        res.render("admin/addCategory", {
          message: "ERror while adding to then database",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategory = async (req, res) => {
  const id = req.query.id;
  const data = await Category.findByIdAndRemove(id);
  if (data) {
    res.redirect("/admin/category");
  }
};
///admin logou
const adminLogout = async (req, res, next) => {
  try {
    req.session.admin = false;
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

//getSales Report
const getSalesReport = async (req, res) => {
  try {
    let start;
    let end;
    req.query.start ? (start = new Date(req.query.start)) : (start = null);
    req.query.end ? (end = new Date(req.query.end)) : (end = null);

    let matchQuery = { status: "Delivered" };

    if (start && end) {
      matchQuery.Date = { $gte: start, $lte: end };
    } else if (start) {
      matchQuery.Date = { $gte: start };
    } else if (end) {
      matchQuery.Date = { $lte: end };
    }

    const data = await Order.find(matchQuery).sort({ Date: -1 });
    let SubTotal = 0;
    data.forEach(function (value) {
      SubTotal += value.totalAmount;
    });

    res.render("salesreport", { data, total: SubTotal });
  } catch (error) {
    console.log(error.message);
  }
};
////sales
const sales = async (req, res) => {
  try {
    const { from, to } = req.query;
    let orderData = await Order.find();
    let SubTotal = 0;

    // calculate subtotal of all orders
    orderData.forEach(function (value) {
      SubTotal = SubTotal + value.totalAmount;
    });

    // filter orders by date range
    if (from && to) {
      orderData = await Order.find({
        Date: { $gte: new Date(from), $lte: new Date(to) },
      });
    }

    const status = await Order.find({ "product.status": { $exists: true } });
    const value = req.query.value || "ALL";

    if (value == "cod") {
      const data = await Order.find({ paymentMethod: "cod" });
      res.render("sales", { data, message: "COD", status, value });
    } else if (value == "online") {
      const data = await Order.find({ paymentMethod: "online" });
      res.render("sales", { data, message: "Online", status, value });
    } else {
      const data = orderData;
      res.render("sales", { data, status, value, total: SubTotal });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ...delete product image ...\\
const deleteImage = async (req, res) => {
  try {
    const productId = req.query.productId;
    
    const index = req.query.index;
    const deletedImage = await Product.updateOne(
      { _id: productId },
      { $unset: { [`image.${index}`]: "" } }
    );
    const deletedImages = await Product.updateOne(
      { _id: productId },
      { $pull: { image: null } }
    );

    res.redirect("/admin/editProduct?id=" + productId);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  adminLogout,
  adminlogin,
  adminhome,
  loadusers,
  userActive,
  verifyLogin,
  productsPage,
  getAddProducts,
  postAddProducts,
  deleteProduct,
  getEditProduct,
  postEditProduct,
  getCategory,
  getAddCategory,
  postAddCategory,
  deleteCategory,
  getSalesReport,
  sales,
  deleteImage
};
