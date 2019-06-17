var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    email: {type: String},
    resetPasswordToken: String,
    resetPasswordExpires: Date, 
    isAdmin: {type: Boolean, default: false},
    prescriptions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Prescription"
            }
        ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);