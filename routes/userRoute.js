const express = require("express")
const user_route = express()
const config = require('../config/config')
const auth = require("../middleware/auth")


user_route.set('view engine','ejs')
user_route.set('views','./views/user')
   

const userController = require("../controller/userController")
const cartController = require("../controller/cartController")
const orderController = require("../controller/orderController")
user_route.get('/',userController.homepage)
// user_route.get('/home',auth.isLogin,userController.homepage)



user_route.get('/signup',auth.isLogout,userController.registration)
user_route.post('/signup',auth.isLogout,userController.insertUser)
user_route.get('/otp',userController.otplogin)


user_route.get('/login',auth.isLogout,userController.login)
user_route.get('/logout',userController.userlogout)
user_route.post('/login',auth.isLogout,userController.getLogin)


user_route.get('/verify',auth.isLogout,userController.verifymail)



user_route.get('/products',userController.productspage)

user_route.get('/singleproduct',userController.singleproduct)

user_route.post('/checkWallet',userController.checkWallet)
user_route.post("/verifyPayment", userController.verifyPayment);





user_route.get('/profile',userController.showprofile)

// user_route.get( "/cart",auth.isLogin,cartController.loadCart);
// user_route.post( "/addToCart/:id",cartController.addToCart);
// user_route.post(  "/removeCart",cartController.deleteCartItem);

user_route.get("/cart", cartController.getcart);
user_route.patch("/addtocart", cartController.addtocart);
user_route.post("/deleteCart", cartController.deleteCart);
user_route.post("/changeQty",cartController.changeQty);

//wishlist
user_route.get("/wishlist", userController.wishlist);

//post-otp
user_route.post('/post-otp',userController.post_otp)

user_route.post('/incrementCart',cartController.incCart)
user_route.post('/decrementCart',cartController.decCart)

// checkout
user_route.get('/checkout',userController.checkout);
user_route.post("/addAddress",userController.postAddress);

user_route.get("/delete-address",userController.deleteAddress);

user_route.get("/orderplaced",userController.confermation);
user_route.get("/orderfailed",userController.orderfailed)

user_route.get('/orders',userController.getOrder)
user_route.get("/singleorder",userController.singleorder);

user_route.get('/cancelOrder',orderController.cancelOrder)

user_route.get("/returnOrder",orderController.returnOrder)
user_route.get("/returnpage",orderController.returnpage)
user_route.post('/returnSubmit',orderController.returnFormPost);

  
user_route.post("/placeorder",userController.postPlaceOrder);

user_route.get('/verify/:id',userController.checktest)
//apply coupon
user_route.post("/applycoupon", userController.applycoupon)

// user_route.get("/404",userController.get404)


module.exports = user_route;