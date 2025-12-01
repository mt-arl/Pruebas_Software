const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type:String, required:true, trim:true },
  email: { type:String, required:true, unique:true, lowercase:true },
  password: { type:String, required:true },
  role: { type:String, enum:["student","teacher","admin"], default:"student" },
  grades:[{
    subject:String,
    score:Number
  }]
},{ timestamps:true });

module.exports = mongoose.model("User", UserSchema);

