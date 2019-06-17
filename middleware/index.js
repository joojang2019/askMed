var Vendor = require("../models/vendor");
var Comment = require("../models/comment");
var Review = require("../models/review");

// all the middleware goes here
var middlewareObj = {}; 


middlewareObj.checkVendorOwnership = function(req, res, next){
     if(req.isAuthenticated()){
        Vendor.findById(req.params.id, function(err, foundVendor){
           if(err){
               res.redirect("back");
           } else{
              //does user own the vendor?
              if(foundVendor.author.id.equals(req.user._id) || req.user.isAdmin){
                 next();
              } else{
                  req.flash("error", "You don't have permission to do that");
                  res.redirect("back");
              }
           }
        });
    } else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};


middlewareObj.checkCommentOwnership = function(req, res, next){
     if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err){
               req.flash("error", "Vendor not found");
               res.redirect("back");
           } else{
              //does user own the vendor?
              if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                 next();
              } else{
                  req.flash("error", "You don't have permission to do that");
                  res.redirect("back");
              }
           }
        });
    } else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Vendor.findById(req.params.id).populate("reviews").exec(function (err, foundVendor) {
            if (err || !foundVendor) {
                req.flash("error", "Vendor not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundVendor.reviews
                var foundUserReview = foundVendor.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/vendors/" + foundVendor._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;