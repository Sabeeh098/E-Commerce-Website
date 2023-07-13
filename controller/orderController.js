const Order = require("../model/orderModel");
const User = require("../model/userModel");
const products = require("../model/productModel");
const Category = require('../model/categoryModel')

const getOrder = async (req, res) => {
  try {
    const orderData = await Order.find();
    res.render("orders", { orderData });
  } catch (error) {
    console.log(error.message);
  }
};

// view orders
const viewOrder = async (req, res) => {
  try {
    console.log('vaaaaaaaaaaaaaa');

    const orderId = req.query.id;
    // const orderData = await Order.findById(orderId).populate({
    //   path: 'product',
    //   populate: {
    //     path: 'productId'
    //   }
    // }).exec();;
    console.log(orderId,"iddddd")
    const orderData = await Order.findById(orderId).populate({
      path: 'product.productId',
      model: 'products',
    });
    // const orderData = await Order.findById(orderId).populate('product.productId');
    console.log(orderData,'tytytytytytytyt');
    const userId = orderData.user;
    const userData = await User.findById(userId);
    const uniqueId = orderData.orderId; // Get the unique ID from the orderId field
    res.render("singleorder", { orderData, userData, uniqueId });
  } catch (error) {
    console.log(error.message);
  }
};
//order status update------------------------------
const updatestatus = async (req, res) => {
  try {
    const status = req.body.status;
    const orderId = req.body.orderId;
    await Order.findByIdAndUpdate(orderId, { status: status });
    res.redirect("orders");
  } catch (error) {
    console.log(error.message);
  }
};
//cancel order---------------------------------
const cancelOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.query.id;
      const idLength = id.length;
      if (idLength != 24) {
        res.redirect("/IdMismatch");
      } else {
        const orderData = await Order.findById(id);
        if (orderData == null) {
          res.redirect("/IdMismatch");
        } else {
          if (orderData.paymentMethod === "cod" || orderData.paymentMethod === "online") {
            await User.findOneAndUpdate(
              { name: req.session.name },
              { $inc: { wallet: orderData.totalAmount } }
            );
          }

          const orderDataa = await Order.findByIdAndUpdate(id, {
            status: "cancelled",
          });

          if (orderDataa) {
            res.redirect("/orders");
          }
        }
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};


//rerturn order
const returnOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.query.id;
      const orderData = await Order.findById(id);
      const status = 'Return requested';

      // Check if the order was placed within the last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const orderDate = new Date(orderData.Date);
      if (orderDate < twoWeeksAgo) {
        throw new Error("Cannot return order after 2 weeks.");
      }

      if (
        orderData.paymentMethod == "cod" ||
        orderData.paymentMethod == "online" ||
        orderData.paymentMethod == "wallet"
      ) {
        // Set the order status to "returned" and save the return reason
        await Order.findByIdAndUpdate(id, {
          status: status,
          returnReason: '' // Clear the return reason initially
        });

        // Redirect to the return form page
        res.redirect(`/returnpage?id=${id}`);
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};



//checkWallet
const checkWallet = async (req, res) => {
  try {
    if (req.session.user) {
      const userData = await User.findOne({ name: req.session.name });
      const walleta = userData.wallet;
      if (walleta > 0) {
        res.json({ success: true, walleta });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/serverERR", { message: error.message });
    console.log(error.message);
  }
};


/////return order
const returnpage = async(req,res,next)=>{

  try {
    const id = req.query.id;
    
    const categoryData = await Category.find({status:true})
    const UserData = await User.findOne({})
    const userData = await User.findOne({})
    const orderData = await Order.findOne({_id:id})
   
    let message;
    res.render("returnproduct",{ 
      category: categoryData,
      order : orderData,
     
    })
  } catch (error) {
    console.log(error.message);
    next(error.message)
  }
}
const returnFormPost = async(req,res,next)=>{
  try {

    const id = req.query.id
    console.log(id);
    const buttonClickTime = req.body.button_click_time;
    const returnReason = req.body.return_reason; // New field
   
    const userData = await User.findOne({})

    const orderData = await Order.updateOne({_id:id},{$set:{returnReason:req.body.return_reason}})
   

  
    res.redirect("/order")

  }catch(error){
    next(error.message);
  }
}
const updateProductStatus = async (req,res) => {
  try {
      const status = req.body.status
      const orderId = req.body.orderId
      const productId = req.body.productId
      if(status == "Return Approved"){
          const order = await Order.findOne({_id : orderId, "product.productId" : productId}).populate("product.productId")
          const orderData = await Order.findById(orderId)
          if(orderData.paymentMethod == "COD"){
              const total = order.wallet 
              await User.findByIdAndUpdate(order.user, {$inc : {wallet : total}})
              await Order.findByIdAndUpdate(orderId, {$inc : {wallet : -total}})
          }else {
              const total = order.totalAmount + order.wallet 
              await User.findByIdAndUpdate(order.user, {$inc : {wallet : total}})
              await Order.findByIdAndUpdate(orderId, {$inc : {wallet : -total}})
          }
      }
      await Order.findOneAndUpdate({_id : orderId, "product.productId" : productId},{$set : {"product.$.status" : status}})
      await Order.findByIdAndUpdate(orderId,{status : status})
      res.redirect('/admin/singleorder')
  } catch (error) {
      console.log(error.message)
      res.render('user/505');
  }
}


module.exports = {
  getOrder,
  updatestatus,
  viewOrder,
  cancelOrder,
  returnOrder,
  checkWallet,
  returnpage,
  returnFormPost,
  updateProductStatus
};
