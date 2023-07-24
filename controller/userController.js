const User = require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
const Banner = require("../model/bannerModel");
const { v4: uuidv4 } = require("uuid");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const session = require("express-session");
const Razorpay = require("razorpay");

const express = require("express");
const { log } = require("util");
const app = express();

var instance = new Razorpay({
  key_id: "rzp_test_xhTD3DssF9089g",
  key_secret: "VCbRdEn0gmxTsGXfkc8HRH1m",
});

//Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken, {
  lazyLoading: true,
});

const securePassword = async (password) => {
  try {
    const passhash = await bcrypt.hash(password, 10);
    return passhash;
  } catch (error) {
    res.render("404");
  }
};

// for sending mail

const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "shoescart07@gmail.com",
        pass: "lwaewfrxwvdnmzom",
      },
    });

    const mailOptions = {
      from: "sabeehup@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<p> Please click <a href="http://localhost:3000/verify/${user_id}">here</a> to verify your email.</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.render("404");
      } else {
        console.log("Email Has been sent:-", info.response);
      }
    });
  } catch (error) {
    res.render("404");
  }
};

const homepage = async (req, res) => {
  try {
    const products = await Product.find({ deleted: true });
    const banner = await Banner.find();

    if (req.session.user) {
      const user = await User.findById(req.session.user);
      res.render("homepage", { products, banner, message: "user", user });
    } else {
      res.render("homepage", { products, banner });
    }
  } catch (error) {
    res.render("404");
  }
};

////User Signup///

const registration = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    res.render("404");
  }
};
const insertUser = async (req, res) => {
  try {
    const existemail = await User.findOne({ email: req.body.email });
    if (existemail) {
      res.render("registration", { message: "Email Already Exists" });
    } else {
      const userdata = new User({
        name: req.body.name,
        email: req.body.email,
        number: req.body.number,
        password: await securePassword(req.body.password),
      });

      const userData = await userdata.save();

      req.session.number = "+91" + req.body.number;
      req.session.email = req.body.email;

      if (userData) {
        //otp mobile verification
        await client.verify.v2
          .services(process.env.TWILIO_SERVICE_SID)
          .verifications.create({
            to: req.session.number,
            channel: "sms",
          });

        //email verification
        sendVerifyMail(req.body.name, req.body.email, userData._id);

        res.render("otp", {
          message: "Registration Successful, Please Verify your Email",
        });
      } else {
        res.render("registration", { message: "error" });
      }
    }
  } catch (error) {
    res.render("404");
  }
};

///otp

const otplogin = async (req, res) => {
  try {
    res.render("otp");
  } catch (error) {
    res.render("404");
  }
};

//post_otp
const post_otp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const number = req.session.number;
    const email = req.session.email;
    const result = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: number,
        code: otp,
      });
    if (result.valid === true) {
      await User.findOneAndUpdate(
        { email: email },
        {
          is_verified: 1,
        }
      );
      res.redirect("/login");
    } else {
      res.render("otp", { message: "Otp verification failed" });
    }
  } catch (error) {
    res.render("404");
  }
};

////userlogin//

const login = async (req, res) => {
  try {
    res.render("userlogin");
  } catch (error) {
    res.render("404");
  }
};

const getLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.status == false) {
        res.render("userlogin", { message: "Your account is blocked" });
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_verified == 1) {
          req.session.user = userData._id;
          req.session.name = userData.name;
          res.redirect("/");
        } else {
          res.render("userlogin", { message: "Please verify your account" });
        }
      } else {
        res.render("userlogin", { message: "Incorrect password" });
      }
    } else {
      res.render("userlogin", { message: "Your email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifymail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );

    res.render("email-Verified");
  } catch (error) {
    res.render("404");
  }
};

const userlogout = async (req, res, next) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

const productspage = async (req, res) => {
  try {
    const category = req.query.category?{category:req.query.category}:{};
    console.log(category)
    const products = await Product.find(category).populate("category");
    console.log(products.length)
    if (req.session.user) {
      const user = await User.findById(req.session.user);
      res.render("products", { products, message: "user", user });
    } else {
      res.render("products", { products });
    }
  } catch (error) {
    res.render("404");
  }
};

const showprofile = async (req, res) => {
  try {
    if (req.session.user) {
      const userData = await User.findOne({ name: req.session.name });
      let datawallet = await User.find({ _id: req.session.user });
      const wallehistory = datawallet;

      if (req.session.user) {
        const user = await User.findById(req.session.user);
        res.render("profile", {
          data: userData,
          wallet: userData.wallet,
          message: "user",
          user,
        });
      } else {
        res.render("profile", { data: userData });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};

////shop products

const products = async (req, res) => {
  try {
    res.render("products");
  } catch (error) {
    res.render("404");
  }
};

//single product page------------
const singleproduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const productInfo = await Product.findOne({ _id: productId }).populate(
      "category"
    );
    res.render("singleproduct", { productData: productInfo });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

//get checkout
const checkout = async (req, res) => {
  try {
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user });
      const id = user._id;
      const cartData = await Cart.findOne({ user: id }).populate(
        "product.productId"
      );
      let Total;
      if (cartData.product != 0) {
        const total = await Cart.aggregate([
          {
            $match: { user: user._id },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              price: "$product.price",
              quantity: "$product.quantity",
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
        Total = total[0].total;
        //pass the data to front
        const data = await User.findOne({
          name: req.session.name,
        });
        res.render("checkout", {
          address: data.address,
          total: Total,
          wallet: data.wallet,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//postAdrress
const postAddress = async (req, res) => {
  try {
    if (req.session.user) {
      const { name, country, town, district, postcode, phone } = req.body;
      const id = req.session.user;
      const data = await User.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            address: {
              name: name,
              country: country,
              town: town,
              district: district,
              postcode: postcode,
              phone: phone,
            },
          },
        },
        { new: true }
      );
      res.redirect("/checkout");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.render("404");
  }
};
//deleteAddress
const deleteAddress = async (req, res) => {
  try {
    if (req.session.user) {
      const userName = req.session.name;
      const id = req.query.id;
      await User.updateOne(
        { name: userName },
        {
          $pull: {
            address: {
              _id: id,
            },
          },
        }
      );
      res.redirect("/checkout");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.render("404");
  }
};

//confermation after checkout
const confermation = async (req, res) => {
  try {
    const orderData = await Order.findOne().sort({ Date: -1 }).limit(1);
    const userId = orderData.user;
    res.render("orderplaced", { user: orderData });
  } catch (error) {
    console.log(error.message);
  }
};

// applya coupon//
const applycoupon = async (req, res) => {
  try {
    let code = req.body.code;
    let amount = req.body.amount;
    let userData = await User.find({ name: req.session.name });
    let userexist = await Coupon.findOne({
      couponCode: code,
      used: { $in: [userData._id] },
    });
    if (userexist) {
      const couponData = await Coupon.findOne({ couponCode: code });
      if (couponData) {
        if (couponData.endDate >= new Date()) {
          if (couponData.quantity != 0) {
            if (couponData.minAmount <= amount) {
              let discountvalue1 = couponData.maxDiscount;
              let distotal = Math.round(amount - discountvalue1);
              let percentagevalue = (discountvalue1 / amount) * 100;
              const discountvalue = parseFloat(percentagevalue.toFixed(2));
              let couponId = couponData._id;
              await Coupon.findByIdAndUpdate(couponId, {
                quantity: parseInt(couponData.quantity) - parseInt(1),
              });

              res.json({
                couponokey: true,
                distotal,
                discountvalue,
                code,
              });
            } else {
              res.json({ cartamount: true });
            }
          } else {
            res.json({ limit: true });
          }
        } else {
          res.json({ expire: true });
        }
      } else {
        res.json({ invalid: true });
      }
    } else {
      res.json({ user: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//cash on deivery--------
const postPlaceOrder = async (req, res) => {
  try {
    console.log("baa baa black sheep");
    if (req.session.user) {
      console.log("fffffff", req.body.total, "ttttttttttttttttttt");
      const { total, address, payment, wallet, totalBefore } = {
        total: req.body.total.trim(),
        address: req.body.address,
        payment: req.body.payment,
        wallet: req.body.wallet,
        totalBefore: req.body.totalBefore,
      };
      const user = await User.findOne({
        name: req.session.name,
      });
      //   if (address === null) {
      //     res.json({ codFailed: true });
      //     return;
      //   }
      const cartData = await Cart.findOne({ user: user._id });
      const products = cartData.product;
      let status = payment == "cod" ? "placed" : "pending";

      const hasZeroQuantity = products.find(
        (product) => product.quantity === 0
      );
      if (hasZeroQuantity) {
        res.json({ error: "ZeroQuantityError" });
        return;
      }

      const orderId = generateUniqueID();
      const reduced = user.wallet - total;
      console.log(reduced,'reducedd');

      if (payment == "wallet") {
        status = "placed";
        await User.findOneAndUpdate(
          { name: req.session.name },
          {
            $set: { wallet: reduced },
          }
        );
      console.log('updateddd');
      }
        const orderNew = new Order({
          orderId: orderId,
          deliveryDetails: address,
          totalAmount: total,
          status: status,
          user: user._id,
          paymentMethod: payment,
          product: products,
          wallet: wallet,
          totalBefore: totalBefore,
          discount: 0,
          Date: new Date(),
          couponCode: "",
        });
        console.log(orderNew,'orderneww heree');

        await orderNew.save();
   
        if (orderNew.status == "placed") {

          const couponData = await Coupon.findById(req.session.couponId);
          if (couponData) {
            let newLimit = couponData.limit - 1;
            await Coupon.findByIdAndUpdate(couponData._id, {
              limit: newLimit,
            });
          }
     

          await Cart.deleteOne({ user: user._id });
          for (i = 0; i < products.length; i++) {
            const productId = products[i].productId;
            const quantity = Number(products[i].quantity);
            await Product.findByIdAndUpdate(productId, {
              $inc: { quantity: -quantity },
            });
          }
    

          res.json({ codSuccess: true });
        } else {
          var options = {
            amount: total * 100,
            currency: "INR",
            receipt: "" + orderId,
          };
          console.log('hererere in  rzpyyyr');

          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            }
            res.json({ order });
          });
        }
      } else {
        res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "ServerError" });
  }
};

// Function to generate a 6-digit unique ID
function generateUniqueID() {
  const min = 100000; // Minimum 6-digit number
  const max = 999999; // Maximum 6-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

////404
const get404 = async (req, res) => {
  res.render("404");
};
//checkWallet
const checkWallet = async (req, res) => {
  try {
    if (req.session.user) {
      const amount = req.body.amount;
      const userData = await User.findOne({ name: req.session.name });
      const walleta = userData.wallet;
      const reduced = walleta - amount;
      if (walleta >= amount) {
        //  await User.findOneAndUpdate({ name: req.session.name },{
        //   $set:{wallet:reduced}
        //  });
        res.json({ success: true, walleta });
      }
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};

// verify online payment
const verifyPayment = async (req, res) => {
  try {
    if (req.session.user) {
      let userData = await User.findOne({ name: req.session.name });
      const cartData = await Cart.findOne({ user: userData._id });
      const product = cartData.product;
      const details = req.body;
      const crypto = require("crypto");
      console.log('here in verfy pymnt bckndd111');
      let hmac1 = crypto.createHmac("sha256", "VCbRdEn0gmxTsGXfkc8HRH1m");
      hmac1.update(
        details.payment.razorpay_order_id +
          "|" +
          details.payment.razorpay_payment_id
      );
      hmac1 = hmac1.digest("hex");
      console.log('here in verfy pymnt bckndd222');
      if (hmac1 == details.payment.razorpay_signature) {
        let orderReceipt = details.order.receipt;
        // const newOrder = await Order.find().sort({ date: -1 }).limit(1);
        // const hai = newOrder.map((value) => {
        //   return value._id;
        // });
        console.log(orderReceipt,'orderrecpttt');
        const order = await Order.findOne({orderId: orderReceipt });
console.log(order,'haaaiii httt');
        let test1 = await Order.findOneAndUpdate(
          { orderId: orderReceipt },
          { $set: { paymentId: details.payment.razorpay_payment_id,
          status:'placed' } }
        ).then((value) => {});
console.log(test1);
// let test2 = await Order.findByIdAndUpdate(orderReceipt, {
//   $set: { status: "placed" },
// });
console.log('87678987668');
        await Cart.deleteOne({ user: userData._id });
        console.log('here in verfy pymnt bckndd33');
        for (i = 0; i < product.length; i++) {
          const productId = product[i].productId;
          const quantity = Number(product[i].quantity);
          await Product.findByIdAndUpdate(productId, {
            $inc: { quantity: -quantity },
          });
        }
        res.json({ success: true });
      } else {
        await Order.deleteOne({ _id: details.order.receipt });
        res.json({ onlineSuccess: true });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    // res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};

//get order//
const getOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const userData = await User.findOne({ name: req.session.name });
      const orderData = await Order.find({ user: userData._id });
      res.render("order", { user: req.session.name, data: orderData });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const singleorder = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.query.id;
      const idLength = id.length;
      if (idLength != 24) {
        res.redirect("/IdMismatch");
      } else {
        const orderData = await Order.findById(id).populate({
          path: "product.productId",
          model: "products",
        });
        if (orderData == null) {
          res.redirect("/IdMismatch");
        } else {
          res.render("singleorder", { data: orderData.product, orderData });
        }
      }
    } else {
      res.redirect("login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const checktest = async (req, res, next) => {
  try {
    let updated = await User.updateOne(
      { _id: req.params.id },
      { $set: { is_verified: 1 } }
    );

    res.render("email-Verified");
  } catch (error) {
    console.log(error.message);
  }
};
/////return order
const returnpage = async(req,res,next)=>{

  try {
    const id = req.query.id;
    
    const categoryData = await category.find({status:true})
    const UserData = await User.findOne({})
    const userData = await User.findOne({})
    const orderData = await order.findOne({_id:id})
   
    let message;
    res.render("returnForm",{ 
      category: categoryData,
      order : orderData,
     
    })
  } catch (error) {
    console.log(error.message);
    next(error.message)
  }
}

const wishlist = async (req, res) => {
  try {
    res.render("wishlist");
  } catch (error) {
    console.log(error.message);
  }
};
///order failed
const orderfailed = async (req, res) => {
  try {
    const orderData = await Order.findOne().sort({ Date: -1 }).limit(1);
    const userId = orderData.user;
    res.render("orderFailed", { user: orderData });
  } catch (error) {}
};



module.exports = {
  singleproduct,
  showprofile,
  registration,
  otplogin,
  insertUser,
  login,
  userlogout,
  getLogin,
  homepage,
  verifymail,
  productspage,
  post_otp,
  checkout,
  postAddress,
  deleteAddress,
  confermation,
  postPlaceOrder,
  get404,
  applycoupon,
  checkWallet,
  verifyPayment,
  getOrder,
  singleorder,
  checktest,
  wishlist,
  returnpage,
  orderfailed,
};
