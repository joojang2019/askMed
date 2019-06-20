var mongoose = require("mongoose");

//SCHEMA SETUP
var medicationSchema = new mongoose.Schema({
    name: String,
    medicationPrice: String,
    image: String,
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt:{ type : Date, default: Date.now },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    tradeName:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TradeName"
        }
    ],
    rating:[
        {
            type: Number,
            default: 0
        }
        ],
    comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
});


module.exports =  mongoose.model("Medication", medicationSchema);