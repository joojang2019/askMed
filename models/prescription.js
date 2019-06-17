var mongoose = require("mongoose");

var prescriptionSchema = mongoose.Schema({
    medication: String,
    createdAt:{ type : Date, default: Date.now }
    
});



module.exports = mongoose.model("Prescription", prescriptionSchema);