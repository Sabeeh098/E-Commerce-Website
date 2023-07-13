const User = require('../model/userModel')

const isLogin = async(req,res,next)=>{
    try{
        if(req.session.user){
            next();
        }
        else{
            res.redirect('/')
        }
    }catch (error){
        console.log(error.message)
    }
}

const isLogout = async(req,res,next)=>{
    try{
        if(req.session.user){
            res.redirect('/');
        }
        else{
        next();
        }

    }catch (error){
        console.log(error.message)
    }
}


/////////admin////////////
const notLogged = async (req,res,next)=>{
    try {
        if(req.session.admin){
            res.redirect("/admin/adhome")
        }else{
            next()
        }
    } catch (error) {
        next(error)
    }
}
const logged = async(req,res,next)=>{
    try {
        if(req.session.admin){
            next()
        }else{
            res.redirect("/admin")
        }
    } catch (error) {
        
    }
}
module.exports ={
    isLogin,
    isLogout,
    notLogged,
    logged
}