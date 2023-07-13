const mongoose = require('mongoose');

 const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    number:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:false,
        default:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_admin:{
        type:Number,
        default:0
    },
    address:[{
        name:{
            type:String,
            required:true,

        },
        phone:{
            type:String,
            required:true,
        },
        conutry:{
            type:String,
            required:true,
        },
        town:{
            type:String,
            required:true,
        },
        street: {
            type: String,
            required: true,
        },
        district:{
            type:String,
            required:true,
        },
        postcode:{
            type:String,
            required:true,
        },
    
    }],
    wallet: {
        type: Number,
        default: 0
    }
    

});
// module.exports = mongoose('User',userSchema)
module.exports = mongoose.model('User', userSchema);
