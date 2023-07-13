const Coupon = require("../model/couponModel");
//getcoupen----------
const getCoupon = async (req, res) => {
  try {
    const couponData = await Coupon.find();
    res.render("coupon", { couponData });
  } catch (error) {
    console.log(error.message);
  }
};

///Add Coupon
const getaddcoupon = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
  }
};

//...add-coupon update...\\
const updateCoupon = async (req, res) => {
  try {
    const name = req.body.couponName;
    const code = req.body.couponCode;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const currentDate = new Date();
    const minAmount = req.body.minAmount;
    const maxDiscount = req.body.maxDiscount;
    const quantity = req.body.quantity;
    

    if (!code || code.trim().length < 6) {
      return res.render("addCoupon");
    }
    if (startDate.getDate() <= currentDate.getDate()) {
      return res.render("addCoupon", {
        message: "start date must be after the current date",
      });
    }
    if (startDate.getDate() >= endDate.getDate()) {
      return res.render("addCoupon", {
        message: "End date must be after the start date",
      });
    }

    const existingCoupon = await Coupon.findOne({ couponCode: code });

    if (existingCoupon) {
      return res.render("addCoupon", { message: "Coupon already exists" });
    }

    const coupon = new Coupon({
      couponName: name,
      couponCode: code,
      startDate: startDate,
      endDate: endDate,
      maxDiscount: maxDiscount,
      minAmount: minAmount,
      quantity: quantity,
    });
    
    const couponData = await coupon.save();

    if (couponData) {
      res.redirect("coupon");
    } else {
      res.render("addCoupon", { message: "Failed to add new coupon" });
    }
  } catch (error) {
    console.log(error);
  }
};


//..delete-coupon..\\
const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.deleteOne({ _id: id });
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};

//...coupon_unlist,list...\\
const couponUnlist = async(req,res)=>{
  const id = req.query.id;
  const couponData = await Coupon.findById({_id:id});
  if(couponData.status===0){
      await Coupon.findByIdAndUpdate({_id:id},{$set:{status:1}})
  }else{
      await Coupon.findByIdAndUpdate({_id:id},{$set:{status:0}}) 
  }
  res.redirect('/admin/coupon')                                                                                                                                            
}



// /edit coupon

const editCoupon = async(req,res)=>{
  try{
      const id = req.query.id;
      const couponData = await Coupon.findById({_id:id});
      res.render('editCoupon',{couponData});
  }catch (error){
      console.log(error)
  }
}

const updatedCoupon = async(req,res)=>{
  try{
      const id = req.body.id
      const couponData = await Coupon.findByIdAndUpdate({_id:id},{$set:{
          couponNmae:req.body.couponName,
          couponCode:req.body.couponCode,
          startDate:req.body.startDate,
          endDate:req.body.endDate,
          maxDiscount:req.body.maxDiscount,
          quantity:req.body.quantity,
          minAmount:req.body.minAmount
      }});
      res.redirect('/admin/coupon');
  }
  catch (error){
      console.log(error)
  }
}
module.exports = {
  getCoupon,
  getaddcoupon,
  updateCoupon,
  deleteCoupon,
  couponUnlist,
  editCoupon,
  updatedCoupon
};
