const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://bunothing1:98PNagUBrIxbeJ5M@cluster0.o7lbwp5.mongodb.net/UserManagement',{
  useNewUrlParser: true,
 useUnifiedTopology: true,
})
.then(()=>console.log("mongodb connected"))
 

const express = require('express');
const session = require('express-session')
const path = require('path')
const app = express();
const config = require('./config/config')

require('dotenv').config({path: __dirname + '/.env'})


app.use(
    session ({
      secret : config.sessionScret,
      saveUninitialized : true,
      resave : false,
      cookie : {
        maxAge : 1000 * 60 * 60 * 24,
      }
    }))
    app.use((req, res, next) => {
        res.set('Cache-control', `no-store,no-cache,must-revalidate`)
        next()
    })

const noCache = require('nocache')   
app.use(noCache());
app.use(express.json())
app.use(express.urlencoded({extended:true}))
//for user routes

const userRoutes = require('./routes/userRoute')
//for admin routs
const adminRoutes = require('./routes/adminRoute')


app.use(express.static(path.join(__dirname,'public')))

app.use("/",userRoutes)
//admin
app.use("/admin",adminRoutes)

app.use((req, res) => {
  res.status(404).render(path.join(__dirname, '404.ejs'));
});


app.listen(3000,function(){
    console.log("Server is Running...");
})