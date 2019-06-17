
var express = require("express");
var router = express.Router();
var Vendor = require("../models/vendor");
var Comment = require("../models/comment");
var middleware = require("../middleware");    //will require index.js automatically
var NodeGeocoder = require('node-geocoder');
var Review = require("../models/review");
var multer = require('multer');

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname); //creating the name for the image
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'drhcip4sz', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX  - Show all vendors
router.get("/", function(req, res){
    var noMatch=null;
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery: 1;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search),'gi');
         Vendor.find({name: regex}, function(err, allVendors){
              if(err){
                  console.log(err);
              } else{
                  if(allVendors.length <1){
                      noMatch = "No vendors match that query, please try again.";
                  }
                    res.render("vendors/index",{vendors:allVendors, page: 'vendors', noMatch: noMatch});
                }
         });
    } else{
    
       //Get all vendors from DB
       Vendor.find({}).skip((perPage * pageNumber)-perPage).limit(perPage).exec(function(err, allVendors){
           Vendor.count().exec(function(err, count){
                if(err){
                    console.log(err);
                } else{
                    res.render("vendors/index",{
                        vendors:allVendors, 
                        page: 'vendors',
                        noMatch: noMatch, 
                        current: pageNumber, 
                        pages: Math.ceil(count/perPage)});
                    }
            });
        });
    }
});

//CREATE - add new vendor to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {  // get data from form and add to vendors array
   var name = req.body.name;
   var image = req.body.image;
   
     var desc = req.body.description;
     var author = {
       id: req.user._id,
       username: req.user.username
    };
    var price = req.body.price;
    
  geocoder.geocode(req.body.location, function (err, data) {
             
     if (err || !data.length) {
              req.flash('error', 'Invalid address');
              console.log(err, data);
              return res.redirect('back');
       }
       
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
      
    cloudinary.v2.uploader.upload(req.file.path, function(error,result) {
      // add cloudinary url for the image to the vendor object under image property
      image = result.secure_url;  
      var imageId = result.public_id;
      var newVendor = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng, imageId: imageId };
   
    Vendor.create(newVendor, function(err, newlyCreated){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        } else {
            //redirect back to vendors page
            req.flash("success", "Successfully Updated!");
            res.redirect("/vendors");
        }
    });
  });
});
});

//NEW - show form to create new vendor
router.get("/new",middleware.isLoggedIn,function(req, res){
   res.render("vendors/new"); 
});



// SHOW - shows more info about one vendor
router.get("/:id", function(req, res){
   //find the vendor with provided ID
   Vendor.findById(req.params.id).populate("comments").populate({
       path: "reviews",
       options: {sort: {createdAt: -1}}
   }).exec(function(err, foundVendor){
       if(err){
           console.log(err);
       }else{
           res.render("vendors/show", {vendor: foundVendor});
       }
   });
   //render show template with that vendor
});

//EDIT Vendor Routes
router.get("/:id/edit", middleware.checkVendorOwnership, function(req, res){
    Vendor.findById(req.params.id, function(err, foundVendor){
        res.render("vendors/edit",{vendor: foundVendor});
    });
    });

// UPDATE VENDOR ROUTE
router.put("/:id", upload.single('vendor[image]'), middleware.checkVendorOwnership,  function(req, res){
  
  geocoder.geocode(req.body.vendor.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      console.log(err);
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    delete req.body.vemndor.rating;
    
    if (req.file) {
        cloudinary.uploader.upload(req.file.path, function (result) {
            req.body.vendor.image = result.secure_url;
       
            var newData = { name: req.body.vendor.name, image: req.body.vendor.image, description: req.body.vendor.description, price: req.body.vendor.price, location: location, lat: lat, lng: lng };


            //Updated Data Object
            Vendor.findByIdAndUpdate(req.params.id, newData, function (err, vendor) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);

                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");

                    //Redirects To Edited Vendor
                    res.redirect("/vendors/" + vendor._id);
                }
            }); //End Vendor/findBoyIdAndUpdate
        });
    }
    else{
        var newData = { name: req.body.vendor.name, image: req.body.vendor.image, description: req.body.vendor.description, price: req.body.vendor.price, location: location, lat: lat, lng: lng };
        Vendor.findByIdAndUpdate(req.params.id, newData, function (err, vendor) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);
                    console.og(err);
                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");

                    //Redirects To Edited vendor
                    res.redirect("/vendors/" + vendor._id);
                }
            }); //Ends Cloudinary Image Upload
        }
   });
});

// DESTROY VENDOR ROUTE
router.delete("/:id", middleware.checkVendorOwnership, function (req, res) {
    Vendor.findById(req.params.id, function (err, vendor) {
        if (err) {
            res.redirect("/vendors");
        } else {
            // deletes all comments associated with the vendor
            Comment.remove({"_id": {$in: vendor.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/vendors");
                }
                // deletes all reviews associated with the vendor
                Review.remove({"_id": {$in: vendor.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/vendors");
                    }
                    cloudinary.v2.uploader.destroy(vendor.image, function(err){
                        if (err) {
                            console.log(err);
                            return res.redirect("/vendors");
                        }
                        //delete the vendor
                            vendor.remove();
                            req.flash("success", "vendor deleted successfully!");
                            res.redirect("/vendors");
                    });
                });
                
            });
            
        }
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;