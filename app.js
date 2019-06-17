require('dotenv').config();

var express = require("express"),
    app=express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Vendor = require("./models/vendor"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    seedDB = require ("./seeds"),
    flash = require("connect-flash");
    
//requiring routes
var commentRoutes = require("./routes/comments"),
    reviewRoutes = require("./routes/reviews"),
    vendorRoutes = require("./routes/vendor"),
    indexRoutes = require("./routes/index"),
    prescriptionRoutes = require("./routes/prescription");
    
mongoose.connect("mongodb+srv://askMed:" + process.env.MONGOOSE_PASSWORD + "@cluster0-rmej0.mongodb.net/test?retryWrites=true&w=majority",{
	useNewUrlParser:true,
	useCreateIndex: true
}).then(() => {
	console.log("Connected to DB!");
}).catch(err => {
	console.log("error:", err.message);
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));   //to use the public directory.
app.use(methodOverride("_method"));
//seedDB();   //seed the database
app.use(flash());
app.locals.moment = require("moment");
 
//Passport Configuration
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

//using express router
app.use(indexRoutes);
app.use(prescriptionRoutes);
app.use("/vendors/:id/comments",commentRoutes);
app.use("/vendors", vendorRoutes);
app.use("/vendors/:id/reviews", reviewRoutes);


app.listen(3000, function(){
    console.log("The AskMed server has started!");
});

