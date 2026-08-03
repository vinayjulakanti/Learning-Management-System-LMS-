const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
{
    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    subject:{
        type:String,
        default:"General"
    },

    message:{
        type:String,
        required:true
    },

    category:{
        type:String,
        default:"General"
    },

    priority:{
        type:String,
        default:"Medium"
    },

    rating:{
        type:Number,
        default:5
    }

},
{
    timestamps:true
});

module.exports = mongoose.model("Feedback", FeedbackSchema);