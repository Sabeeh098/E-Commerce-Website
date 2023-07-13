const Cart = require("../model/cartModel");
const productcollection = require("../model/productModel");
const User = require("../model/userModel");


const getUpdatedCartSection = async (req, res) => {
  try {
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user });
      const id = user._id;
      const cart = await Cart.findOne({ user: id });
      if (cart) {
        const userData = await User.findOne({ _id: req.session.user });
        const cartData = await Cart.findOne({ user: userData._id })
          .populate("product.productId")
          .lean();
        if (cartData) {
          let total;
          if (cartData.product.length !== 0) {
            const totalResult = await Cart.aggregate([
              {
                $match: { user: userData._id },
              },
              {
                $unwind: "$product",
              },
              {
                $project: {
                  price: "$product.price",
                  quantity: "$product.quantity",
                  image: "$product.image",
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: ["$quantity", "$price"],
                    },
                  },
                },
              },
            ]).exec();
            total = totalResult[0].total;
            res.render("cart_section", {
              data: cartData.product,
              userId: userData._id,
              total: total,
              cartData: cartData,
            });
          } else {
            res.render("cart", { data2: "hi" });
          }
        } else {
          res.render("cart", { data2: "hi" });
        }
      } else {
        res.render("cart", { data2: "hi" });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const getcart = async (req, res) => {
  try {
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user });
      const id = user._id;
      const cart = await Cart.findOne({ user: id });
      if (cart) {
        const userData = await User.findOne({ _id: req.session.user });
        const cartData = await Cart.findOne({ user: userData._id })
          .populate("product.productId")
          .lean();
        if (cartData) {
          let total;
          if (cartData.product.length !== 0) {
            const totalResult = await Cart.aggregate([
              {
                $match: { user: userData._id },
              },
              {
                $unwind: "$product",
              },
              {
                $project: {
                  price: "$product.price",
                  quantity: "$product.quantity",
                  image: "$product.image",
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: ["$quantity", "$price"],
                    },
                  },
                },
              },
            ]).exec();
            total = totalResult[0].total;
            res.render("cart", {
              user: req.session.name,
              data: cartData.product,
              userId: userData._id,
              total: total,
              cartData: cartData,
            });
          } else {
            res.render("cart", { user: req.session.name, data2: "hi" });
          }
        } else {
          res.render("cart", { user: req.session.name, data2: "hi" });
        }
      } else {
        res.render("cart", {
          user: req.session.name,
          data2: "hi",
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addtocart = async (req, res) => {
  try {
    if (req.session.user) {
      const productId = req.body.id;
      const userName = req.session.user;
      const userdata = await User.findOne({ _id: userName });
      const userId = userdata._id;
      const productData = await productcollection.findById(productId);
      if(productData.quantity>0){
        const userCart = await Cart.findOne({ user: userId });
        if (userCart) {
          const productExist = userCart.product.findIndex(
            (product) => product.productId.toString() === productId
          );
          if (productExist !== -1) {
            await Cart.findOneAndUpdate(
              { user: userId, "product.productId": productId },
              { $inc: { "product.$.quantity": 1 } }
            );
          } else {
            await Cart.findOneAndUpdate(
              { user: userId },
              {
                $push: {
                  product: {
                    productId: productId,
                    price: productData.price,
                  },
                },
              }
            );
          }
        } else {
          const data = new Cart({
            user: userId,
            product: [
              {
                productId: productId,
                price: productData.price,
              },
            ],
          });
          await data.save();
        }
        res.json({ success: true });
      } else {
        res.json({failed:true})
      }
     
    } else {
      res.json({ failed: "signupplss" });
    }
  } catch (error) {
    res.json({ error: "Internal Server Error" });
  }
};


const deleteCart = async (req, res) => {
  try {
    const id = req.body.id;
    const data = await Cart.findOneAndUpdate(
      { "product.productId": id },
      { $pull: { product: { productId: id } } }
    );
    if (data) {
      res.json({ success: true });
    }
  } catch (error) {
    res.json({ error: "Internal Server Error" });
  }
};


const changeQty = async (req, res) => {
  try {
    const userId = req.body.user;
    const productId = req.body.product;
    const value = Number(req.body.value);
    const stockAvailable = await productcollection.findById(productId);
    if (stockAvailable.quantity >= value) {
      await Cart.updateOne(
        {
          user: userId,
          "product.productId": productId,
        },
        {
          $set: { "product.$.quantity": value },
        }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: "Internal Server Error" });
  }
};


const incCart = async (req, res, next) => {
  try {
    const userId = req.session.user;
    const productId = req.body.productId;

    const cart = await Cart.findOneAndUpdate(
      { user: userId, 'product.productId': productId },
      { $inc: { 'product.$.quantity': 1 } },
      { new: true }
    );
    res.json({ message: 'Cart updated', cart, success: true });
  } catch (error) {
    next(error);
  }
};


const decCart = async (req, res, next) => {
  try {
    const userId = req.session.user;
    const productId = req.body.productId;
    

    const cart = await Cart.findOneAndUpdate(
      { user: userId, 'product.productId': productId },
      { $inc: { 'product.$.quantity': -1 } },
      { new: true }
    );
    if (cart && cart.product[req.body.index].quantity <= 0) {
      // If the quantity becomes 0, remove the product from the cart
      await Cart.updateOne(
        { user: userId },
        { $pull: { product: { productId } } }
      );
    }

    res.json({ message: 'Cart updated', cart, success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addtocart,
  getcart,
  deleteCart,
  changeQty,
  incCart,
  decCart,
  getUpdatedCartSection
};
