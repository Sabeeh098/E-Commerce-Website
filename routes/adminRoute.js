const express = require("express")


//Multer Config
const path = require('path')
const multer = require('multer')
const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,path.join(__dirname, '../public/product_images'))
    },
    filename : (req,file,cb)=>{
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})


const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
          file.mimetype == "image/png" ||
          file.mimetype == "image/jpg" ||
          file.mimetype == "image/jpeg" ||
          file.mimetype == "image/webp" 
          
        ) {
          cb(null, true);
        } else {
          cb(null, false);
          return cb(new Error("Only .png, .jpg and .jpeg .webp format allowed!"));
        }
      }
})


const admin_Route = express();

admin_Route.set('view engine','ejs');
admin_Route.set('views','./views/admin')

const adminController = require("../controller/adminController")
const orderController = require('../controller/orderController')
const couponController = require("../controller/couponController")
const bannerController = require("../controller/bannerController")
const sessionAdmin = require("../middleware/auth")
////////////admin login/////////////
admin_Route.get('/',sessionAdmin.notLogged,adminController.adminlogin);
admin_Route.post('/',adminController.verifyLogin)


admin_Route.get('/adhome',sessionAdmin.logged,adminController.adminhome);

admin_Route.get('/userslist',sessionAdmin.logged,adminController.loadusers)
admin_Route.get('/userstatus',sessionAdmin.logged,adminController.userActive)
//products
admin_Route.get('/addProducts',sessionAdmin.logged,adminController.getAddProducts)
admin_Route.post('/addProducts',upload.array('images',4),adminController.postAddProducts)


admin_Route.get('/products',sessionAdmin.logged,adminController.productsPage)
admin_Route.get('/deleteProduct',sessionAdmin.logged,adminController.deleteProduct)
admin_Route.get('/editProduct',sessionAdmin.logged,adminController.getEditProduct)
admin_Route.post('/editProduct',upload.array('images',4),adminController.postEditProduct)
admin_Route.get("/deleteimage",sessionAdmin.logged, adminController.deleteImage);



admin_Route.get('/category',sessionAdmin.logged,adminController.getCategory)
admin_Route.get('/addCategory',sessionAdmin.logged,adminController.getAddCategory)
admin_Route.post('/addCategory',adminController.postAddCategory)
admin_Route.get('/deleteCategory',sessionAdmin.logged,adminController.deleteCategory)
admin_Route.get('/orders',sessionAdmin.logged,orderController.getOrder);
admin_Route.post("/updateStatus",sessionAdmin.logged,orderController.updatestatus)
admin_Route.post('/update-product-status',sessionAdmin.logged,orderController.updateProductStatus)


admin_Route.get('/singleorder',sessionAdmin.logged,orderController.viewOrder)


admin_Route.get('/logout',sessionAdmin.logged,adminController.adminLogout)

///coupon
admin_Route.get('/editCoupon',sessionAdmin.logged,couponController.editCoupon)
admin_Route.post('/editCoupon',sessionAdmin.logged,couponController.updatedCoupon)
admin_Route.get("/coupon",sessionAdmin.logged,couponController.getCoupon)
admin_Route.get("/addcoupon",sessionAdmin.logged,couponController.updateCoupon)
admin_Route.post("/addcoupon",sessionAdmin.logged,couponController.updateCoupon)
admin_Route.get("/deleteCoupon",sessionAdmin.logged,couponController.deleteCoupon);
admin_Route.get("/couponUnlist",sessionAdmin.logged,couponController.couponUnlist);



////banner
admin_Route.get("/banner",sessionAdmin.logged,bannerController.getBanner)
admin_Route.get('/addBanner',sessionAdmin.logged,bannerController.getAddBanner)
admin_Route.get('/showBanner',sessionAdmin.logged,bannerController.unlistBanner)
admin_Route.get("/deletebanner",sessionAdmin.logged,bannerController.deletebanner);
admin_Route.post('/addBanner',sessionAdmin.logged,upload.single('image'),bannerController.postAddBanner)


///sales report
admin_Route.get("/salesreport",sessionAdmin.logged,adminController.getSalesReport)
admin_Route.get("/sales",sessionAdmin.logged,adminController.sales)






module.exports = admin_Route;